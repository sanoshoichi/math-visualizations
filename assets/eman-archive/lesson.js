(()=>{
function render(root = document) {
  if (!window.katex) return;
  for (const element of root.querySelectorAll("[data-tex]")) {
    if (element.querySelector(".katex")) continue;
    try {
      window.katex.render(element.dataset.tex, element, {
        displayMode: !element.classList.contains("inline-math"),
        throwOnError: true,
        strict: "warn"
      });
    } catch (error) {
      element.classList.add("math-error");
      console.error("Equation", element.dataset.tex, error);
    }
  }
}
window.renderLessonMath=render;
function init(){render();const anchor=location.hash.slice(1);const target=document.getElementById(anchor)||(/^\d+$/.test(anchor)?document.getElementById("title"):null);if(target){(document.fonts?.ready||Promise.resolve()).then(()=>requestAnimationFrame(()=>target.scrollIntoView({block:"start",behavior:"instant"})));}const picker=document.getElementById('chapter-select');if(picker){picker.addEventListener('change',()=>{const el=document.getElementById(picker.value);if(el){location.hash=picker.value;el.scrollIntoView({behavior:'smooth',block:'start'});}});const update=()=>{if([...picker.options].some(o=>o.value===location.hash.slice(1)))picker.value=location.hash.slice(1);};update();window.addEventListener('hashchange',update);}
document.querySelectorAll('[data-tabs]').forEach(host=>{const buttons=[...host.querySelectorAll('[role=tab]')];function activate(b){buttons.forEach(x=>{const active=x===b;x.setAttribute('aria-selected',active);x.tabIndex=active?0:-1;document.getElementById(x.getAttribute('aria-controls')).hidden=!active;});}buttons.forEach((b,i)=>{b.addEventListener('click',()=>activate(b));b.addEventListener('keydown',e=>{let j=i;if(e.key==='ArrowRight')j=(i+1)%buttons.length;else if(e.key==='ArrowLeft')j=(i-1+buttons.length)%buttons.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=buttons.length-1;else return;e.preventDefault();activate(buttons[j]);buttons[j].focus();});});});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
