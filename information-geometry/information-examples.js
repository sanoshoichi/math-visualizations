(() => {
  const blue = 'var(--blue)';
  const gold = 'var(--gold)';
  const ink = 'var(--ink)';
  const muted = 'var(--muted)';
  const violet = '#bf9af2';

  function mark(svg, name, attributes, label) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (label !== undefined) element.textContent = label;
    svg.appendChild(element);
  }

  function drawLine(svg, points, stroke, width = 1, dash = '') {
    mark(svg, 'polyline', {
      points: points.map(point => point.join(',')).join(' '),
      fill: 'none', stroke, 'stroke-width': width, 'stroke-dasharray': dash
    });
  }

  function point(svg, [x, y], color, label, dx, dy, square = false) {
    if (square) mark(svg, 'rect', {x: x - 4.5, y: y - 4.5, width: 9, height: 9, fill: color});
    else mark(svg, 'circle', {cx: x, cy: y, r: 4.5, fill: color});
    if (label) mark(svg, 'text', {x: x + dx, y: y + dy}, label);
  }

  function bindSliders(host, render) {
    const sliders = [...host.querySelectorAll('input[type="range"]')];
    const outputs = [...host.querySelectorAll('output')];
    function refresh() {
      const values = sliders.map(slider => slider.valueAsNumber);
      values.forEach((value, i) => { outputs[i].value = value.toFixed(2); });
      render(...values);
    }
    sliders.forEach(slider => slider.addEventListener('input', refresh));
    refresh();
  }

  const pathsLab = document.getElementById('normal-paths');
  const pathsSvg = pathsLab.querySelector('[data-paths]');
  const pathsReadout = pathsLab.querySelector('[data-path-readout]');
  const geodesics = [
    { name: '指数接続', sigma: () => 1, color: blue, dash: '' },
    { name: '混合接続', sigma: mu => Math.sqrt(2 - mu * mu), color: gold, dash: '7 4' },
    { name: 'フィッシャー計量', sigma: mu => Math.sqrt(1.5 - mu * mu / 2), color: violet, dash: '2 4' }
  ];
  const normalPosition = (mu, sigma) => [173 + 115 * mu, 152 - 265 * (sigma - 1)];

  bindSliders(pathsLab.closest('section'), mean => {
    pathsSvg.replaceChildren();
    const at = normalPosition;
    drawLine(pathsSvg, [[40, 175], [322, 175]], muted);
    drawLine(pathsSvg, [[40, 175], [40, 21]], muted);
    mark(pathsSvg, 'text', {x: 329, y: 182}, 'μ');
    mark(pathsSvg, 'text', {x: 19, y: 23}, 'σ');
    for (const mu of [-1, 0, 1]) {
      const [x] = at(mu, 1);
      drawLine(pathsSvg, [[x, 175], [x, 179]], muted);
      mark(pathsSvg, 'text', {x, y: 198, 'text-anchor': 'middle'}, mu);
    }
    for (const sigma of [1, 1.2, 1.4]) {
      const [, y] = at(0, sigma);
      drawLine(pathsSvg, [[36, y], [40, y]], muted);
      mark(pathsSvg, 'text', {x: 32, y: y + 4, 'text-anchor': 'end'}, sigma);
    }
    drawLine(pathsSvg, [at(mean, .92), at(mean, 1.46)], muted, 1, '4 4');
    for (const {sigma, color, dash} of geodesics) {
      const points = Array.from({length: 101}, (_, i) => {
        const mu = -1 + i / 50;
        return at(mu, sigma(mu));
      });
      drawLine(pathsSvg, points, color, 2.7, dash);
      point(pathsSvg, at(mean, sigma(mean)), color);
    }
    point(pathsSvg, at(-1,1), ink, 'P', -6, 16);
    point(pathsSvg, at(1,1), ink, 'Q', -4, 16);
    pathsReadout.textContent = '標準偏差　' + geodesics.map(({name, sigma}) => name + ' ' + sigma(mean).toFixed(3)).join(' ／ ');
  });

  const lab = document.getElementById('projection-lab');
  const svg = lab.querySelector('[data-projection]');
  const readout = lab.querySelector('[data-projection-points]');
  const target = [.20, .30, .50];
  const coordinates = ([p1, p2]) => [66 + 187 * p1, 191 - 166 * p2];
  const kl = (first, second) => first.reduce((sum, p, i) => sum + p * Math.log(p / second[i]), 0);
  const tuple = probabilities => '(' + probabilities.map(value => value.toFixed(5)).join(', ') + ')';

  bindSliders(lab.closest('section'), (r, a2Share) => {
    const remaining = 1 - r;
    const candidate = [r, remaining * a2Share, remaining * (1 - a2Share)];
    const optimum = [r, remaining * .375, remaining * .625];
    svg.replaceChildren();
    drawLine(svg, [[0, 0], [1, 0], [0, 1], [0, 0]].map(coordinates), muted);
    mark(svg, 'text', {x: 253, y: 218}, 'P(A₁)');
    mark(svg, 'text', {x: 14, y: 25}, 'P(A₂)');
    drawLine(svg, [[r,0], [r,remaining]].map(coordinates), muted, 2, '5 4');
    point(svg, coordinates(candidate), gold, 'Q', 9, -8);
    point(svg, coordinates(optimum), blue, 'Q*', -25, 15, true);
    point(svg, coordinates(target), ink, 'P', -15, -11);

    const minimum = kl(optimum, target);
    const move = kl(candidate, optimum);
    const values = {full: kl(candidate, target), move, minimum, sum: move + minimum};
    for (const [key, value] of Object.entries(values)) {
      lab.querySelector('[data-kl="' + key + '"]').textContent = Math.max(0, value).toFixed(6);
    }
    readout.textContent = '候補 Q ' + tuple(candidate) + '　最小点 Q* ' + tuple(optimum);
  });
})();
