// Tables that fit a phone. A table with a header row is given its columns' names as custom
// properties (`--c2: 'Seats: '`), so the stylesheet can lay each row out as a card on a narrow
// screen and say what each cell is. The cells themselves are left exactly as the page wrote them.
export function cards(html) {
  return html.replace(/<table>([\s\S]*?)<\/table>/g, (table, inner) => {
    const heads = [...inner.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((match) => match[1].replace(/<[^>]+>/g, '').trim());
    if (!heads.length) return table;
    const names = heads
      .map((label, i) => (i && label ? `--c${i + 1}:'${label.replace(/[\\']/g, '\\$&').replace(/"/g, '&quot;')}: '` : ''))
      .filter(Boolean)
      .join(';');
    return `<table class="cards" style="${names}">${inner}</table>`;
  });
}
