(() => {
  "use strict";
  const lab = document.querySelector("#twist-lab");
  if (!lab) return;

  const get = selector => lab.querySelector(selector);
  const time = get("#twist-time");
  const heading = get("#twist-heading");
  const omega = get("#twist-omega");
  const grid = get("[data-world-grid]");
  const cx = 150, cy = 133, pixelsPerMetre = 29;
  const px = x => cx + pixelsPerMetre * x;
  const py = y => cy - pixelsPerMetre * y;

  function element(parent, type, attrs, label) {
    const child = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (const [key, val] of Object.entries(attrs)) child.setAttribute(key, val);
    if (label !== undefined) child.textContent = label;
    parent.appendChild(child);
    return child;
  }

  function drawGrid() {
    for (let k = -4; k <= 4; k++) {
      element(grid, "line", {x1: px(k), x2: px(k), y1: py(4), y2: py(-4), class: k === 0 ? "twist-axis" : "twist-grid"});
      element(grid, "line", {y1: py(k), y2: py(k), x1: px(-4), x2: px(4), class: k === 0 ? "twist-axis" : "twist-grid"});
      if (k % 2 === 0) {
        element(grid, "text", {x: px(k), y: py(-4) + 13, "text-anchor": "middle"}, k);
        element(grid, "text", {x: px(-4) - 6, y: py(k) + 3, "text-anchor": "end"}, k);
      }
    }
    element(grid, "text", {x: 275, y: cy - 7, "text-anchor": "start"}, "x [m]");
    element(grid, "text", {x: cx + 8, y: 13}, "y [m]");
    element(grid, "path", {d: 'M265 133l-5 -2.5v5z M150 17l-2.5 5h5z', class: "twist-axis-head"});
  }

  // Integral of (cos(theta0 + w*t), sin(theta0 + w*t)); v = 1 m/s.
  function pose(t, theta0, w) {
    const halfTurn = w * t / 2;
    const sinc = Math.abs(halfTurn) < 1e-4 ? 1 - halfTurn ** 2 / 6 : Math.sin(halfTurn) / halfTurn;
    const chord = t * sinc;
    return {
      x: chord * Math.cos(theta0 + halfTurn),
      y: chord * Math.sin(theta0 + halfTurn),
      theta: theta0 + w * t
    };
  }

  function fixed(value) {
    return (Math.abs(value) < .005 ? 0 : value).toFixed(2);
  }

  function setPoint(node, x, y) {
    node.setAttribute("cx", px(x));
    node.setAttribute("cy", py(y));
  }

  function draw() {
    const t = time.valueAsNumber, w = omega.valueAsNumber;
    const theta0 = heading.valueAsNumber * Math.PI / 180;
    get('output[for="twist-time"]').textContent = fixed(t) + " s";
    get('output[for="twist-heading"]').textContent = heading.value + "°";
    get('output[for="twist-omega"]').textContent = fixed(w) + " rad/s";

    const points = [];
    for (let i = 0; i <= 72; i++) {
      const p = pose(3 * i / 72, theta0, w);
      points.push((i ? "L" : "M") + px(p.x).toFixed(2) + " " + py(p.y).toFixed(2));
    }
    get("[data-track]").setAttribute("d", points.join(" "));
    const p = pose(t, theta0, w);
    const vx = Math.cos(p.theta), vy = Math.sin(p.theta);
    get("[data-chassis]").setAttribute("transform", "translate(" + px(p.x) + " " + py(p.y) + ") rotate(" + (-p.theta * 180 / Math.PI) + ")");
    setPoint(get("[data-world-point]"), p.x, p.y);
    const arrow = get("[data-world-velocity]");
    arrow.setAttribute("x1", px(p.x));
    arrow.setAttribute("y1", py(p.y));
    arrow.setAttribute("x2", px(p.x + .8 * vx));
    arrow.setAttribute("y2", py(p.y + .8 * vy));
    get("[data-world-pos]").textContent = "(" + fixed(p.x) + ", " + fixed(p.y) + ")";
    get("[data-world-angle]").textContent = fixed(p.theta);
    get("[data-world-speed]").textContent = "(" + fixed(vx) + ", " + fixed(vy) + ")";
    get("[data-body-omega]").textContent = fixed(w);
    get("#twist-world-title").textContent = "床での車体原点 (" + fixed(p.x) + ", " + fixed(p.y) + ") m、速度 (" + fixed(vx) + ", " + fixed(vy) + ") m/s";
  }

  drawGrid();
  setPoint(get("[data-start]"), 0, 0);
  [time, heading, omega].forEach(input => input.addEventListener("input", draw));
  draw();
})();
