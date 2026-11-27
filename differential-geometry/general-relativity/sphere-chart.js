(() => {
  const figure = document.getElementById('sphere-chart-map');
  if (!figure) return;

  const thetaInput = document.getElementById('sphere-theta');
  const phiInput = document.getElementById('sphere-phi');
  const point = figure.querySelector('[data-sphere-point]');
  const horizontal = figure.querySelector('[data-sphere-h]');
  const vertical = figure.querySelector('[data-sphere-v]');
  const coordinates = figure.querySelector('[data-sphere-coordinates]');

  function update() {
    const theta = thetaInput.valueAsNumber;
    const phi = phiInput.valueAsNumber;
    const x = 39 + 224 * phi / 360;
    const y = 110 - 94 * theta / 180;
    const atPole = theta === 0 || theta === 180;
    const atSeam = phi === 0 || phi === 360;
    coordinates.textContent = atPole
      ? 'θ = ' + theta + '°。極では φ を変えても同じ点。'
      : '(θ, φ) = (' + theta + '°, ' + phi + '°)' + (atSeam ? '（座標近傍の境界）' : '');
    point.style.display = atPole ? 'none' : '';
    point.setAttribute('cx', x);
    point.setAttribute('cy', y);
    horizontal.setAttribute('x1', 39);
    horizontal.setAttribute('x2', atPole ? 263 : x);
    horizontal.setAttribute('y1', y);
    horizontal.setAttribute('y2', y);
    vertical.style.display = atPole ? 'none' : '';
    vertical.setAttribute('x1', x);
    vertical.setAttribute('x2', x);
    vertical.setAttribute('y1', y);
    vertical.setAttribute('y2', 110);
  }

  thetaInput.addEventListener('input', update);
  phiInput.addEventListener('input', update);
  update();
})();
