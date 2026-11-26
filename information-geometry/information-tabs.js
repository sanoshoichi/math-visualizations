(() => {
  const tabs = [...document.querySelectorAll('.information-navigation [role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const picker = document.getElementById('chapter-select');

  let activePanel;

  function showChapters(panel) {
    const placeholder = new Option('項目を選ぶ', '');
    const chapters = [...panel.querySelectorAll(':scope > section[id]')];
    const options = chapters.map(chapter => new Option(
      chapter.querySelector(':scope > h2').textContent.trim(),
      chapter.id
    ));
    picker.replaceChildren(placeholder, ...options);
  }

  function syncCourse(scroll) {
    const target = document.getElementById(location.hash.slice(1));
    const panel = panels.find(course => course.contains(target)) ?? panels[0];

    if (panel !== activePanel) {
      tabs.forEach((tab, i) => {
        const active = panels[i] === panel;
        tab.tabIndex = active ? 0 : -1;
        tab.setAttribute('aria-selected', String(active));
        panels[i].hidden = !active;
      });
      showChapters(panel);
      activePanel = panel;
    }

    for (let parent = target?.parentElement; parent && parent !== panel; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
    const chapter = target?.closest('.information-course > section[id]');
    picker.value = chapter?.parentElement === panel ? chapter.id : '';
    if (scroll && panel.contains(target)) target.scrollIntoView({block: 'start'});
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      if (tab.getAttribute('aria-selected') === 'true') return;
      const target = panels[index];
      const previous = document.getElementById(picker.value);
      const sameStage = previous?.querySelector(':scope > h2')?.textContent.match(/^(\d+)\./);
      const concrete = ![activePanel.id, target.id].includes('general-course');
      const match = concrete && sameStage && [...target.querySelectorAll(':scope > section[id]')].find(
        section => section.querySelector('h2').textContent.startsWith(sameStage[1] + '.')
      );
      location.hash = (match || target.firstElementChild).id;
    });
    tab.addEventListener('keydown', event => {
      const destination = {
        ArrowRight: (index + 1) % tabs.length,
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        Home: 0, End: tabs.length - 1
      }[event.key];
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
    label(profile, 87, 18, 'pμ,σ(x)（密度）');

    function densityPath(mean, deviation) {
      return Array.from({length: 161}, (_, i) => {
        const value = -6 + 12 * i / 160;
        const z = (value - mean) / deviation;
        const density = Math.exp(-.5 * z * z) / (Math.sqrt(2 * Math.PI) * deviation);
        return [x(value), y(density)];
      });
    }
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
