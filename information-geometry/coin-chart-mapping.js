(()=>{
 const root=document.getElementById('coin-chart-mapping');
 if(!root)return;
 const get=s=>root.querySelector(s);
 const map=get('.space-map'),vel=get('.velocity'),input=get('#coin-map-s'),rate=get('#coin-map-a');
 const ink='var(--foreground)',muted='var(--muted-foreground)',color='var(--viz-series-1)',chart='var(--viz-series-3)',speed='var(--viz-series-2)';
 const number=x=>Number(x.toFixed(4)).toString().replace('-','−');
 const r=.5;
 const signed=x=>(x>0?'+':'')+x.toFixed(2).replace('-','−');
 function node(svg,tag,attrs,text){
   const e=document.createElementNS('http://www.w3.org/2000/svg',tag);
   Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));
   if(text!==undefined)e.textContent=text;
   svg.appendChild(e);return e;
 }
 function text(svg,x,y,s,style='',anchor='start'){
   return node(svg,'text',{x,y,class:style,'text-anchor':anchor},s);
 }
 function line(svg,x1,y1,x2,y2,stroke,thickness=1,dash=''){
   node(svg,'line',{x1,y1,x2,y2,stroke,'stroke-width':thickness,'stroke-dasharray':dash});
 }
 function circle(svg,p,r,stroke,fill){
   node(svg,'circle',{cx:p.x,cy:p.y,r,stroke,fill,'stroke-width':1.7});
 }
 function head(svg,x,y,dx,dy,col){
   const length=Math.hypot(dx,dy);
   if(length===0)return;
   const ux=dx/length,uy=dy/length;
   node(svg,'path',{d:'M '+(x-6*ux+3*uy)+' '+(y-6*uy-3*ux)+' L '+x+' '+y+' L '+(x-6*ux-3*uy)+' '+(y-6*uy+3*ux),fill:'none',stroke:col,'stroke-width':1.8});
 }
 function pointLabel(p,s,w){
   const right=p.x<w*.5;
   text(map,p.x+(right?9:-9),p.y-11,s,'name callout',right?'start':'end');
 }
 function mapping(p,q,col,y,name,description,w){
   // Both ends are vertical. The midpoint is on the line, so the name follows its arrow.
   const top=p.y+9,bot=q.y-9;
   node(map,'path',{d:'M '+p.x+' '+top+' C '+p.x+' '+y+', '+q.x+' '+y+', '+q.x+' '+bot,
     stroke:col,'stroke-width':2,'stroke-dasharray':'4 3',fill:'none'});
   head(map,q.x,bot,0,1,col);
   const mid=(p.x+q.x)/2, my=(top+bot+6*y)/8, towardLeft=mid>w*.57;
   const lx=mid+(towardLeft?-9:9);
   text(map,lx,my+4,name,'math callout',towardLeft?'end':'start');
   text(map,4,y+4,description,'subtle');
 }
 function draw(){
   const w=root.clientWidth||350, narrow=w<480, gutter=narrow?72:99;
   const left=gutter+7,right=w-14,span=right-left;
   const s=Number(input.value),a=Number(rate.value),q=r+a*s;
   const pp=x=>({x:left+x*span,y:165-20*Math.sin(2*Math.PI*(x-.14))});
   const ip=x=>({x:left+(x+1)*span/2,y:41});
   const jp=x=>({x:left+(x-.2)*span/.6,y:286});
   const p=pp(q),p0=pp(r),i=ip(s),j=jp(q);
   map.replaceChildren();map.setAttribute('viewBox','0 0 '+w+' 311');
   function arc(lo,hi,stroke,thick){
     const d=Array.from({length:65},(_,k)=>{const z=pp(lo+(hi-lo)*k/64);return (k?'L':'M')+z.x+' '+z.y}).join(' ');
     node(map,'path',{d,fill:'none',stroke,'stroke-width':thick,'stroke-linecap':'round'});
   }
   mapping(i,p,color,94,'γ : I → M','分布へ',w);
   mapping(p,j,chart,227,'π : U → J','座標へ',w);
   text(map,4,33,'I','math');text(map,4,51,'入力の区間');
   text(map,4,154,'M','math');text(map,4,172,'統計多様体');
   text(map,4,277,'J','math');text(map,4,295,'座標区間');
   line(map,left,41,right,41,muted);
   for(const x of [-1,1]){const z=ip(x);line(map,z.x,38,z.x,45,muted);text(map,z.x,63,number(x),'subtle','middle')}
   arc(0,1,muted,1.4);arc(.2,.8,color,3.5);
   line(map,left,286,right,286,chart,1.8);
   for(const x of [.2,.8]){const z=jp(x);circle(map,z,3,chart,'var(--background)');text(map,z.x,305,x.toFixed(2),'subtle','middle')}
   // Ring plus dot is intentional when the chosen point coincides with the starting point.
   for(const [origin,selected] of [[ip(0),i],[p0,p],[jp(r),j]]){
     circle(map,origin,6.8,ink,'none');circle(map,selected,4,color,color);
   }
   pointLabel(i,'s = '+number(s),w);
   const distributionLabel=text(map,p.x,p.y-12,'γ(s) = P','name callout');
   const subscript={class:'distribution-index','baseline-shift':'sub'};
   node(distributionLabel,'tspan',subscript,'r+as');
   node(distributionLabel,'tspan',{},' = P');
   node(distributionLabel,'tspan',subscript,number(q));
   const labelWidth=distributionLabel.getComputedTextLength();
   const labelX=p.x+9+labelWidth<=w-4?p.x+9:p.x-9-labelWidth;
   distributionLabel.setAttribute('x',Math.max(4,labelX));
   const atOrigin=Math.abs(q-r)<1e-10;
   const refSide=p0.x>p.x?'start':'end';
   text(map,p0.x+(refSide==='start'?7:-7),p0.y+22,atOrigin?'γ(s) = γ(0)':'γ(0)','callout',refSide);
   pointLabel(j,'π(γ(s)) = r + as = '+number(q),w);
   get('[data-s-out]').value=s.toFixed(2).replace('-','−');get('[data-a-out]').value=signed(a);
   vel.replaceChildren();vel.setAttribute('viewBox','0 0 '+w+' 59');
   const cx=w*.53,scale=(w*.80)/.52,tx=cx+a*scale;
   line(vel,cx-.255*scale,31,cx+.255*scale,31,muted);
   line(vel,cx,31,tx,31,speed,2.5);head(vel,tx,31,a,0,speed);
   circle(vel,{x:cx,y:31},3,ink,'var(--background)');
   text(vel,tx,20,a===0?'W = 0':'W','math','middle');text(vel,cx,52,'0','subtle','middle');
   text(vel,cx-.25*scale,52,'−0.25','subtle','middle');text(vel,cx+.25*scale,52,'+0.25','subtle','middle');
   const product=number(Math.abs(a))+' × '+(s<0?'('+number(s)+')':number(s));
   get('[data-coordinate]').textContent=number(r)+(a<0?' − ':' + ')+product+' = '+number(q);
   get('[data-heads]').textContent=number(q)+' = '+number(100*q)+'%';
   get('[data-tails]').textContent='1 − '+number(q)+' = '+number(100*(1-q))+'%';
   get('[data-speed]').textContent=signed(a);
 }
 input.addEventListener('input',draw);rate.addEventListener('input',draw);new ResizeObserver(draw).observe(root);draw();
})();
