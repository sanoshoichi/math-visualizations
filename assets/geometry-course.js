(() => {
  "use strict";

  const colors = ["var(--blue)", "var(--green)", "var(--gold)", "var(--red)"];
  const ink = "var(--muted)";
  const rad = degrees => degrees * Math.PI / 180;
  const fmt = value => (Math.abs(value) < .0005 ? 0 : value).toFixed(3);
  const line = ([x1,y1], [x2,y2], color = ink, width = 1, dash = "") =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}"/>`;
  const point = ([x,y], color, r = 4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  const ring = ([x,y], r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${ink}"/>`;
  const label = ([x,y], text, align = "start") => `<text x="${x}" y="${y}" text-anchor="${align}">${text}</text>`;
  const path = (points, color, width = 2.5, dash = "") =>
    `<polyline fill="none" points="${points.map(p => p.join(",")).join(" ")}" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}"/>`;
  const samples = (a, b, fn, steps = 80) => Array.from({length:steps+1}, (_,i) => fn(a + (b-a)*i/steps));
  const end = ([x,y], [dx,dy], scale) => [x+scale*dx,y+scale*dy];

  function arrow(a, b, color) {
    const length = Math.hypot(b[0]-a[0],b[1]-a[1]);
    if (length < .1) return "";
    const angle = Math.atan2(b[1]-a[1],b[0]-a[0]);
    const head = offset => [b[0]-Math.min(7,length/3)*Math.cos(angle+offset), b[1]-Math.min(7,length/3)*Math.sin(angle+offset)];
    return line(a,b,color,2.3) + path([head(.5),b,head(-.5)],color,1.7);
  }

  function plane(xmin, xmax, ymin, ymax, xLabel, yLabel) {
    const map = ([x,y]) => [36+(x-xmin)/(xmax-xmin)*285,155-(y-ymin)/(ymax-ymin)*129];
    return {
      map,
      axes: line([36,155],[324,155])+line([36,155],[36,23])+label([319,176],xLabel,"end")+label([42,19],yLabel),
      curve: (a,b,fn,color,width,dash) => path(samples(a,b,x=>map([x,fn(x)])),color,width,dash),
      mark: (xy,color) => point(map(xy),color),
      stroke: (a,b,color,width,dash) => line(map(a),map(b),color,width,dash)
    };
  }

  function bars(values, min, max) {
    const x = n => 25+(n-min)/(max-min)*310;
    const svg = line([x(0),16],[x(0),155],ink,1,"3 4") + values.map(([name,n],i)=>{
      const y = 39+43*i;
      return label([25,y-12],name)+label([335,y-12],fmt(n),"end")+
        line([x(0),y],[x(n),y],colors[i],5)+point([x(n),y],colors[i]);
    }).join("") + line([25,155],[335,155]) + label([25,174],String(min)) + label([335,174],String(max),"end");
    return {svg,readings:values};
  }

  const demos = {
    covariant(degrees) {
      const t=rad(degrees), s=Math.sin(t), c=Math.cos(t), center=[138,90];
      const at=end(center,[s,-c],61);
      const total=end(at,[-s,0],50);
      const tangent=end(at,[-s*c*c,-s*s*c],50);
      const normal=end(at,[-s*s*s,s*s*c],50);
      const key=[["全微分 dY/dt",s],["接成分の長さ",Math.abs(s*c)],["法線成分の長さ",s*s]];
      return {
        svg:ring(center,61)+line([77,90],[199,90],ink,1,"3 3")+line(center,at,ink)+point(at,ink)+label([at[0]+8,at[1]-5],"P")+
          line(tangent,total,colors[2],1,"3 3")+line(normal,total,colors[1],1,"3 3")+
          arrow(at,normal,colors[2])+arrow(at,tangent,colors[1])+arrow(at,total,colors[0])+
          label([211,79],"球の断面")+label([211,102],"経度 = 0"),
        readings:[...key,["接成分の係数 Γᶿφφ",-s*c],["法線成分の係数",-s*s]]
      };
    },
    parallel(degrees) {
      const t=rad(degrees), c=Math.cos(t), s=Math.sin(t), o=[154,90], at=end(o,[c,-s],48);
      const radial=end(at,[c*c,-c*s],49), total=end(at,[1,0],49);
      const tangential=end(at,[s*s,s*c],49);
      return {
        svg:ring(o,48)+line(o,at,ink)+point(at,ink)+
          line(radial,total,colors[2],1,"3 3")+line(tangential,total,colors[1],1,"3 3")+
          arrow(at,radial,colors[1])+arrow(at,tangential,colors[2])+arrow(at,total,colors[0]),
        readings:[["半径方向の係数",c],["円周方向の係数",-s],["ベクトルの長さ",1]]
      };
    },
    geodesics(degrees) {
      const t=rad(degrees), s=Math.sin(t), c=Math.cos(t), center=[151,90];
      const at=end(center,[s,-c],60);
      return {
        svg:ring(center,60)+line([91,90],[211,90],colors[0],1.5)+line(end(center,[-s,-c],60),at,colors[2],1.5)+
          point(at,colors[2])+arrow(at,end(at,[-c*c/s,-c],20),colors[1])+label([236,94],"球の断面"),
        readings:[["赤道の接加速度",0],["選んだ緯線の接加速度（eθ 成分）",-c/s]]
      };
    },
    normal(x) {
      const X = x=>x+x*x/2, px = distance=>120+137*distance;
      const ticks = (values, toX,y,color) => values.map(value => line([px(toX(value)),y-6],[px(toX(value)),y+6],color,2)).join("");
      const selected = px(X(x));
      return {
        svg:label([38,39],"X")+label([38,108],"x")+line([54,58],[296,58])+line([54,127],[296,127])+
          ticks(samples(-.4,1.2,v=>v,8),v=>v,58,colors[0])+ticks(samples(-.6,.7,v=>v,13),X,127,colors[1])+
          line([selected,58],[selected,127],colors[2],1,"3 3")+point([selected,58],colors[2])+point([selected,127],colors[2]),
        readings:[["選んだ点の X",X(x)],["x 座標での接続係数",1/(1+x)],["X 座標での接続係数",0]]
      };
    },
    tensor(r) {
      const result=bars([["∂ᵣgφφ",2*r],["第1添字の補正",-r],["第2添字の補正",-r]],-3,5);
      result.readings.push(["三項の和",0]);
      return result;
    },
    holonomy(degrees) {
      const angle=rad(degrees), center=[91,88], radius=50, right=[245,96];
      const onCircle=t=>end(center,[Math.cos(t),-Math.sin(t)],radius);
      const a=onCircle(0), b=onCircle(angle);
      return {
        svg:ring(center,radius)+line(center,a,colors[0],2)+line(b,center,colors[0],2)+
          path(samples(0,angle,onCircle),colors[0])+arrow(end(center,[1,0],24),end(center,[1,0],34),colors[0])+
          arrow(onCircle(angle*.42),onCircle(angle*.60),colors[0])+arrow(end(center,[Math.cos(angle),-Math.sin(angle)],32),end(center,[Math.cos(angle),-Math.sin(angle)],20),colors[0])+
          point(center,ink)+label([center[0]-10,center[1]+15],"N")+label([a[0]+4,a[1]+10],"A")+label([b[0]-5,b[1]-8],"B")+
          label([94,161],"球を北極側から見る","middle")+label([246,161],"北極の接平面","middle")+
          arrow(right,end(right,[1,0],48),colors[1])+arrow(right,end(right,[Math.cos(angle),-Math.sin(angle)],48),colors[2]),
        readings:[["経度差（度）",degrees],["三角形の面積（単位球）",angle],["一周後の回転角（度）",degrees]]
      };
    },
    ricci(a) {
      const k=1/(a*a), result=bars([["Ric(e₁,e₁)",k],["Ric(e₂,e₂)",k],["Ric(e₃,e₃)",0]],0,3);
      result.readings.push(["和＝スカラー曲率",2*k]);
      return result;
    },
    bianchi(d) {
      return bars([["∇ᵘRᵤᵥ",d/2],["−∂ᵥR/2",-d/2],["∇ᵘGᵤᵥ",0]],-1.6,1.6);
    },
    newton(r) {
      const phi=-1/r, slope=1/r**2, lo=Math.max(1,r-.5), hi=Math.min(5,r+.5);
      const q=plane(1,5,-1.08,0,"距離 r","ポテンシャル Φ");
      return {
        svg:q.axes+q.curve(1,5,v=>-1/v,colors[0])+q.stroke([lo,phi+slope*(lo-r)],[hi,phi+slope*(hi-r)],colors[1],2)+q.mark([r,phi],colors[1]),
        readings:[["ポテンシャル Φ",phi],["傾き dΦ/dr",slope],["外向きを正にした加速度",-slope]]
      };
    },
    coupling(rho) {
      const q=plane(0,1,0,2.2,"距離 r","Φ(r) − Φ(0)");
      return {
        svg:q.axes+q.curve(0,1,r=>2*Math.PI*rho*r*r/3,colors[0]),
        readings:[["表面と中心の Φ の差",2*Math.PI*rho/3],["ラプラシアン ∇²Φ",4*Math.PI*rho],["4πGρ",4*Math.PI*rho]]
      };
    },

  };

  for (const figure of document.querySelectorAll("[data-gr-lab]")) {
    const demo = demos[figure.dataset.grLab];
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
        return [term,quantity];
      }));
    }
    input.addEventListener("input",draw);
    draw();
  }

  const route = location.hash.slice(1);
  if (/^(?:[1-9]|1[0-6]|title|definition-title|calculation-section|calculation-title|basis-matrices)$/.test(route) &&
      !document.getElementById(route)) location.replace("backup/#"+route);
})();
