(() => {
  "use strict";
  const input = document.getElementById("release");
  const value = document.getElementById("release-value");
  const svg = document.getElementById("worldline");
  const status = document.getElementById("initial-acceleration");

  // The variables are u = x/L, T = ct/L, and s = cτ/L.
  function trajectory(initial) {
    const energy = Math.hypot(1, initial);
    const step = .006;
    const points = [[initial, 0]];
    let state = [initial, 0, 0]; // u, du/ds, T
    function derivative([u, velocity]) {
      const nSquared = 1 + u * u;
      return [velocity, -u * (energy / nSquared) ** 2, energy / nSquared];
    }
    const advance = (y, k, amount) => y.map((component, i) => component + amount * k[i]);
    while (state[2] < 1.4) {
      const previous = state;
      const k1 = derivative(state);
      const k2 = derivative(advance(state, k1, step / 2));
      const k3 = derivative(advance(state, k2, step / 2));
      const k4 = derivative(advance(state, k3, step));
      state = state.map((component, i) => component + step * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]) / 6);
      const fraction = Math.min(1, (1.4 - previous[2]) / (state[2] - previous[2]));
      const endpoint = state.map((component, i) => previous[i] + fraction * (component - previous[i]));
      points.push([endpoint[0], endpoint[2]]);
    }
    return points;
  }

  function draw() {
    const initial = Number(input.value);
    const acceleration = initial / (1 + initial * initial);
    value.value = initial.toFixed(2);
    status.textContent = "手放した瞬間の位置の二階微分は " +
      (initial === 0 ? "0" : "−" + acceleration.toFixed(2) + " c²/L") + "。";
    const px = u => 64 + u * 240;
    const py = t => 214 - t * 124;
    const point = ([u, t]) => px(u) + "," + py(t);
    const line = (a, b, color, dash = "") =>
      '<polyline points="' + [point(a), point(b)].join(" ") + '" fill="none" stroke="' + color + '" stroke-dasharray="' + dash + '"/>';
    const label = (u, t, text, dx = 0, dy = 0) =>
      '<text x="' + (px(u) + dx) + '" y="' + (py(t) + dy) + '">' + text + '</text>';
    const ticks = [0, .5, 1].map(u => line([u,0],[u,-.037],"var(--muted)") + label(u,0,String(u),-4,19)).join("");
    svg.innerHTML = line([-.1,0],[1.11,0],"var(--muted)") +
      line([0,0],[0,1.51],"var(--muted)") + ticks +
      label(0,1.51,"ct/L",-17,-8) + label(1.11,0,"x/L",3,4) +
      line([initial,0],[initial,1.4],"var(--ink)","5 4") +
      '<polyline points="' + trajectory(initial).map(point).join(" ") +
      '" fill="none" stroke="var(--blue)" stroke-width="2.5"/>' +
      '<circle cx="' + px(initial) + '" cy="' + py(0) + '" r="4" fill="var(--gold)"/>' +
      label(initial,0,"手放す",-19,36);
  }
  input.addEventListener("input",draw);
  draw();
})();
