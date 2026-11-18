(() => {
  const root = document.getElementById("three-curvatures");
  const rad = Math.PI / 180;
  const ink = "var(--ink)";
  const muted = "var(--muted)";
  const colorA = "var(--blue)";
  const colorB = "var(--gold)";
  const round = (x) => (Math.abs(x) < .0005 ? 0 : x).toFixed(3);
  const point = (p) => p.map(x => x.toFixed(2)).join(",");
  const vector = (a,b) => b.map((x,i) => x-a[i]);
  const plus = (a,b,s=1) => a.map((x,i) => x+s*b[i]);
  const path = (points,c=muted,w=1,d="",opacity=1) => '<path d="M'+points.map(point).join("L")+'" fill="none" stroke="'+c+'" stroke-width="'+w+'" stroke-dasharray="'+d+'" opacity="'+opacity+'" stroke-linecap="round" stroke-linejoin="round"/>';
  const sample = (fn,n=56) => Array.from({length:n+1},(_,i) => fn(i/n));
  const label = ([x,y],s,anchor="start") => '<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'">'+s+'</text>';
  const circle = ([x,y],r,c) => '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'"/>';
  const arrow = (a,b,c,dash="") => {
    const v=vector(a,b), length=Math.hypot(...v);
    if (length < .9) return "";
    const u=v.map(x=>x/length), tip=Math.min(7,length*.5), base=plus(b,u,-tip), n=[-u[1],u[0]];
    return path([a,base],c,2.5,dash)+'<polygon points="'+[b,plus(base,n,tip*.45),plus(base,n,-tip*.45)].map(point).join(" ")+'" fill="'+c+'"/>';
  };

  function surface(spherical,cx,cy,scale) {
    const tilt=18*rad;
    const toScreen=([x,y,z]) => spherical
      ? [cx+scale*y,cy+scale*(Math.sin(tilt)*x-Math.cos(tilt)*z)]
      : [cx+scale*y,cy-scale*.70*x];
    const position=(u,v) => spherical
      ? [Math.sin(u)*Math.cos(v),Math.sin(u)*Math.sin(v),Math.cos(u)]
      : [u*Math.cos(v),u*Math.sin(v),0];
    const radial=(u,v) => spherical
      ? [Math.cos(u)*Math.cos(v),Math.cos(u)*Math.sin(v),-Math.sin(u)]
      : [Math.cos(v),Math.sin(v),0];
    const angular=(v) => [-Math.sin(v),Math.cos(v),0];
    const project=(u,v) => toScreen(position(u,v));
    const latitude=(u,a,b) => sample(s=>project(u,a+(b-a)*s));
    const meridian=(v,a,b) => sample(s=>project(a+(b-a)*s,v),24);
    let grid="", rim="";
    if(spherical) {
      rim=grid='<circle cx="'+cx+'" cy="'+cy+'" r="'+scale+'" fill="var(--wash)" fill-opacity=".27" stroke="'+muted+'" stroke-opacity=".65"/>';
      for (const u of [30,60,90,120,150].map(x=>x*rad)) {
        grid+=path(latitude(u,-Math.PI,Math.PI),muted,1,"",.31);
      }
      for(const v of [-65,-35,0,35,65].map(x=>x*rad)) grid+=path(meridian(v,0,Math.PI),muted,1,"",.31);
    } else {
      for(const r of [.45,.85,1.25,1.65]) grid+=path(latitude(r,0,2*Math.PI),muted,1,"",.46);
      for(let v=0;v<2*Math.PI;v+=Math.PI/6) grid+=path(meridian(v,0,1.65),muted,1,"",.29);
      grid+=circle([cx,cy],2.5,muted);
    }
    return {toScreen,position,radial,angular,project,latitude,meridian,grid,rim};
  }
  function derivative(panel,w,h) {
    const spherical=panel.querySelector("[data-geometry]").value==="sphere";
    const slider=panel.querySelector("[data-location]");
    const phi=Number(panel.querySelector("[data-phi]").value);
    const u=spherical?Number(slider.value)*rad:Number(slider.value)/100;
    const c=spherical?Math.cos(u):1;
    panel.querySelector("[data-coordinate]").textContent=spherical?"北極からの角度 θ":"半径 r（0.20〜1.30）";
    slider.setAttribute("aria-label",spherical?"北極からの角度 θ":"半径 r");
    panel.querySelector("[data-coordinate-value]").textContent=spherical?slider.value+"°":u.toFixed(2);
    panel.querySelector("[data-phi-value]").textContent=phi+"°";
    panel.querySelector(".answer").textContent="φ 方向の共変微分 ＝ "+round(-c)+" "+(spherical?"eθ":"eᵣ");
    const s=surface(spherical,w/2,h/2+5,spherical?Math.min(96,w*.29):Math.min(66,w*.205));
    const v=phi*rad;
    const p=s.position(u,v);
    const a=s.toScreen(p);
    const scale=spherical?.60:.75;
    panel.querySelector("[data-angle-control]").hidden=!spherical;
    const angles=spherical && panel.querySelector("[data-angles]").checked;
    let backdrop=s.grid, guides="", letters="";
    if(angles) {
      const equator=Math.PI/2;
      const north=s.project(0,0), zero=s.project(equator,0), foot=s.project(equator,v);
      const thetaMid=s.project(u/2,v), phiMid=s.project(equator,v/2);
      backdrop=s.rim+path(s.latitude(equator,-Math.PI,Math.PI),muted,1,"",.40)
        +path(s.meridian(0,0,equator),muted,1,"",.44);
      guides=path(s.meridian(v,0,u),ink,1.25,"4 3")
        +path(s.latitude(equator,0,v),ink,1.6)
        +(u<equator?path(s.meridian(v,u,equator),muted,1,"2 4",.70):"")
        +circle(north,2.3,ink)+circle(zero,2,ink)+circle(foot,2,ink);
      const thetaLabel=label(plus(thetaMid,[v<0?-9:9,-2]),"θ",v<0?"end":"start");
      const phiLabel=Math.abs(phi)<8
        ? label(plus(zero,[9,21]),phi===0?"φ = 0°":"φ")
        : label(plus(phiMid,[0,20]),"φ","middle");
      letters='<g class="angle-labels">'+thetaLabel+phiLabel+'</g>';
    }
    return backdrop+path(s.latitude(u,-Math.PI,Math.PI),colorA,1.3,"",angles?.28:.65)+guides
      +arrow(a,s.toScreen(plus(p,s.angular(v),scale)),colorA)
      +arrow(a,s.toScreen(plus(p,s.radial(u,v),-c*scale)),colorB,"4 2")+circle(a,3,ink)+letters;
  }
  function riemann(panel,w,h) {
    const spherical=panel.querySelector("[data-geometry]").value==="sphere";
    const width=Number(panel.querySelector("[data-span]").value);
    const startTheta=Number(panel.querySelector("[data-start-theta]").value);
    const startPhi=Number(panel.querySelector("[data-start-phi]").value);
    const thetaSpan=Number(panel.querySelector("[data-theta-span]").value);
    const dv=width*rad, va=startPhi*rad, vb=va+dv;
    const u0=spherical?startTheta*rad:.62;
    const u1=spherical?u0+thetaSpan*rad:1.22;
    panel.querySelector("[data-start-theta-control]").hidden=!spherical;
    panel.querySelector("[data-theta-span-control]").hidden=!spherical;
    panel.querySelector("[data-theta-span-value]").textContent=thetaSpan+"°";
    panel.querySelector("[data-start-theta-value]").textContent=startTheta+"°";
    panel.querySelector("[data-start-phi-value]").textContent=startPhi+"°";
    const fPrime=(u)=>spherical?Math.cos(u):1;
    const angA=-fPrime(u1)*dv, angB=-fPrime(u0)*dv;
    const delta=angA-angB;
    const area=dv*(spherical?Math.cos(u0)-Math.cos(u1):(u1*u1-u0*u0)/2);
    panel.querySelector("[data-span-value]").textContent=width+"°";
    panel.querySelector(".answer").textContent="角度差（A−B） "+(delta/rad).toFixed(2)+"° ／ 囲んだ面積 "+round(area)+" ／ 角度差（rad）÷ 面積 "+(area===0?"—（面積が 0）":round(delta/area));
    const s=surface(spherical,w*.34,h*.48,spherical?Math.min(89,w*.255):Math.min(60,w*.169));
    const a=s.project(u0,va), b=s.project(u1,vb);
    const legA=[...s.meridian(va,u0,u1),...s.latitude(u1,va,vb)];
    const legB=[...s.latitude(u0,va,vb),...s.meridian(vb,u0,u1)];
    const o=[w*.79,h*.55], length=Math.min(46,w*.13);
    const inPlane=(angle)=>[o[0]+length*Math.sin(angle),o[1]-length*Math.cos(angle)];
    const enclosingPath=[...legA,...legB.slice().reverse()];
    const patch='<polygon points="'+enclosingPath.map(point).join(" ")+'" fill="'+colorA+'" fill-opacity=".14"/>';
    const angleArc=path(sample(t=>plus(o,[Math.sin(angB+t*delta),-Math.cos(angB+t*delta)],length*.57),20),ink,1.3);
    return s.grid+patch+path(legA,colorA,2.6)+path(legB,colorB,2.6,"5 3")
      +arrow(legA[12],legA[17],colorA)+arrow(legB[28],legB[34],colorB)
      +arrow(a,s.toScreen(plus(s.position(u0,va),s.radial(u0,va),.32)),ink)
      +circle(a,3,ink)+circle(b,3,ink)
      +label([a[0]-9,a[1]-9],"P","end")+label([b[0]+8,b[1]+12],"Q")
      +label([o[0],o[1]+39],"Q の接平面","middle")
      +path([[o[0],o[1]+10],[o[0],o[1]-length-5]],muted,1,"3 4",.65)
      +angleArc+arrow(o,inPlane(angB),colorB,"5 3")+arrow(o,inPlane(angA),colorA)
      +(Math.abs(delta)<1e-9?path([o,inPlane(angB)],colorB,1,"4 4"):"")
      +circle(o,3,ink);
  }
  function scalar(panel,w,h) {
    const spherical=panel.querySelector("[data-geometry]").value==="sphere";
    const radius=panel.querySelector("[data-radius]");
    const a=Number(radius.value);
    const selected=Number(panel.querySelector("[data-plane]").value);
    const curved=spherical && selected===0;
    radius.disabled=!spherical;
    panel.querySelector("[data-radius-value]").textContent=spherical?a.toFixed(2):"—";
    panel.querySelector("[data-plane]").options[0].textContent=spherical?"e₁・e₂（球面の二方向）":"e₁・e₂";
    const curvatures=[spherical?1/(a*a):0,0,0];
    curvatures.forEach((k,i)=>{
      panel.querySelector('[data-k="'+i+'"]').textContent=round(k);
    });
    panel.querySelector(".answer:not([data-circle])").textContent="スカラー曲率 ＝ 2 × ("+curvatures.map(round).join(" + ")+") ＝ "+round(2*curvatures[0]);

    // Keep the geodesic distance from the center fixed in each section.
    const geodesicRadius=.55;
    const circleRadius=(distance)=>curved?a*Math.sin(distance/a):distance;
    const height=(distance)=>curved?a*(Math.cos(distance/a)-1):0;
    const circumference=2*Math.PI*circleRadius(geodesicRadius);
    panel.querySelector("[data-circle]").textContent=
      "選んだ断面の曲率 "+round(curvatures[selected])+" ／ 円周の長さ "+round(circumference);
    const scale=Math.min(w*.67,h*.67);
    const center=[w/2,h*.47];
    const project=(distance,angle)=>[
      center[0]+scale*circleRadius(distance)*Math.sin(angle),
      center[1]+scale*(.90*circleRadius(distance)*Math.cos(angle)-.436*height(distance))
    ];
    const ring=(distance)=>sample(t=>project(distance,t*2*Math.PI),80);
    let diagram="";
    if(curved) {
      const reference=sample(t=>[
        center[0]+scale*geodesicRadius*Math.sin(t*2*Math.PI),
        center[1]+scale*.90*geodesicRadius*Math.cos(t*2*Math.PI)
      ],80);
      diagram+=path(reference,muted,1,"4 4",.63);
    }
    const outer=ring(geodesicRadius);
    diagram+='<polygon points="'+outer.map(point).join(" ")+'" fill="'+colorA+'" fill-opacity=".11"/>';
    for(const fraction of [.33,.67]) diagram+=path(ring(geodesicRadius*fraction),muted,1,"",.49);
    for (let i=0;i<8;i++) {
      const angle=i*Math.PI/4;
      diagram+=path(sample(t=>project(t*geodesicRadius,angle),20),muted,1,"",.49);
    }
    diagram+=path(outer,colorA,2.65)+circle(center,3.2,ink);
    if(curved) diagram+=label([center[0],h-9],"破線：同じ半径の平面の円","middle");
    return diagram;
  }

  for(const [name,render] of [["derivative",derivative],["riemann",riemann],["scalar",scalar]]) {
    const panel=root.querySelector("#tc-"+name);
    const svg=panel.querySelector("svg");
    const draw=()=>{
      const {width,height}=svg.getBoundingClientRect();
      if(!width || !height) return;
      svg.setAttribute("viewBox","0 0 "+width+" "+height);
      svg.innerHTML=render(panel,width,height);
    };
    panel.addEventListener("input",draw);
    panel.addEventListener("change",draw);
    new ResizeObserver(draw).observe(svg);
    draw();
  }

  function selectLinkedTab() {
    const tab = Array.from(root.querySelectorAll('[role="tab"]'))
      .find((button) => "#"+button.id === location.hash);
    if (tab) tab.click();
  }
  document.addEventListener("DOMContentLoaded", selectLinkedTab);
  window.addEventListener("hashchange", selectLinkedTab);
})();
