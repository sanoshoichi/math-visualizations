(() => {
  "use strict";
  const colors = ["var(--blue)", "var(--green)", "var(--gold)", "var(--red)"];
  const axisColor = "var(--muted)";
  const gamma = beta => 1 / Math.sqrt(1 - beta * beta);
  const fmt = value => (Math.abs(value) < .0005 ? 0 : value).toFixed(3);
  const line = (a, b, color = axisColor, width = 1.2, dash = "") =>
    '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] +
    '" stroke="' + color + '" stroke-width="' + width + '" stroke-dasharray="' + dash + '"/>';
  const point = (at, color) =>
    '<circle cx="' + at[0] + '" cy="' + at[1] + '" r="4" fill="' + color + '"/>';
  const label = (x, y, text, align = "start") =>
    '<text x="' + x + '" y="' + y + '" text-anchor="' + align + '">' + text + '</text>';

  function arrow(a, b, color) {
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const head = offset => [b[0] - 8 * Math.cos(angle + offset), b[1] - 8 * Math.sin(angle + offset)];
    return line(a, b, color, 2.4) + line(b, head(.47), color, 2) + line(b, head(-.47), color, 2);
  }

  function bars(items, min, max) {
    const position = x => 22 + 316 * (x - min) / (max - min);
    let svg = line([position(0), 16], [position(0), 164], axisColor, .85, "4 4");
    for (const [i, [name, value]] of items.entries()) {
      const y = 35 + 49 * i;
      svg += label(22, y - 12, name) + label(338, y - 12, fmt(value), "end");
      svg += line([position(0), y], [position(value), y], colors[i], 6);
      svg += point([position(value), y], colors[i]);
    }
    svg += line([22, 166], [338, 166], axisColor, .8);
    svg += label(22, 182, String(min)) + label(338, 182, String(max), "end");
    if (min < 0) svg += label(position(0), 182, "0", "middle");
    return { svg, readings: items };
  }

  function plane(xmin, xmax, ymin, ymax, horizontal, vertical) {
    const scale = Math.min(300 / (xmax - xmin), 140 / (ymax - ymin));
    const map = ([x, y]) => [180 + (x - (xmin + xmax) / 2) * scale, 90 - (y - (ymin + ymax) / 2) * scale];
    const stroke = (a, b, color, width, dash) => line(map(a), map(b), color, width, dash);
    const mark = (x, y, color, name, dx = 7, dy = -6) => {
      const at = map([x, y]);
      return point(at, color) + label(at[0] + dx, at[1] + dy, name);
    };
    const axes = stroke([xmin, 0], [xmax, 0]) + stroke([0, ymin], [0, ymax]) +
      label(map([xmax, 0])[0] + 5, map([xmax, 0])[1] + 4, horizontal) +
      label(map([0, ymax])[0] + 4, map([0, ymax])[1] - 5, vertical);
    return { map, stroke, mark, axes };
  }

  const demos = {
    birth(beta) {
      return bars([["ガリレイ変換 u′/c", 1 - beta], ["光速一定 u′/c", 1]], 0, 1.1);
    },
    ether(beta) {
      const parallel = 1 / (1 - beta * beta);
      const perpendicular = gamma(beta);
      const plot = bars([["平行腕", parallel], ["垂直腕", perpendicular]], 0, 3.8);
      plot.readings.push(["往復時間の差（静止時を 1）", parallel - perpendicular]);
      return plot;
    },
    light(beta) {
      const q = plane(-1.9, 1.9, -.2, 1.65, "x", "ct");
      return {
        svg: q.axes + q.stroke([0,0],[beta*1.4,1.4],colors[0],3) +
          q.stroke([0,0],[-1.4,1.4],colors[1],2) + q.stroke([0,0],[1.4,1.4],colors[1],2) +
          q.mark(0,0,colors[2],"O",7,16),
        readings: [["光源の速度 / c", beta], ["左の光の速度 / c", -1], ["右の光の速度 / c", 1]]
      };
    },
    sync(distance) {
      const q = plane(-.4, 2.5, -.2, 4.4, "x", "t");
      return {
        svg: q.axes + q.stroke([0,0],[0,4.15],colors[0],3) + q.stroke([distance,0],[distance,4.15],colors[0],3) +
          q.stroke([0,0],[distance,distance],colors[1],2) + q.stroke([distance,distance],[0,2*distance],colors[1],2) +
          q.stroke([0,distance],[distance,distance],colors[2],1,"4 4") +
          q.mark(0,0,colors[0],"送信 A",-52,13) +
          q.mark(distance,distance,colors[2],"反射 B",12,5) +
          q.mark(0,2*distance,colors[1],"受信 A",-54,-4),
        readings: [["A の送信時刻（秒）", 0], ["B の反射時刻（秒）", distance], ["A の受信時刻（秒）", 2*distance]]
      };
    },
    length(beta) {
      return bars([["棒の静止系 L₀", 1], ["基準系 L", 1/gamma(beta)]],0,1.1);
    },
    interval(beta) {
      const factor = gamma(beta);
      const t = factor*(1.2 - beta*.6);
      const x = factor*(.6 - beta*1.2);
      return bars([["時間差 Δt′",t],["位置差 Δx′",x],["間隔 Δs²",x*x-t*t]],-2,4);
    },
    proper(beta) {
      const q = plane(-1.4, 6, -.8, 11, "x", "t");
      return {
        svg: q.axes + q.stroke([0,0],[0,10],colors[0],4) +
          q.stroke([0,0],[5*beta,5],colors[1],2) + q.stroke([5*beta,5],[0,10],colors[1],2) +
          q.mark(0,0,colors[0],"出発",-34,14) + q.mark(0,10,colors[0],"再会",-33,-5) +
          q.mark(5*beta,5,colors[1],"折り返し",10,3),
        readings: [["静止時計の経過（秒）",10],["往復時計の経過（秒）",10/gamma(beta)]]
      };
    },
    fourVelocity(beta) {
      const factor = gamma(beta);
      const plot = bars([["v/c",beta],["Uˣ/c",factor*beta],["U⁰/c",factor]],0,4);
      plot.readings.push(["U の内積 / c²", (factor*beta)**2-factor**2]);
      return plot;
    },
    energy(beta) {
      const factor = gamma(beta);
      const plot = bars([["E/(mc²)",factor],["|p|/(mc)",factor*beta],["運動エネルギー / mc²",factor-1]],0,4);
      plot.readings.push(["(E²−c²p²)/(m²c⁴)", factor**2-(factor*beta)**2]);
      return plot;
    },
    mass(heat) {
      return bars([["初期の質量 / 初期質量",1],["加熱後の質量 / 初期質量",1+heat]],0,1.6);
    },
    limit(energy) {
      return bars([["v/c",Math.sqrt(1-1/(energy*energy))],["光速 / c",1]],0,1.1);
    },
    tachyon(beta) {
      const arrival = 1/(2-beta);
      const x = 2*arrival;
      const reply = arrival + x*(1-2*beta)/(2-beta);
      const q = plane(-.45,2.7,-1.05,1.35,"x","t");
      return {
        svg: q.axes + q.stroke([0,-.95],[0,1.25],colors[0],3) +
          q.stroke([1-.95*beta,-.95],[1+1.25*beta,1.25],colors[0],3) +
          q.stroke([0,0],[x,arrival],colors[1],2.5) + q.stroke([x,arrival],[0,reply],colors[3],2.5,"5 3") +
          q.mark(0,0,colors[1],"発信",-34,-5) + q.mark(x,arrival,colors[2],"B が返信",6,-8) +
          q.mark(0,reply,colors[3],"到着",-35,13),
        readings: [["A の発信時刻",0],["B の返信時刻",arrival],["A への返信到着時刻",reply]]
      };
    },
    dual(a) {
      return bars([["Vˣ′",a],["ωₓ′",2/a],["ωₓ′ Vˣ′",2]],0,4.2);
    },
    tensor(degrees) {
      const angle = degrees*Math.PI/180;
      const c = Math.cos(angle), s = Math.sin(angle);
      const a = 2*c*c+s*s, b = 2*s*s+c*c;
      const plot = bars([["T′₁₁",a],["T′₂₂",b],["T′₁₂",-c*s]],-1,2.2);
      plot.readings.push(["トレース",a+b]);
      return plot;
    },
    metric(degrees) {
      const angle = degrees*Math.PI/180;
      const x = Math.cos(angle), y = Math.sin(angle);
      const q = plane(-1.3,2.3,-.35,1.25,"x","y");
      const vector = (a,b,color) => arrow(q.map(a),q.map(b),color);
      return {
        svg: q.axes + vector([0,0],[1,0],colors[0]) + vector([0,0],[x,y],colors[1]) +
          q.stroke([1,0],[1+x,y],colors[1],1,"3 3") + q.stroke([x,y],[1+x,y],colors[0],1,"3 3") +
          vector([0,0],[1+x,y],colors[2]),
        readings: [["交差成分 g₁₂",x],["和の長さの二乗",2+2*x],["和の長さ",Math.sqrt(2+2*x)]]
      };
    },
    operator(ratio) {
      const coeff = ratio*ratio - 1;
      const plot = (amplitude,color) => {
        const points = Array.from({length:121},(_,i) => {
          const x = 4*Math.PI*i/120;
          return (22+316*i/120)+","+(90-44*amplitude*Math.cos(x));
        });
        return '<polyline points="'+points.join(" ")+'" fill="none" stroke="'+color+'" stroke-width="2.4"/>';
      };
      return {
        svg: line([22,90],[338,90],axisColor,1,"4 4") + plot(1,colors[0]) + plot(coeff,colors[2]) +
          label(22,178,"x = 0") + label(338,178,"x = 4π","end"),
        readings: [["時間微分の寄与",ratio*ratio],["空間微分の寄与",-1],["演算結果の係数",coeff]]
      };
    },
    force(beta) {
      const factor = gamma(beta);
      return bars([["F",1],["Kˣ",factor],["K⁰",factor*beta]],0,3.4);
    },
    dust(beta) {
      const density = gamma(beta)**2;
      return bars([["T⁰⁰",density],["Tˣ⁰",beta*density],["Tˣˣ",beta*beta*density]],0,5.5);
    },
    stress(beta) {
      const g2 = gamma(beta)**2, p = .3;
      const plot = bars([["T⁰⁰",g2*(1+beta*beta*p)],["T⁰ˣ",g2*beta*(1+p)],["Tˣˣ",g2*(p+beta*beta)]],0,7);
      plot.readings.push(["横方向の応力 Tʸʸ",p]);
      return plot;
    },
    gauge(amplitude) {
      const wave = Math.SQRT1_2;
      const plot = bars([["φ",amplitude*wave],["Eᵧ",-wave],["B𝓏",-wave]],-1.5,1.5);
      plot.readings.push(["ゲージ変換後の Aₓ",amplitude*wave],["電場の縦成分 Eₓ",0]);
      return plot;
    },
    waveBoost(d) {
      const a = 1.25, b = 1.25, beta = .6;
      return bars([["∂²ₓ′",a*a*(1-beta*beta)],["∂²ₜ′",d*d-b*b],["∂ₓ′∂ₜ′",2*a*(d+beta*b)]],-2,3);
    },
    fields(beta) {
      const factor = gamma(beta);
      const e = -beta*factor, b = factor;
      return bars([["E′ᵧ",e],["cB′𝓏",b],["c²B′²−E′²",b*b-e*e]],-2.5,2.5);
    }
  };

  for (const figure of document.querySelectorAll("[data-lab]")) {
    const demo = demos[figure.dataset.lab];
    const input = figure.querySelector('input[type="range"]');
    const svg = figure.querySelector("svg");
    const output = figure.querySelector("[data-setting]");
    const readings = figure.querySelector("[data-readings]");

    function draw() {
      const result = demo(Number(input.value));
      output.value = input.value;
      svg.innerHTML = result.svg;
      readings.replaceChildren(...result.readings.flatMap(([name,value]) => {
        const term = document.createElement("dt");
        const quantity = document.createElement("dd");
        term.textContent = name;
        quantity.textContent = fmt(value);
        return [term, quantity];
      }));
    }

    input.addEventListener("input", draw);
    draw();
  }
})();
