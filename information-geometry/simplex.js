(() => {
  'use strict';
  const root = document.getElementById('simplex-widget');
  const el = id => root.querySelector('#' + id);
  const svg = el('view'), mode = el('mode'), s1 = el('slider1'), s2 = el('slider2');
  let a=20,b=30, yaw=-0.68, elevation=0.56, dragging=null;
  const fmt = n => (n/100).toFixed(2), ns = 'http://www.w3.org/2000/svg';
  const make=(tag,attrs={},content)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(content!==undefined)n.textContent=content;return n};
  const append=(tag,attrs,content)=>svg.appendChild(make(tag,attrs,content));
  const line=(x1,y1,x2,y2,stroke='#32445d',width=1,dash='')=>append('line',{x1,y1,x2,y2,stroke,'stroke-width':width,...(dash?{'stroke-dasharray':dash}:{})});
  const txt = (x, y, text, size = 13, fill = '#ccd8e8', anchor = 'middle', weight = '500') =>
    append('text', {
      x, y, 'text-anchor': anchor,
      style: `fill:${fill}; font:${weight} ${size}px -apple-system,BlinkMacSystemFont,sans-serif`,
    }, text);
  const circle=(x,y,r,fill,stroke='none',sw=0)=>append('circle',{cx:x,cy:y,r,fill,stroke,'stroke-width':sw});
  const poly=(points,fill,stroke,sw=1,dash)=>append('polygon',{points:points.map(q=>q.join(',')).join(' '),fill,stroke,'stroke-width':sw,...(dash?{'stroke-dasharray':dash}:{})});
  function draw2d(){
    const x0=49,y0=285,S=245, X=v=>x0+S*v, Y=v=>y0-S*v;
    // Small unobtrusive grid only within triangle
    for(let k=1;k<=4;k++){
      let t=k/5;
      line(X(t),Y(0),X(t),Y(1-t),'#192b3d',.8);
      line(X(0),Y(t),X(1-t),Y(t),'#192b3d',.8);
    }
    poly([[X(0),Y(0)],[X(1),Y(0)],[X(0),Y(1)]],'#102a42','#44728b',1.15);
    // Re-draw diagonal as a distinct dashed boundary
    line(X(1),Y(0),X(0),Y(1),'#e5a96b',2,'5 5');
    line(X(0),Y(0),X(1.06),Y(0),'#afc0d5',1.65);
    line(X(0),Y(0),X(0),Y(1.06),'#afc0d5',1.65);
    for(let k=0;k<=5;k++){
      const t=k/5;line(X(t),Y(0)-3,X(t),Y(0)+3,'#71849c',1);
      line(X(0)-3,Y(t),X(0)+3,Y(t),'#71849c',1);
      if(k%1===0){txt(X(t),Y(0)+17,t.toFixed(1),10,'#8094ad'); if(k>0)txt(X(0)-8,Y(t)+3,t.toFixed(1),10,'#8094ad','end')}
    }
    txt(322,303,'p₁',16,'#e1eaf5','middle','650');txt(37,17,'p₂',16,'#e1eaf5','middle','650');
    txt(260,92,'p₃ = 0',13,'#ffbf7a','middle','650');
    const x=X(a/100),y=Y(b/100);
    line(x,Y(0),x,y,'#65bcf9',1.25,'3 3');line(X(0),y,x,y,'#65bcf9',1.25,'3 3');
    circle(x,y,12,'#5fbdff20','#5fbdff60',1);circle(x,y,6.7,'#55b6ff','#e4f5ff',1.5);
    const tx=x>252?x-15:x+14, ty=y<42?y+17:y-12;
    txt(tx,ty,'P',15,'#bce7ff',x>252?'end':'start','750');
    txt(x,Y(0)+29,fmt(a),11,'#a9ddff');txt(X(0)-12,y-8,fmt(b),11,'#a9ddff','end');
    svg.dataset.map='2d';
  }
  function draw3d(){
    // Orthographic projection of the plane p1+p2+p3=1 in R^3.
    // Rotate around the vertical axis and tilt for legible spatial depth.
    const c=Math.cos(yaw), s=Math.sin(yaw), ce=Math.cos(elevation), se=Math.sin(elevation);
    const project = ([x,y,z])=> {
      const xr=c*x-s*y, yr=s*x+c*y;
      return [180+151*xr, 249-151*(ce*z-se*yr)];
    };
    const O=project([0,0,0]), V1=project([1,0,0]), V2=project([0,1,0]), V3=project([0,0,1]);
    // Axis lines from the origin to each unit vector
    for(const [p,label] of [[V1,'p₁'],[V2,'p₂'],[V3,'p₃']]){
      line(O[0],O[1],p[0],p[1],'#627790',1.4);
      const dx=p[0]-O[0],dy=p[1]-O[1],len=Math.hypot(dx,dy)||1;
      txt(p[0]+10*dx/len,p[1]+10*dy/len,label,12,'#94aac3');
    }
    circle(O[0],O[1],2.5,'#7c8da5');txt(O[0]-8,O[1]+14,'0',10,'#8091aa');
    poly([V1,V2,V3],'#1a638f55','#7aa5c8',1.4);
    // Boundary shown dashed, to distinguish M3 from its closure
    for(const [A,B] of [[V1,V2],[V2,V3],[V3,V1]])line(A[0],A[1],B[0],B[1],'#e8ab72',1.65,'5 4');
    const P=project([a/100,b/100,(100-a-b)/100]);
    line(P[0],P[1],O[0],O[1],'#69b7e680',1.05,'3 4');
    circle(P[0],P[1],13,'#55b6ff24','#68c6ff75',1);circle(P[0],P[1],7,'#55b6ff','#effaff',1.4);
    txt(P[0]+13,P[1]-10,'P',16,'#bce7ff','start','750');
    // Position labels with outward offsets to reduce overlap
    const centroid=[(V1[0]+V2[0]+V3[0])/3,(V1[1]+V2[1]+V3[1])/3];
    for(const [v,label] of [[V1,'(1,0,0)'],[V2,'(0,1,0)'],[V3,'(0,0,1)']]){
      const dx=v[0]-centroid[0],dy=v[1]-centroid[1],d=Math.hypot(dx,dy)||1;
      let xx=v[0]+21*dx/d, yy=v[1]+21*dy/d;
      xx=Math.max(36,Math.min(324,xx));yy=Math.max(14,Math.min(317,yy));
      txt(xx,yy,label,11,'#e9b585','middle','550');
    }
    txt(180,17,'p₁ + p₂ + p₃ = 1',14,'#d7e6f6','middle','650');
    svg.dataset.map='3d';
  }
  function render(){
    a=Math.max(1,Math.min(a,99-b));b=Math.max(1,Math.min(b,99-a));
    s1.max=String(99-b);s2.max=String(99-a);
    s1.value=String(a);s2.value=String(b);
    el('limit1').textContent='上限 '+fmt(99-b)+'（p₂ 固定）';
    el('limit2').textContent='上限 '+fmt(99-a)+'（p₁ 固定）';
    el('p1value').textContent='p₁ = '+fmt(a);el('p2value').textContent='p₂ = '+fmt(b);el('p3value').textContent='p₃ = '+fmt(100-a-b);
    el('out1').textContent=fmt(a);el('out2').textContent=fmt(b);
    el('coordinate').textContent='(p₁(P), p₂(P), p₃(P)) = ('+[fmt(a),fmt(b),fmt(100-a-b)].join(', ')+')';
    const is3=mode.checked;el('modeTitle').textContent=is3?'3次元空間 ℝ³ での表示':'2次元座標表示';el('visualPanel').classList.toggle('threeActive',is3);
    svg.replaceChildren(make('title',{},'分布 P の'+(is3?'三次元':'二次元')+'表示'));
    if(is3)draw3d();else draw2d();
  }
  s1.addEventListener('input',()=>{a=+s1.value;render()});
  s2.addEventListener('input',()=>{b=+s2.value;render()});
  mode.addEventListener('change',render);
  function svgXY(e){const point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;const matrix=svg.getScreenCTM();return matrix?point.matrixTransform(matrix.inverse()):{x:0,y:0}}
  svg.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    const p=svgXY(e);
    if(mode.checked){dragging={id:e.pointerId,x:p.x,y:p.y};svg.setPointerCapture(e.pointerId)}
    else{const x=49+245*a/100,y=285-245*b/100;if(Math.hypot(p.x-x,p.y-y)<26){dragging={id:e.pointerId};svg.setPointerCapture(e.pointerId)}}
  });
  svg.addEventListener('pointermove',e=>{
    if(!dragging||dragging.id!==e.pointerId)return;
    const p=svgXY(e);
    if(mode.checked){const dx=p.x-dragging.x,dy=p.y-dragging.y;yaw+=dx*.009;elevation=Math.max(.10,Math.min(1.25,elevation-dy*.006));dragging.x=p.x;dragging.y=p.y;render()}
    else{
      // Both coordinates are controlled only when the user explicitly drags P.
      // Clamping preserves 0.01 in all three coordinates.
      const nextA=Math.max(1,Math.min(98,Math.round((p.x-49)/245*100)));
      const nextB=Math.max(1,Math.min(98,Math.round((285-p.y)/245*100)));
      a=nextA;b=Math.max(1,Math.min(nextB,99-a));
      render();
    }
  });
  const end=e=>{if(dragging&&dragging.id===e.pointerId)dragging=null};
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
  render();
})();
