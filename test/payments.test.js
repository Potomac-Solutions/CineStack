// Paying on the platform's page: the test page until Stripe is set up, then Stripe Checkout
// (cards, and Link), by one setting. Stripe is faked here (its calls are the kit's, tested
// there); the trip is real.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.js';
import { served } from './http-client.js';

const dir = mkdtempSync(join(tmpdir(), 'cinestack-pay-'));
after(() => rmSync(dir, { recursive: true, force: true }));
const COST = { N: 2 ** 10, r: 8, p: 1 };
const SECRET = 'test-secret-of-at-least-thirty-two-characters';

test('the same seats on Stripe once its key is there: off to Stripe Checkout, back, a ticket once, the webhook too', async () => {
  const calls = [];
  let paid = false;
  const stripe = async (url, init = {}) => {
    const path = new URL(url).pathname;
    calls.push({ path, form: init.body ? Object.fromEntries(new URLSearchParams(String(init.body))) : null });
    if (path === '/v1/checkout/sessions') return Response.json({ id: 'cs_test_9', url: 'https://checkout.stripe.com/c/pay/cs_test_9' });
    if (path === '/v1/checkout/sessions/cs_test_9') return Response.json({ id: 'cs_test_9', status: 'open', payment_status: paid ? 'paid' : 'unpaid', amount_total: Number(calls[0].form['line_items[0][price_data][unit_amount]']), currency: 'usd', payment_intent: 'pi_9' });
    return new Response('{}', { status: 404 });
  };
  const s = await served(await createApp({ staffCost: COST, db: join(dir, 'stripe.db'), cache: false, secret: SECRET, payEnv: { PAY_STRIPE_KEY: 'sk_test_fake' }, payFetch: stripe }));
  try {
    assert.equal(s.server.payments.name, 'stripe');
    const showing = s.server.boxOffice.showings()[0].id;
    const hall = s.server.boxOffice.hall(s.server.boxOffice.showing(showing).auditorium);
    const seat = hall.layout.flatMap((row) => row.cells.filter((cell) => !cell.gap).map((cell) => cell.id))[0];
    const chose = await s.call('/_zb/action/seat-chart/choose', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json', 'sec-fetch-site': 'same-origin' }, body: new URLSearchParams({ showing, seat }) });
    assert.ok(chose.status < 300, chose.text);
    const page = (await s.call(`/book/${showing}`)).text;
    assert.match(page, /You’ll pay on Stripe’s secure page next, in its test mode: no money moves\. We never see your card number\./);
    const key = /name="checkout" value="(b[a-z0-9]+)"/.exec(page)[1];
    const sent = await s.post(`/book/${showing}`, { checkout: key, name: 'Rosa', email: 'rosa@example.com' });
    assert.equal(sent.location, 'https://checkout.stripe.com/c/pay/cs_test_9');
    assert.equal(calls[0].form.success_url, `${s.base}/pay/back?booking=${key}`);
    assert.match(calls[0].form['line_items[0][price_data][product_data][name]'], /^CineStack tickets: /);

    paid = true;
    assert.equal((await s.call(`/pay/back?booking=${key}`)).location, `/ticket/${key}`);
    assert.equal(s.server.boxOffice.taken(showing).get(seat).state, 'sold');
    const webhook = await s.call('/pay/webhook', { method: 'POST', body: JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_9' } } }) });
    assert.equal(webhook.status, 200);
    assert.equal(s.server.sent.filter((mail) => mail.body.includes(`/ticket/${key}`)).length, 1, 'one email');
  } finally {
    await s.close();
  }
});
