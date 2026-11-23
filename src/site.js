// The landing page: what a guest sees at `/`. The auditorium and a few words, one button (get
// tickets), then tonight's films, each with a still, its rating and every showtime as a button
// that goes straight to the seats.
//
// The words are in src/seed.js (`site`); films and showings are the box office's; the
// photographs are files in public/photos/ (a film's still is named by its id).
import { escape, art } from './layout.js';
import { photo } from './assets.js';
import { site } from './seed.js';

const picture = (name, alt, { eager = false, cls = '' } = {}) => (photo(name) ? `<img${cls ? ` class="${cls}"` : ''} src="${photo(name)}" alt="${escape(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">` : '');

/** `films`: tonight's films, each with `showings` ({ id, at, hall }); `mine`: this guest's tickets, as list items; `halls`: the auditoriums. */
export function landing({ theatre, films, halls, money, seatCents, mine = '', account = null }) {
  const { hero, tonight, seats, story, steps, visit } = site;
  const tickets = (cls = 'go lg') => `<a class="${cls}" href="#tonight">${escape(site.cta)}</a>`;

  return `<section class="hero">${picture('hero', '', { eager: true, cls: 'bg' })}
  <div class="wrap hero-words">
    <p class="kicker">${escape(hero.kicker)}</p>
    <h1>${escape(hero.title)} <em>${escape(hero.titleSoft)}</em></h1>
    <p class="lede">${escape(hero.lede)}</p>
    <div class="actions"><a class="go lg" href="#tonight">${escape(hero.cta)}</a><a class="button ghost lg" href="#how">${escape(hero.secondary)}</a></div>
  </div>
  <div class="hero-strip"><div class="wrap"><p>${escape(site.doors)}</p><p>${films.length} films tonight · seats ${money(seatCents)} each</p></div></div>
</section>
${mine ? `<div class="wrap"><section class="mine"><h2>Your tickets</h2><ul>${mine}</ul></section></div>` : ''}

<div class="sec menu" id="tonight"><div class="wrap">
  <header class="head center"><p class="kicker">${escape(tonight.kicker)}</p><h2 class="big">${escape(tonight.heading)}</h2><p>${escape(tonight.lede)}</p></header>
  <ul class="films">${films
    .map(
      (film) => `<li class="film"><div class="poster">${picture(film.id, `A still from ${film.title}`)}${film.label ? `<span class="tag">${escape(film.label)}</span>` : ''}</div><div class="body"><h3>${escape(film.title)}</h3><p class="meta">${escape(film.rating)} · ${film.minutes} min</p><ul class="times">${film.showings.map((showing) => `<li><a href="/show/${showing.id}">${showing.at}<small>${escape(showing.hall)}</small></a></li>`).join('')}</ul></div></li>`,
    )
    .join('')}</ul>
</div></div>

<section class="split"><div class="wrap">
  <div class="pic">${picture('seats', 'A row of leather recliners in a dark auditorium')}</div>
  <div class="words"><p class="kicker">${escape(seats.kicker)}</p><h2>${escape(seats.heading)}</h2><p>${escape(seats.text)}</p><p>${tickets()} ${account ? '<a class="button light lg" href="/account">Your tickets</a>' : '<a class="button light lg" href="/account/sign-up">Make an account</a>'}</p></div>
</div></section>

<section class="banner" id="story">${picture('marquee', '', { cls: 'bg' })}<div class="wrap"><p class="kicker">${escape(story.kicker)}</p><h2>${escape(story.heading)}</h2>${story.paragraphs.map((text) => `<p>${escape(text)}</p>`).join('')}${tickets()}</div></section>

<div class="sec how" id="how"><div class="wrap">
  <h2 class="big">${escape(steps.heading)}</h2>
  <ol class="steps">${steps.list.map(([title, text]) => `<li><h3>${escape(title)}</h3><p>${escape(text)}</p></li>`).join('')}</ol>
</div></div>

<div class="sec dark" id="visit"><div class="wrap">
  <header class="head"><p class="kicker">${escape(visit.kicker)}</p><h2 class="big">${escape(visit.heading)}</h2></header>
  <div class="visit">
    <div>${art.clock}<h3>Doors</h3><p><strong>${escape(site.doors)}</strong></p></div>
    <div>${art.pin}<h3>The theatre</h3><p><strong>${escape(theatre.address)}</strong></p><p>${escape(visit.where)}</p></div>
    <div>${art.clock}<h3>${halls.length} screens</h3><p>${escape([...new Set(halls.flatMap((hall) => hall.specs))].slice(0, 5).join(' · '))}</p></div>
  </div>
  <p class="visit-cta">${tickets()}</p>
</div></div>`;
}
