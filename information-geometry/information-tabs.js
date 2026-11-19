(() => {
  const tabs = [...document.querySelectorAll('.information-navigation [role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const picker = document.getElementById('chapter-select');

  function syncCourse(scroll) {
    const target = document.getElementById(location.hash.slice(1));
    const generalPanel = panels[1];
    const activePanel = generalPanel.contains(target) ? generalPanel : panels[0];
    tabs.forEach((tab, i) => {
      const active = panels[i] === activePanel;
      tab.tabIndex = active ? 0 : -1;
      tab.setAttribute('aria-selected', String(active));
      panels[i].hidden = !active;
    });
    picker.value = [...picker.options].some(option => option.value === target?.id) ? target.id : '';
    if (scroll && activePanel.contains(target)) target.scrollIntoView({block: 'start'});
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      if (tab.getAttribute('aria-selected') === 'true') return;
      location.hash = panels[index].firstElementChild.id;
    });
    tab.addEventListener('keydown', event => {
      const destination = {ArrowRight: 1 - index, ArrowLeft: 1 - index, Home: 0, End: 1}[event.key];
      if (destination === undefined) return;
      event.preventDefault();
      tabs[destination].focus();
      tabs[destination].click();
    });
  });
  syncCourse(false);
  window.addEventListener('hashchange', () => syncCourse(true));

  const lab = document.getElementById('normal-lab');
  const plane = lab.querySelector('[data-normal-plane]');
  const profile = lab.querySelector('[data-normal-profile]');
  const muInput = document.getElementById('normal-mu');
  const sigmaInput = document.getElementById('normal-sigma');
  const muOutput = document.querySelector('output[for="normal-mu"]');
  const sigmaOutput = document.querySelector('output[for="normal-sigma"]');
  const muLength = lab.querySelector('[data-normal-length-mu]');
  const sigmaLength = lab.querySelector('[data-normal-length-sigma]');
  const blue = 'var(--blue)', gold = 'var(--gold)', muted = 'var(--muted)';

  function mark(svg, name, attributes, label) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (label !== undefined) element.textContent = label;
    svg.appendChild(element);
  }

  function line(svg, points, stroke, width = 1, dash = '') {
    mark(svg, 'polyline', {
      points: points.map(point => point.join(',')).join(' '),
      fill: 'none', stroke, 'stroke-width': width, 'stroke-dasharray': dash
    });
  }

  function label(svg, x, y, value) {
    mark(svg, 'text', {x, y, 'text-anchor': 'middle'}, value);
  }

  function drawPlane(mu, sigma) {
    const x = value => 38 + (value + 2.5) * 47;
    const y = value => 151 - value * 58;
    line(plane, [[38, 151], [304, 151]], muted);
    line(plane, [[38, 151], [38, 17]], muted);
    for (const value of [-2, 0, 2]) {
      line(plane, [[x(value), 151], [x(value), 155]], muted);
      label(plane, x(value), 171, value);
    }
    for (const value of [1, 2]) {
      line(plane, [[34, y(value)], [38, y(value)]], muted);
      label(plane, 23, y(value) + 4, value);
    }
    label(plane, 307, 169, 'μ');
    label(plane, 23, 18, 'σ');

    const px = x(mu), py = y(sigma);
    line(plane, [[px, py], [px + 27, py]], blue, 2.3);
    line(plane, [[px + 22, py - 4], [px + 27, py], [px + 22, py + 4]], blue, 2);
    line(plane, [[px, py], [px, py - 24]], gold, 2.3, '4 2');
    line(plane, [[px - 4, py - 19], [px, py - 24], [px + 4, py - 19]], gold, 2);
    mark(plane, 'circle', {cx: px, cy: py, r: 4, fill: blue});
  }

  function drawProfile(mu, sigma) {
    const x = value => 43 + (value + 6) * 20.5;
    const y = value => 151 - value * 143;
    line(profile, [[43, 151], [300, 151]], muted);
    line(profile, [[43, 151], [43, 17]], muted);
    for (const value of [-6, -3, 0, 3, 6]) {
      line(profile, [[x(value), 151], [x(value), 155]], muted);
      label(profile, x(value), 171, value);
    }
    for (const value of [.4, .8]) {
      line(profile, [[39, y(value)], [43, y(value)]], muted);
      label(profile, 23, y(value) + 4, value);
    }
    label(profile, 309, 169, 'x');
    label(profile, 22, 18, '密度');

    function densityPath(mean, deviation) {
      return Array.from({length: 161}, (_, i) => {
        const value = -6 + 12 * i / 160;
        const z = (value - mean) / deviation;
        const density = Math.exp(-.5 * z * z) / (Math.sqrt(2 * Math.PI) * deviation);
        return [x(value), y(density)];
      });
    }
    label(profile, 164, 12, '実線: 選んだ分布');
    line(profile, densityPath(0, 1), muted, 1.5, '5 4');
    line(profile, densityPath(mu, sigma), blue, 2.5);
  }

  function updateNormal() {
    const mu = muInput.valueAsNumber, sigma = sigmaInput.valueAsNumber;
    muOutput.value = mu.toFixed(2);
    sigmaOutput.value = sigma.toFixed(2);
    muLength.textContent = (1 / sigma).toFixed(3);
    sigmaLength.textContent = (Math.SQRT2 / sigma).toFixed(3);
    plane.replaceChildren();
    profile.replaceChildren();
    drawPlane(mu, sigma);
    drawProfile(mu, sigma);
  }

  muInput.addEventListener('input', updateNormal);
  sigmaInput.addEventListener('input', updateNormal);
  updateNormal();
})();
