# CineStack

A movie theatre on one small Node server: showtimes, seats, tickets and the door, and (next) snacks and the manager's admin panel. Built with [Zubra](https://github.com/zubra-js/zubra).

The theatre configured in it, Hemlock Ridge Cinema 8, is made up. Nothing in it is really for sale.

## What works today

Choosing seats for a showing, paying for them, getting a ticket, and being let in at the door.

- Every seat is a real checkbox in a form, so it works without JavaScript, with a keyboard and with a screen reader.
- With JavaScript, a tap holds the seat at once, and everyone else looking at the showing sees it go without reloading.
- Two people who tap the same seat at the same moment: the server gives it to one and tells the other.
- A hold lasts five minutes. When it runs out, the server lets the seat go and every phone sees it come back.
- Held seats show a **Book** button with the total. Paying is on Stripe Checkout (cards, and Link); until Stripe is set up, on the kit’s test page, where no money moves (see Paying, below). Once paid, the seats are sold for everyone, and the guest gets a ticket page with a QR code for the door.
- Backing out of the payment page books nothing and keeps the seats held, to try again. A hold that runs out before paying books nothing.
- **The door** (`/staff/door`) scans a ticket once. A photo of the ticket's code (on a phone, the photo picker opens the camera) is decoded in the browser by symbology's WebAssembly decoder, or the code can be typed, with or without JavaScript. The door sees what to let in: the film, time, auditorium and seats, never who booked. A second scan says when the ticket was first used, and two doors scanning at the same moment let it in once. The guest's ticket page shows "Used at 7:41 PM" as it happens.
- **Staff accounts** are the Potomac kit's `staff` and `staff/pages`. A new theatre prints a one-time link for its first owner when the server starts; the owner invites the rest from **People**, with a link for each that works once. Passwords are hashed with scrypt, sessions can be ended, five wrong passwords lock an email for fifteen minutes, and none of it is ever in a page's Sync scope.
- A page reads only what it shows: every showing's seats and holds, and the guest's own tickets. Bookings, payments and other guests' tickets (with their names and emails) never leave the server.
- **Guest accounts** are the kit's `customers`. Sign up, sign in or reset a password (the link goes to the admin's **Outbox**). Tickets bought in that browser join the account. Signed in on any device, they're all there, and the payment page fills in the name and email.
- **The admin** (`/admin`, staff sign-in) shows tonight at a glance: seats sold against capacity, how many tickets have been scanned, how full each showing is, the box office against the month before, and staff activity. It lists every ticket (search, filters, CSV) and every guest account. Managers also see reports by night or week (by film, auditorium, time of night and day of the week, with CSV), set the seat price and read the outbox.
- A seat's price is $11.00 unless a manager changes it. A new price applies to seats chosen from then on. Each ticket keeps what it was for (film, time, auditorium), so the reports can read it after that night's showings are gone. Price rules (adult, child, matinee, discount day, 3D) come in the prices milestone.

## Try it

`npm install`, then `npm run demo`: it adds thirteen weeks of made-up past tickets, forty guest accounts and tonight's bookings (made the real way), and starts the server. It prints three sign-ins, for this machine only. The manager is `manager@example.com` / `hemlock-manager-demo` and door staff is `door@example.com` / `hemlock-door-demo`, both at `/admin`. The guest is `riley@example.com` / `hemlock-guest-demo` at `/account`. `npm start` alone keeps what's there. `npm run seed -- --fresh` starts over.

Open http://localhost:3000. Two browser windows side by side (one of them private, so it's another guest) show the live parts best.

1. **Pick a showing** from Tonight. Tap a few seats. In the other window, open the same showing: your seats show as taken there, and change as you tap.
2. **Book.** The bar under the map says what you hold and the total. Press **Book**, fill in a name and email, and pay with any card number (`4000 0000 0000 0002` is declined, to see that). You get a ticket with a QR code, and your seats are sold for everyone.
3. **Find it again.** Your tickets are listed at the top of Tonight.
4. **At the door.** In the other window, open **The door (staff)** from the footer and sign in with the owner account (set it up from the link the server printed at start). Type the code from the ticket's address (`/ticket/<code>`), or, on a phone, choose a photo and take one of the ticket. It says **Admit**, and the guest's ticket says **Used at** without a reload. Scan it again: **Already used**, with the time.
5. **An account.** Make one after booking: the ticket joins it, and it's there when you sign in on another device.
6. **Run the theatre.** At `/admin`, sign in as the manager. You get tonight's showings and how full each is, every ticket and guest, the reports, and the seat price.
7. **Without JavaScript** (turn it off in the browser's settings), seats are checkboxes with a button, and booking, accounts, the admin and the door work the same.

Snacks, trailers, price rules and the lobby boards are the next milestones (`plan/roadmap-theatre.md` in the planning project).

## The public demo

With `DEMO=1` the server is a demo anyone can try, back office included (`src/demo.js`):

- It runs on the seeded data (`npm run demo` seeds fresh, then serves), so the admin, reports and screens are full from the first visit.
- The sign-in pages show the demo sign-ins:

  | Who | Email | Password |
  | --- | --- | --- |
  | Manager | `manager@example.com` | `hemlock-manager-demo` |
  | Door staff | `door@example.com` | `hemlock-door-demo` |
  | Guest | `riley@example.com` | `hemlock-guest-demo` |

- Nobody can change a demo account: not its password, roles, name or reset link, and nobody can turn it off. Everything else a visitor does lasts until the reset, including people they invite.
- Once a day at 4 am New York time the server exits, and Railway's "always" restart policy starts it again with `npm run demo`: fresh data dated today, and the same sign-ins.

## Deploy the demo on Railway

`railway.json` sets the build, the start command (`npm run demo`), the health check (`/health`) and the restart policy (`ALWAYS`).

1. In Railway, make a service from `Potomac-Solutions/CineStack`, from the `main` branch. No volume is needed: every start seeds fresh.
2. Set its variables:

   ```
   DEMO=1
   NODE_ENV=production
   SESSION_SECRET=<a long random string>
   TRUST_PROXIES=1
   PUBLIC_URL=https://<the demo's address>
   ```
3. Give it a domain under **Settings → Networking**, and keep it at one replica.

For a real business, leave out `DEMO`, set `DATA_DIR` to a mounted volume, start it with `npm start`, and claim the first owner's setup link from the deploy log.

## Paying

The customer pays on **Stripe**: the card is typed there, never here. The seats stay held while they're there, and become a ticket once Stripe says it's paid: when they come back, or from Stripe's webhook. Backing out keeps the seats held for another try. Stripe Checkout takes cards, and Link (Stripe’s saved details) when it’s turned on in the Dashboard (Settings → Payment methods).

Until Stripe's settings are on the server, the kit's test page stands in. It is plainly a test, with no card and no money, and makes the same trip there and back. To use Stripe's test mode, set these on Railway:

| Setting | What |
| --- | --- |
| `PAY_STRIPE_KEY` | A test secret key, `sk_test_…` (Stripe Dashboard → Developers → API keys, in test mode). A test key means test mode: no money moves |
| `PAY_STRIPE_WEBHOOK_SECRET` | Optional: a webhook endpoint for `checkout.session.completed` and `checkout.session.async_payment_succeeded` at `https://cinestack.potomac.solutions/pay/webhook`, and its signing secret |

`PAY_PROVIDER` picks another platform instead (`stripe`, `square`, `paypal`, `helcim`), with its own settings as in the kit's README. Nothing else changes. Keep the public demo on test keys: with live ones, real money moves.

`SESSION_SECRET` must be at least 32 characters now (the kit refuses a shorter one).

## How it is put together

| Piece | Job |
| --- | --- |
| `@zubra/server` | Renders each page, seats included, before any JavaScript runs |
| `@zubra/actions` | `choose` in `seat-chart.zb` is a `'use server'` function: a plain form post, or a fetch |
| `@zubra/sync` | Each seat is a document only the server writes; phones follow it live |
| Potomac kit (private) | `hold` (who gets a seat, and when a hold ends), `reserve` (seats held at a showing as a draft, priced, then paid once and sold), `pay` (charged at most once; its test provider) and `stages` (a ticket: booked, then scanned). The payment page is the kit's `checkout-form`, loaded from the package |
| [symbology](https://github.com/journey-to-code-org/symbology) | Draws the ticket's QR code (the ticket's key) on the server, and decodes it at the door in the browser (`src/door.js`) |
| `src/box-office.js` | The theatre's side: which seats and showings exist, the guest's draft, and the words |
| `src/log.js` | The Sync log in one SQLite table, one row per field |
| `src/seed.js` | The theatre, its auditoriums and their seat layouts, as data |

## How it looks

- **The landing page** (`/`) is photo-led: the auditorium, one line and one button (**Get tickets**), then tonight's films, each with a still, its rating and every showtime as a button straight to the seats. Below: choosing the exact seat, the theatre, how it works, and where it is. Its words are `site` in `src/seed.js`; `src/site.js` lays it out.
- **Photographs** are files in `public/photos/`: `hero`, `seats`, `marquee`, and one still per film named by the film's id (`night-ferry`), as `.jpg` or `.webp`. Replace a file and restart. The ones here were generated for this made-up theatre and its made-up films; see `public/photos/README.md`.
- **Type** is Big Shoulders Display and Manrope, self-hosted from `@fontsource`. The house is dark for guests; the colours are tokens at the top of `public/base.css`.
- **Accounts** (sign in, sign up, a guest's tickets) take the same type and cards; the small forms sit in a narrow card.
- **The door and the admin** share one page frame (`src/shell.js`): a sidebar at a desk; on a phone a bar on top, tabs along the bottom and the sidebar as a sheet. Light or dark follows the device, with a switch that remembers. Tables become cards on a phone (`src/tables.js`).
- **Checks.** With the demo running (`npm run demo`), `npm run design-check` walks every page as a guest, an account holder, staff and the manager, holds a seat on the way, and checks five widths in light and dark.

## Run it

```sh
npm install      # needs read access to the private Potomac kit repository
npm start        # http://localhost:3000
npm test         # needs Chrome or Playwright's Chromium
```

Node 26. `SESSION_SECRET` is required in production, at least 32 characters (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`); `DATA_DIR` says where the database file goes. Behind a proxy (Railway, Fly, a load balancer), set `TRUST_PROXIES` to how many add to `X-Forwarded-For` (usually `1`), so a wrong-password lockout falls on the device guessing and not on everyone, and one address holds at most 16 seats in a showing however many guests it is; left unset, no header is trusted and every visitor counts as the proxy's address. The header is believed only from a loopback or private address, where the proxy connects from.

Relative component imports work on Windows from Zubra 5.10.2 (the compiler keyed them by `/` paths only; CineStack patched it until the fix shipped).

To check every showing link and its seat components without a browser:

```sh
node --test test/navigation.test.js
```
