/* Both curves are sampled on the same uniformly spaced parameter grid. */
for (const figure of document.querySelectorAll('[data-kl-compare]')) {
  const values = JSON.parse(figure.dataset.values);
  const metric = Number(figure.dataset.g);
  const slider = figure.querySelector('input');
  const [exact, quadratic] = figure.querySelectorAll('polyline');
  const cursor = figure.querySelector('[data-cursor]');
  const dot = figure.querySelector('[data-kl-dot]');
  const square = figure.querySelector('[data-quad-dot]');
  const output = figure.querySelector('output');
  const reading = figure.querySelector('[data-kl-reading]');
  function show() {
    const t = slider.valueAsNumber;
    const i = Math.round((t + 1) * (values.length - 1) / 2);
    const p = exact.points.getItem(i);
    const q = quadratic.points.getItem(i);
    cursor.setAttribute('x1', p.x);
    cursor.setAttribute('x2', p.x);
    dot.setAttribute('cx', p.x);
    dot.setAttribute('cy', p.y);
    square.setAttribute('x', q.x - 3.2);
    square.setAttribute('y', q.y - 3.2);
    output.value = t.toFixed(2);
    reading.textContent = '厳密値 ' + values[i].toFixed(6) + ' ／ 二次近似 ' + (metric * t * t / 2).toFixed(6) + ' nat';
  }
  slider.addEventListener('input', show);
  show();
}
