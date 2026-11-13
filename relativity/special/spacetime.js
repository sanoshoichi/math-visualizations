(() => {
  "use strict";

  const slider = document.getElementById("speed");
  const speedValue = document.getElementById("speed-value");
  const svg = document.getElementById("spacetime");
  const order = document.getElementById("event-order");
  const coordinateF = document.getElementById("coord-f");
  const coordinateE = document.getElementById("coord-e");
  const distance = document.getElementById("delta-x");
  const time = document.getElementById("delta-t");
  const f = [0, 2];
  const e = [2.75, 3.25];
  const dx = e[0] - f[0];
  const dt = e[1] - f[1];
  const simultaneous = dt / dx;
  const ink = "var(--ink)";
  const blue = "var(--blue)";
  const gold = "var(--gold)";

  function boost([x, t], beta, gamma) {
    return [gamma * (x - beta * t), gamma * (t - beta * x)];
  }

  function signed(value) {
    if (value === 0) return "0";
    const magnitude = Math.abs(value);
    const digits = magnitude >= .01 ? 2 : 4;
    const number = magnitude < .0001 ? magnitude.toExponential(2) : magnitude.toFixed(digits);
    return (value < 0 ? "−" : "+") + number;
  }

  function coordinates([x, t]) {
    return "(" + (Math.abs(x) < .005 ? 0 : x).toFixed(2) + ", " + t.toFixed(2) + ")";
  }

  function draw() {
    const beta = Number(slider.value);
    const gamma = 1 / Math.sqrt(1 - beta ** 2);
    const [dxPrime, dtPrime] = boost([dx, dt], beta, gamma);
    const isSimultaneous = Math.abs(dtPrime) < 1e-12;
    const betaText = isSimultaneous ? "5/11 ≈ 0.4545" : beta.toFixed(4);
    speedValue.value = betaText;
    slider.setAttribute("aria-valuetext", betaText);
    coordinateF.textContent = coordinates(boost(f, beta, gamma));
    coordinateE.textContent = coordinates(boost(e, beta, gamma));
    distance.textContent = signed(dxPrime);
    time.textContent = signed(isSimultaneous ? 0 : dtPrime);
    order.textContent = isSimultaneous ? "列車では E と F が同時に光る。" :
      "列車では " + (dtPrime > 0 ? "F が E" : "E が F") +
      " より " + signed(Math.abs(dtPrime)).slice(1) + " 秒先に光る。";

    const width = Math.floor(svg.getBoundingClientRect().width);
    if (width < 100) return;
    const scale = (width - 48) / 5.25;
    const height = Math.ceil(6.2 * scale + 36);
    const map = ([x, t]) => [24 + x * scale, height - 23 - t * scale];

    function line([ax, ay], [bx, by], color, weight, dash = "", opacity = 1) {
      return `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="${weight}" stroke-dasharray="${dash}" opacity="${opacity}"/>`;
    }

    function arrow(from, to, color, dash) {
      const a = map(from), b = map(to);
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (length < .6) return "";
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const size = Math.min(8, length * .38);
      const wing = offset => [b[0] - size * Math.cos(angle + offset), b[1] - size * Math.sin(angle + offset)];
      return line(a, b, color, 2, dash) + line(wing(.5), b, color, 1.7) + line(wing(-.5), b, color, 1.7);
    }

    function label(at, value, dx, dy, axis = false) {
      const [x, y] = map(at);
      return `<text x="${x + dx}" y="${y + dy}" class="${axis ? "axis-name" : ""}">${value}</text>`;
    }

    function dot(at) {
      const [x, y] = map(at);
      return `<circle cx="${x}" cy="${y}" r="4.4" fill="${gold}"/>`;
    }

    const o = [0, 0];
    const groundCorner = [e[0], f[1]];
    const trainCorner = [f[0] + gamma * dxPrime, f[1] + gamma * beta * dxPrime];
    const xpEnd = [5.18, beta * 5.18];
    const tpEnd = [beta * 6.03, 6.03];
    const axis = (end, color) => line(map(o), map(end), color, 1.25, "", .65);
    const trainAxes = beta < .025 ? "" : axis(xpEnd, blue) + axis(tpEnd, blue) +
      label(xpEnd, "x′", 5, -6, true) + label(tpEnd, "ct′", 4, -6, true);

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("height", height);
    svg.innerHTML = axis([5.18, 0], ink) + axis([0, 6.03], ink) + trainAxes +
      arrow(f, trainCorner, blue) + arrow(trainCorner, e, blue) +
      arrow(f, groundCorner, ink, "5 5") + arrow(groundCorner, e, ink, "5 5") +
      dot(f) + dot(e) + label(f, "F", -15, 4) + label(e, "E", 8, -5) + label(o, "O", -13, 15) +
      label([5.18, 0], beta < .025 ? "x, x′" : "x", 0, 16, true) +
      label([0, 6.03], beta < .025 ? "ct, ct′" : "ct", -8, -5, true);
  }

  function setSpeed(value) {
    slider.value = String(value);
    draw();
  }

  slider.addEventListener("input", draw);
  slider.addEventListener("keydown", event => {
    const moves = {ArrowLeft: -.001, ArrowDown: -.001, ArrowRight: .001, ArrowUp: .001,
      PageDown: -.05, PageUp: .05};
    if (!Object.hasOwn(moves, event.key)) return;
    event.preventDefault();
    setSpeed(Math.min(.8, Math.max(0, Number(slider.value) + moves[event.key])));
  });
  document.getElementById("simultaneous-speed").addEventListener("click", () => setSpeed(simultaneous));
  document.getElementById("example-speed").addEventListener("click", () => setSpeed(.6));
  new ResizeObserver(draw).observe(svg.parentElement);
  draw();
})();
