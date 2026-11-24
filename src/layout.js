// The page around the components: the head, the bar across the top, the foot, and the connection
// to the log. The styles are files in public/ (base.css for every page, site.css for the landing
// page, customer.css for the seats, paying and a ticket); the words come from src/seed.js.
import { asset, photo, FONT_CSS } from './assets.js';
import { site } from './seed.js';

export const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Small drawings, as inline SVG: they take the theatre's colours. Photographs are files in public/photos/. */
export const art = {
  mark: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 13h44a4 4 0 0 1 4 4v10a5 5 0 0 0 0 10v10a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V37a5 5 0 0 0 0-10V17a4 4 0 0 1 4-4z" fill="#a78bfa"/><circle cx="27" cy="25.500" r="5" fill="none" stroke="#07080b" stroke-width="4"/><circle cx="27" cy="38.500" r="6.500" fill="none" stroke="#07080b" stroke-width="4"/><path d="M45 18v28" stroke="#07080b" stroke-width="2.400" stroke-dasharray="3 3.500"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.800 7 11 7 11z"/><circle cx="12" cy="10" r="2.500"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h4l1.500 5-2.200 1.600a12 12 0 0 0 5.100 5.100L16 12.500l5 1.500v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z"/></svg>',
};

const wordmark = (shop) => `<a class="wordmark" href="/">${art.mark}<span><b>${escape(site.short)}</b><small>${escape(site.trade)}</small></span></a>`;

/** What a search engine or a shared link should know about the shop. Off for a made-up shop. */
function listing(shop, canonical) {
  if (!shop.listed) return '<meta name="robots" content="noindex, nofollow">';
  const data = { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: shop.name, description: site.description, address: { '@type': 'PostalAddress', addressLocality: shop.town.split(',')[0], addressRegion: (shop.town.split(',')[1] ?? '').trim() }, ...(canonical ? { url: canonical } : {}) };
  return `${canonical ? `<link rel="canonical" href="${escape(canonical)}">` : ''}<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

/**
 * `nav`: who is looking: `customer` (signed in), `staff` (on the staff). `here` marks the current
 * link. `landing` is the landing page: full-width sections and its own stylesheet. `toast` is a
 * signed "done" message to float.
 */
export function layout({ title, theatre: shop, body, nav = {}, here = '', landing = false, toast = '', description = site.description, canonical = '', actionsScript = '' }) {
  const link = (href, words, cls = '') => `<a href="${href}"${cls ? ` class="${cls}"` : ''}${here === href ? ' aria-current="page"' : ''}>${words}</a>`;
  const links = [link('/#tonight', 'Tonight', 'wide'), link('/#how', 'How it works', 'wide'), link('/#story', 'The theatre', 'wide'), nav.customer ? link('/account', 'Account') : link('/account/sign-in', 'Sign in'), ...(nav.staff ? [link('/admin', 'Admin')] : [])].join('');
  const fullTitle = landing ? `${shop.name} · ${shop.town}` : `${title} · ${shop.name}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${listing(shop, canonical)}
  <title>${escape(fullTitle)}</title>
  <meta name="description" content="${escape(description)}">
  <meta property="og:title" content="${escape(fullTitle)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:type" content="website">
  <meta name="theme-color" content="#07080b">
  <link rel="icon" href="${asset('favicon.svg')}" type="image/svg+xml">
  <link rel="preload" href="${asset('big-shoulders-display-latin-800-normal.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${asset('manrope-latin-400-normal.woff2')}" as="font" type="font/woff2" crossorigin>${landing && photo('hero') ? `
  <link rel="preload" href="${photo('hero')}" as="image" fetchpriority="high">
  <meta property="og:image" content="${escape(canonical ? new URL(photo('hero'), canonical).href : photo('hero'))}">` : ''}
  <style>${FONT_CSS}</style>
  <link rel="stylesheet" href="${asset('base.css')}">
  <link rel="stylesheet" href="${asset(landing ? 'site.css' : 'customer.css')}">
</head>
<body>
  <a class="skip" href="#main">Skip to the page</a>
  <header class="site-head"><div class="wrap bar">${wordmark(shop)}<nav aria-label="Site">${links}<a class="bag" href="/#tonight"><span class="long">${escape(site.cta)}</span><span class="short">Tickets</span></a></nav></div></header>
  <main id="main"${landing ? ' class="landing"' : ''}>
    ${body}
  </main>
  ${toast ? `<p class="toast" role="status">${escape(toast)}</p>` : ''}
  <footer class="site-foot"><div class="wrap">
    <div class="cols">
      <div>${wordmark(shop)}<p>${escape(site.foot.line)}</p><p>${escape(shop.town)}</p><p><a class="go" href="/#tonight">${escape(site.cta)}</a></p></div>
      <div><h2>Doors</h2><p>${escape(site.doors)}</p><p>${escape(shop.address)}</p></div>
      <div><h2>Tickets</h2><ul><li><a href="/#tonight">Tonight’s showtimes</a></li><li><a href="/#how">How it works</a></li><li><a href="/#visit">Find us</a></li><li><a href="/account">Your account</a></li></ul></div>
      <div><h2>Staff</h2><ul><li><a href="/admin">Staff sign in</a></li><li><a href="/staff/door">The door</a></li></ul></div>
    </div>
    <div class="fine"><p>${escape(shop.concept)}</p><p><a href="${escape(site.foot.builtHref)}">${escape(site.foot.built)}</a></p></div>
  </div></footer>
  ${actionsScript}
  <script type="module">
    import { connect } from '@zubra/sync/connect';
    connect();
  </script>
</body>
</html>`;
}
