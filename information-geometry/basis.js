(() => {
      const root = document.getElementById('coordinate-basis');
      const role = (name) => root.querySelector('[data-role="' + name + '"]');
      const slider = root.querySelector('#simplex-curve-s');
      const manifold = role('manifold'), coordinates = role('coordinates'), tangent = role('tangent');
      const P = [0.20, 0.30, 0.50];
      const directions = [[1, 0, -1], [0, 1, -1]];
      const colors = ['var(--c1)', 'var(--c2)'];
      const neutral = 'var(--foreground)', muted = 'var(--muted-foreground)';
      const surface = 'color-mix(in srgb, var(--blue) 10%, transparent)';
      const ns = 'http://www.w3.org/2000/svg';
      const position = (index, s) => P.map((p, i) => p + s * directions[index][i]);
      let yaw = -0.68, drag = null;

      function add(svg, kind, attrs, text) {
        const element = document.createElementNS(ns, kind);
        for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
        if (text !== undefined) element.textContent = text;
        svg.appendChild(element);
      }

      function line(svg, [x1, y1], [x2, y2], stroke = muted, width = 1, dash) {
        const attrs = {x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-linecap': 'round'};
        if (dash) attrs['stroke-dasharray'] = dash;
        add(svg, 'line', attrs);
      }

      function label(svg, [x, y], value, anchor = 'middle') {
        add(svg, 'text', {x, y, fill: neutral, 'text-anchor': anchor, 'font-size': 14}, value);
      }

      function polygon(svg, vertices, boundary = true) {
        const attrs = {points: vertices.map(point => point.join(',')).join(' '), fill: surface, stroke: muted};
        if (boundary) attrs['stroke-dasharray'] = '4 3';
        add(svg, 'polygon', attrs);
      }

      function point(svg, [x, y], index = -1) {
        const fill = colors[index] ?? neutral;
        const stroke = 'var(--background)';
        if (index === 1) add(svg, 'rect', {x: x - 4, y: y - 4, width: 8, height: 8, fill, stroke});
        else add(svg, 'circle', {cx: x, cy: y, r: index === 0 ? 4.8 : 3.6, fill, stroke});
      }

      function arrow(svg, start, end, index) {
        const color = colors[index];
        line(svg, start, end, color, 2, index === 1 ? '4 3' : undefined);
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
        for (const delta of [-.48, .48]) {
          const tip = [end[0] - 8 * Math.cos(angle + delta), end[1] - 8 * Math.sin(angle + delta)];
          line(svg, end, tip, color, 2);
        }
      }

      // Same orthographic construction as the original simplex's 3D view.
      function project([x, y, z], angle = yaw) {
        const c = Math.cos(angle), s = Math.sin(angle);
        return [c * x - s * y, Math.cos(.56) * z - Math.sin(.56) * (s * x + c * y)];
      }

      function drawCurves(svg, map, s, showLabel) {
        const base = map(P);
        directions.forEach((_, i) => {
          line(svg, map(position(i, -.19)), map(position(i, .49)), colors[i], 2, i === 1 ? '4 3' : undefined);
        });
        if (s !== 0) directions.forEach((_, i) => point(svg, map(position(i, s)), i));
        point(svg, base);
        if (showLabel) label(svg, [base[0] + 6, base[1] + 17], 'P', 'start');
      }

      function drawManifold(s) {
        manifold.replaceChildren();
        const map = p => {
          const [x, y] = project(p);
          return [160 + 121 * x, 151 - 121 * y];
        };
        const origin = map([0, 0, 0]), vertices = [[1,0,0], [0,1,0], [0,0,1]].map(map);
        vertices.forEach(vertex => line(manifold, origin, vertex));
        polygon(manifold, vertices);
        vertices.forEach(([x, y], i) => {
          const dx = x - origin[0], dy = y - origin[1], d = Math.hypot(dx, dy) || 1;
          label(manifold, [x + 14 * dx / d, y + 13 * dy / d + 4], ['p₁','p₂','p₃'][i]);
        });
        drawCurves(manifold, map, s, true);
      }

      function drawCoordinates(s) {
        coordinates.replaceChildren();
        const map = ([p1,p2]) => [84 + 154 * p1, 177 - 154 * p2];
        const O = map([0,0]), X = map([1,0]), Y = map([0,1]);
        polygon(coordinates, [O, X, Y]);
        line(coordinates, O, [X[0] + 16, X[1]]);
        line(coordinates, O, [Y[0], Y[1] - 7]);
        label(coordinates, [X[0] + 24, X[1] + 4], 'p₁');
        label(coordinates, [Y[0] - 15, Y[1] + 4], 'p₂');
        label(coordinates, [O[0] - 9, O[1] + 15], '0');
        label(coordinates, [X[0], X[1] + 17], '1');
        label(coordinates, [Y[0] - 8, Y[1] + 17], '1');
        drawCurves(coordinates, map, s, true);
      }

      function drawTangent() {
        tangent.replaceChildren();
        const origin = [160, 38];
        const v = directions.map(direction => {
          const [x,y] = project(direction, -.68);
          return [34 * x, -34 * y];
        });
        const at = (a, b) => origin.map((o, i) => o + a * v[0][i] + b * v[1][i]);
        polygon(tangent, [at(-.62,-.62), at(1.25,-.62), at(1.25,1.25), at(-.62,1.25)], false);
        v.forEach((_, i) => {
          const end = i === 0 ? at(1,0) : at(0,1);
          arrow(tangent, origin, end, i);
          label(tangent, [end[0] + (end[0] >= origin[0] ? 12 : -12), end[1] + 5], ['e₁','e₂'][i]);
        });
        point(tangent, origin);
        label(tangent, [origin[0], origin[1] - 9], '0');
      }

      function updatePositions() {
        const s = Number(slider.value);
        role('value').value = s.toFixed(2);
        directions.forEach((_, i) => {
          const [p1,p2] = position(i, s);
          role(i === 0 ? 'first' : 'second').textContent = '(' + p1.toFixed(2) + ', ' + p2.toFixed(2) + ')';
        });
        drawManifold(s);
        drawCoordinates(s);
      }

      slider.addEventListener('input', updatePositions);
      manifold.addEventListener('pointerdown', event => {
        if (event.button !== 0 || drag) return;
        drag = {id: event.pointerId, x: event.clientX};
        manifold.setPointerCapture(event.pointerId);
      });
      manifold.addEventListener('pointermove', event => {
        if (event.pointerId !== drag?.id) return;
        yaw += (event.clientX - drag.x) * .009;
        drag.x = event.clientX;
        drawManifold(Number(slider.value));
      });
      manifold.addEventListener('lostpointercapture', () => { drag = null; });
      updatePositions();
      drawTangent();
    })();
