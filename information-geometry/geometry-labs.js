(() => {
  'use strict';
  const P = [.20, .30, .50];
  const Q = [.78, .02, .20];
  const ink = 'var(--ink)', muted = 'var(--muted)', blue = 'var(--blue)', gold = 'var(--gold)';
  const fmt = (n, digits = 2) => n.toFixed(digits);
  const tuple = (point, digits = 2) => '(' + point.map(x => fmt(x, digits)).join(', ') + ')';
  const sample = (fn, n = 70) => Array.from({length:n + 1}, (_, j) => fn(j / n));

  function mark(svg, tag, attributes, content) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attributes)) node.setAttribute(k, v);
    if (content !== undefined) node.textContent = content;
    svg.appendChild(node);
  }
  function path(svg, points, color = muted, width = 1, dash = '', fill = 'none') {
    mark(svg, 'polyline', {points:points.map(p => p.join(',')).join(' '), fill, stroke:color,
      'stroke-width':width, 'stroke-dasharray':dash, 'stroke-linejoin':'round'});
  }
  function dot(svg, [x, y], color, square = false) {
    if (square) mark(svg, 'rect', {x:x-4,y:y-4,width:8,height:8,fill:color});
    else mark(svg, 'circle', {cx:x,cy:y,r:4.7,fill:color});
  }
  function label(svg, [x,y], value, anchor = 'middle') {
    mark(svg, 'text', {x,y,'text-anchor':anchor}, value);
  }
  function arrow(svg, start, end, color, dash) {
    path(svg, [start,end], color, 2.5, dash);
    const a = Math.atan2(end[1]-start[1],end[0]-start[0]);
    const wing = d => [end[0]-8*Math.cos(a+d),end[1]-8*Math.sin(a+d)];
    path(svg, [wing(-.48),end,wing(.48)],color,2);
  }

  function fisher(svg, p) {
    const r = .70-p, g11 = 1/p+1/r, g22 = 1/.30+1/r, g12 = 1/r;
    const length = Math.sqrt(g11), horizontal = g12/length;
    const vertical = Math.sqrt(g22-horizontal*horizontal);
    const angle = Math.atan2(vertical,horizontal);
    const origin = [58,153], scale = 32;
    const first = [origin[0]+scale*length,origin[1]];
    const second = [origin[0]+scale*horizontal,origin[1]-scale*vertical];
    path(svg,sample(t=>[origin[0]+19*Math.cos(t*angle),origin[1]-19*Math.sin(t*angle)],20));
    arrow(svg,origin,first,blue);
    arrow(svg,origin,second,gold,'5 3');
    dot(svg,origin,ink);
    label(svg,[first[0],first[1]+20],'e₁');
    label(svg,[second[0],second[1]-9],'e₂');
    label(svg,[origin[0]-14,origin[1]+8],'0');
    return 'P = '+tuple([p,.30,r])+'　基底の長さ '+fmt(length)+'、'+fmt(Math.sqrt(g22))+'　内積 '+fmt(g12)+'　角度 '+fmt(angle*180/Math.PI,1)+'°';
  }

  const north = P.map(Math.sqrt), south = Q.map(Math.sqrt);
  const omega = Math.acos(north.reduce((a,x,i)=>a+x*south[i],0));
  function spherePoint(t) {
    return north.map((x,i)=>(Math.sin((1-t)*omega)*x+Math.sin(t*omega)*south[i])/Math.sin(omega));
  }
  function sphere(svg,t) {
    // Orthographic view along (1,1,1). Work in unit-radius coordinates for drawing.
    const map = ([x,y,z]) => [175+137*(x-y)/Math.sqrt(2),100-108*(2*z-x-y)/Math.sqrt(6)];
    for (let axis = 0; axis < 3; axis++) {
      const edge = sample(u => {
        const point = [0,0,0];
        point[axis] = Math.cos(u*Math.PI/2);
        point[(axis+1)%3] = Math.sin(u*Math.PI/2);
        return map(point);
      });
      path(svg,edge,muted,1.2,'3 3');
    }
    for (const h of [.3,.6,.85]) {
      const r = Math.sqrt(1-h*h);
      path(svg,sample(u=>map([r*Math.cos(u*Math.PI/2),r*Math.sin(u*Math.PI/2),h])), 'var(--line)');
    }
    path(svg,sample(u=>map(spherePoint(u))),blue,2.7);
    const first=map(north), last=map(south), point=spherePoint(t);
    dot(svg,first,ink); dot(svg,last,ink);
    label(svg,[first[0]-10,first[1]-7],'F(P)','end');
    label(svg,[last[0]+7,last[1]+16],'F(Q)','start');
    dot(svg,map(point),gold);
    return '弧上の分布 '+tuple(point.map(x=>x*x))+'　進んだ弧長 '+fmt(2*t*omega,3)+' ／ 全長 '+fmt(2*omega,3);
  }

  function mixture(t) { return P.map((x,i)=>(1-t)*x+t*Q[i]); }
  function exponential(t) {
    const weights=P.map((x,i)=>x**(1-t)*Q[i]**t);
    const sum=weights.reduce((a,b)=>a+b,0);
    return weights.map(x=>x/sum);
  }
  function dual(svg,t) {
    const map=([x,y])=>[88+172*x,178-172*y];
    path(svg,[[88,6],[260,178]],muted,1,'4 3');
    path(svg,[[88,6],[88,178],[266,178]]);
    label(svg,[68,20],'p₂'); label(svg,[280,185],'p₁'); label(svg,[79,196],'0');
    label(svg,[260,196],'1'); label(svg,[80,14],'1');
    path(svg,sample(u=>map(mixture(u))),blue,2.5);
    path(svg,sample(u=>map(exponential(u))),gold,2.5,'5 3');
    const start=map(P),end=map(Q);
    dot(svg,start,ink);dot(svg,end,ink);
    label(svg,[start[0]-7,start[1]-7],'P');label(svg,[end[0]+9,end[1]-5],'Q');
    dot(svg,map(mixture(t)),blue);dot(svg,map(exponential(t)),gold,true);
    return 'm 接続 '+tuple(mixture(t))+'　e 接続 '+tuple(exponential(t));
  }

  function kl(svg,s) {
    const exact=h=>-.20*Math.log1p(h/.20)-.50*Math.log1p(-h/.50);
    const quadratic=h=>3.5*h*h;
    const map=(h,y)=>[52+(h+.18)*490,172-308*y];
    path(svg,[map(-.18,0),map(.35,0)]);
    path(svg,[map(0,0),map(0,.46)]);
    label(svg,[41,24],'KL (nat)');
    for(const h of [-.18,0,.20,.35]) label(svg,[map(h,0)[0],193],String(h));
    label(svg,[331,180],'s');
    for (const y of [.2,.4]) {
      const [x,h]=map(0,y);
      path(svg,[[x-3,h],[x+3,h]]);
      label(svg,[x-6,h-3],String(y),'end');
    }
    for(const [fn,color,dash] of [[exact,blue,''],[quadratic,gold,'5 3']]) {
      path(svg,sample(u=>{const h=-.18+.53*u;return map(h,fn(h));}),color,2.2,dash);
    }
    dot(svg,map(s,exact(s)),blue);dot(svg,map(s,quadratic(s)),gold,true);
    return 'KL '+fmt(exact(s),5)+' nat　　二次近似 '+fmt(quadratic(s),5)+' nat';
  }

  for(const draw of [fisher,sphere,dual,kl]) {
    const lab=document.getElementById(draw.name+'-lab');
    const slider=document.getElementById(draw.name+'-control');
    const output=slider.parentElement.querySelector('output');
    const svg=lab.querySelector('svg');
    function update() {
      const value=Number(slider.value);
      output.value=fmt(value);
      svg.replaceChildren();
      lab.querySelector('[data-reading]').textContent=draw(svg,value);
    }
    slider.addEventListener('input',update);
    update();
  }
})();
