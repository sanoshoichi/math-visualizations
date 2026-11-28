(() => {
  const blue = 'var(--blue)', gold = 'var(--gold)';
  const ink = 'var(--ink)', muted = 'var(--muted)';
  const number = (n, digits = 3) => n.toFixed(digits).replace(/^-0\.0+$/, (zero) => zero.slice(1));
  const tuple = values => '(' + values.map(value => number(value, 4)).join(', ') + ')';

  function mark(svg, name, attributes, content) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (content !== undefined) element.textContent = content;
    svg.appendChild(element);
  }

  function line(svg, points, stroke = muted, width = 1, dash = '') {
    mark(svg, 'polyline', {
      points: points.map(point => point.join(',')).join(' '),
      fill: 'none', stroke, 'stroke-width': width, 'stroke-dasharray': dash
    });
  }

  function text(svg, x, y, value, anchor = 'middle') {
    mark(svg, 'text', {x, y, 'text-anchor': anchor}, value);
  }

  function point(svg, [x, y], color = blue) {
    mark(svg, 'circle', {cx: x, cy: y, r: 5, fill: color});
  }

  function arrow(svg, start, end, color, dash = '') {
    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
    const wing = offset => [end[0] - 7 * Math.cos(angle + offset), end[1] - 7 * Math.sin(angle + offset)];
    line(svg, [start, end], color, 2.2, dash);
    line(svg, [wing(-.48), end, wing(.48)], color, 1.8);
  }

  function figures(name, draw) {
    const lab = document.getElementById(name + '-lab');
    const sliders = [...lab.closest('section').querySelectorAll('input[type=range]')];
    const outputs = [...lab.closest('section').querySelectorAll('output')];
    const svgs = [...lab.querySelectorAll('svg[role=img]')];
    const readout = lab.querySelector('[data-values]');
    function update() {
      const values = sliders.map(slider => slider.valueAsNumber);
      svgs.forEach(svg => svg.replaceChildren());
      readout.textContent = draw(svgs, values, sliders);
      values.forEach((value, i) => { outputs[i].value = number(value, 2); });
    }
    sliders.forEach(slider => slider.addEventListener('input', update));
    update();
  }

  function bars(svg, probabilities, height, horizontalLabel, parameters, digits = 3) {
    const bottom = height - 46, top = 28;
    const step = 283 / probabilities.length;
    const y = probability => bottom - probability * (bottom - top);
    line(svg, [[42, bottom], [336, bottom]]);
    line(svg, [[42, bottom], [42, top]]);
    for (const tick of [0, .5, 1]) {
      line(svg, [[38, y(tick)], [42, y(tick)]]);
      text(svg, 32, y(tick) + 4, tick, 'end');
    }
    text(svg, 42, 15, 'P(X=j)（確率）', 'start');
    text(svg, 335, 15, parameters, 'end');
    text(svg, 190, height - 8, horizontalLabel);
    probabilities.forEach((p, i) => {
      const x = 46 + step * (i + .5);
      const width = Math.min(step * .68, 43);
      mark(svg, 'rect', {x: x - width / 2, y: y(p), width, height: bottom - y(p), fill: blue});
      text(svg, x, bottom + 19, i);
      if (probabilities.length <= 4) text(svg, x, y(p) - 5, number(p, digits));
    });
  }

  const binomial = p => [(1-p)**2, 2*p*(1-p), p*p];
  figures('binomial', ([histogram], [p]) => {
    const probs = binomial(p);
    bars(histogram, probs, 190, 'j（成功回数）', 'n = 2（試行回数）', 4);
    const success = number(p, 2);
    const failure = number(1-p, 2);
    return [
      '0回　(1 − p)² = '+failure+'² = '+number(probs[0], 4),
      '1回　2p(1 − p) = 2 × '+success+' × '+failure+' = '+number(probs[1], 4),
      '2回　p² = '+success+'² = '+number(probs[2], 4)
    ].join('\n');
  });

  figures('simplex-binomial', ([simplex], [p]) => {
    const probs = binomial(p);
    const at = ([a, b]) => [85 + 180*a, 173 - 143*b];
    line(simplex, [[0,0], [1,0], [0,1], [0,0]].map(at));
    text(simplex, 288, 184, 'P(A₁)');
    text(simplex, 78, 19, 'P(A₂)');
    text(simplex, 77, 190, '0');
    text(simplex, 265, 194, '1');
    text(simplex, 74, 34, '1');
    line(simplex, Array.from({length: 101}, (_, i) => at(binomial(i/100))), blue, 2.5);
    const [a, b] = probs;
    const here = at(probs);
    arrow(simplex, here, at([a - .20*(1-p), b + .20*(1-2*p)]), gold);
    point(simplex, here);
    return '確率 (0回, 1回, 2回) ' + tuple(probs) + '　接ベクトルの2成分 ' + tuple([-2*(1-p), 2*(1-2*p)]);
  });

  const tetrahedron = [[62, 166], [294, 175], [171, 27], [174, 125]];
  figures('four', ([svg], independent, sliders) => {
    // Integer hundredths keep the dependent probability and slider bounds consistent.
    const hundredths = independent.map(p => Math.round(p * 100));
    const used = hundredths.reduce((total, p) => total + p, 0);
    sliders.forEach((slider, i) => { slider.max = String((98 - used + hundredths[i]) / 100); });
    const probs = [...independent, (100-used)/100];
    const at = tetrahedron[0].map((_, axis) => probs.reduce((sum, p, i) => sum + p*tetrahedron[i][axis], 0));
    line(svg, [...tetrahedron.slice(0,3), tetrahedron[0]], muted, 1.6);
    tetrahedron.slice(0,3).forEach(vertex => line(svg, [vertex, tetrahedron[3]], muted, 1.4, '5 4'));
    ['A₁','A₂','A₃','A₄'].forEach((name, i) => text(svg, tetrahedron[i][0] + (i===3 ? 11 : 0), tetrahedron[i][1] + (i===2 ? -8 : 19), name));
    tetrahedron.slice(0,3).forEach((vertex, i) => {
      const end = at.map((coord, axis) => coord + .14*(vertex[axis]-tetrahedron[3][axis]));
      arrow(svg, at, end, gold);
      text(svg, end[0] + [-11,11,0][i], end[1] - 7, ['+p₁','+p₂','+p₃'][i]);
    });
    point(svg, at);
    document.querySelector('#four-lab [data-metric-values]').textContent =
      'g₁₂ = 1 / P(A₄) = ' + number(1/probs[3]);
    return '(P(A₁), P(A₂), P(A₃), P(A₄)) = ' + tuple(probs);
  });

  figures('poisson', ([svg], [lambda]) => {
    const probabilities = [Math.exp(-lambda)];
    for (let j=1; j<=18; j++) probabilities.push(probabilities[j-1]*lambda/j);
    bars(svg, probabilities, 195, 'j（観測した回数）', 'λ = ' + number(lambda, 2));
    const tail=1-probabilities.reduce((sum, p) => sum+p, 0);
    document.querySelector('#poisson-lab [data-metric-values]').textContent =
      '基底の長さ ' + number(1/Math.sqrt(lambda)) + '　長さの二乗 ' + number(1/lambda);
    return '19回以上の確率 ' + Math.max(0,tail).toExponential(3);
  });

  // Recurrence to a large argument, then the Stirling expansion for log Γ.
  function logGamma(x) {
    let correction=0;
    while (x < 12) { correction -= Math.log(x); x++; }
    const inv=1/x;
    return correction + (x-.5)*Math.log(x)-x+.5*Math.log(2*Math.PI)
      + inv/12 - inv**3/360 + inv**5/1260 - inv**7/1680;
  }

  // The tail of Σ 1/(x+j)^2 is evaluated by the Euler–Maclaurin expansion.
  function trigamma(x) {
    let sum=0;
    while (x < 12) { sum += 1/(x*x); x++; }
    const inv=1/x;
    return sum + inv + inv**2/2 + inv**3/6 - inv**5/30 + inv**7/42 - inv**9/30;
  }

  figures('gamma', ([density, tangent], [k, theta]) => {
    const normalizer=logGamma(k)+k*Math.log(theta);
    const at=(x,y) => [43+13.8*x, 172-70*y];
    line(density, [at(0,0), at(20,0)]);
    line(density, [at(0,0), at(0,2.1)]);
    text(density, 179, 207, 'x（観測値）');
    text(density, 43, 16, 'pₖ,θ(x)（密度）', 'start');
    for (const x of [0,5,10,15,20]) text(density, at(x,0)[0], 193, x);
    for (const y of [1,2]) text(density, 30, at(0,y)[1]+4, y, 'end');
    line(density, Array.from({length: 251}, (_, i) => {
      const x=i*.08;
      const y=i===0 ? (k===1 ? 1/theta : 0) : Math.exp((k-1)*Math.log(x)-x/theta-normalizer);
      return at(x,y);
    }), blue, 2.4);

    const gkk=trigamma(k), gkt=1/theta, gtt=k/(theta*theta);
    const kLength=Math.sqrt(gkk), thetaLength=Math.sqrt(gtt);
    const angle=Math.acos(gkt/(kLength*thetaLength));
    const origin=[48,141], scale=212/Math.max(kLength,thetaLength);
    const curved=Array.from({length: 20}, (_, i) => {
      const a=i*angle/19;
      return [origin[0]+24*Math.cos(a), origin[1]-24*Math.sin(a)];
    });
    line(tangent, curved);
    arrow(tangent, origin, [origin[0]+scale*kLength,origin[1]], blue);
    arrow(tangent, origin, [origin[0]+scale*thetaLength*Math.cos(angle),origin[1]-scale*thetaLength*Math.sin(angle)], gold,'6 4');
    const degrees=angle*180/Math.PI;
    text(tangent, 180, 171, 'フィッシャー計量で測った角度 α = ' + number(degrees,1) + '°');
    document.querySelector('#gamma-lab [data-metric-values]').textContent =
      '形状基底の長さ ' + number(kLength) + '　尺度基底の長さ ' + number(thetaLength) + '　内積 ' + number(gkt);
    return '形状 k = ' + number(k,2) + '　尺度 θ = ' + number(theta,2);
  });
})();
