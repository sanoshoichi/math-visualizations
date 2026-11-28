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
  const binomialQ = figure.querySelector('[data-kl-binomial-q]');
  const exactValue = figure.querySelector('[data-kl-exact]');
  const quadraticValue = figure.querySelector('[data-kl-quadratic]');
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
    const exactText = values[i].toFixed(6);
    const quadraticText = (metric * t * t / 2).toFixed(6);
    if (binomialQ) {
      binomialQ.textContent = (0.4 + 0.1 * t).toFixed(3);
      exactValue.textContent = exactText;
      quadraticValue.textContent = quadraticText;
    } else {
      reading.textContent = '厳密値 ' + exactText + ' ／ 二次近似 ' + quadraticText + ' nat';
    }
  }
  slider.addEventListener('input', show);
  show();
}
