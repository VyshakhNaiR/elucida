/* ======================================================================
   Elucida — shared site JS: reveals, lazy video, page transitions,
   and the draggable-card hero (home only).
   ====================================================================== */
(function(){
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Reveal on scroll ---------- */
  var io = new IntersectionObserver(function(es){
    es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold:.12, rootMargin:'0px 0px -6% 0px' });
  document.querySelectorAll('.rv').forEach(function(el){ io.observe(el); });

  /* ---------- Lazy + hover-play videos ---------- */
  var vio = new IntersectionObserver(function(es){
    es.forEach(function(en){ var v=en.target; if(en.isIntersecting){ if(!v.dataset.l){ v.dataset.l=1; v.load(); } v.play().catch(function(){}); } else v.pause(); });
  }, { threshold:.25 });
  document.querySelectorAll('video[data-lazy]').forEach(function(v){ v.muted=true; vio.observe(v); });
  document.querySelectorAll('video[data-hoverplay]').forEach(function(v){ v.muted=true; var p=v.closest('figure')||v;
    p.addEventListener('pointerenter',function(){ v.play().catch(function(){}); });
    p.addEventListener('pointerleave',function(){ v.pause(); }); });

  /* ---------- Page-transition veil (Barba-lite over real navigation) ---------- */
  (function(){
    if(reduced) return;
    var veil = document.querySelector('.veil');
    if(!veil) return;
    // reveal-out on load
    requestAnimationFrame(function(){ veil.classList.add('out'); setTimeout(function(){ veil.className='veil'; }, 520); });
    function isInternal(a){
      var href = a.getAttribute('href') || '';
      if(!href || href[0]==='#' || a.target==='_blank' || href.indexOf('mailto:')===0 || href.indexOf('http')===0) return false;
      return true;
    }
    document.addEventListener('click', function(e){
      var a = e.target.closest('a'); if(!a || !isInternal(a)) return;
      e.preventDefault(); var href = a.getAttribute('href');
      veil.className='veil'; void veil.offsetWidth; veil.classList.add('in');
      setTimeout(function(){ window.location.href = href; }, 500);
    });
    window.addEventListener('pageshow', function(ev){ if(ev.persisted){ veil.className='veil'; } });
  })();

  /* ---------- Draggable-card hero (home only) ---------- */
  var stage = document.getElementById('stage');
  if(stage && typeof Matter!=='undefined' && !reduced){
    var Engine=Matter.Engine,World=Matter.World,Bodies=Matter.Bodies,Body=Matter.Body,Mouse=Matter.Mouse,MouseConstraint=Matter.MouseConstraint,Composite=Matter.Composite,Events=Matter.Events;
    var engine=Engine.create(); engine.gravity.y=0; engine.gravity.x=0; var world=engine.world;
    var W=stage.clientWidth||innerWidth, H=stage.clientHeight||innerHeight, items=[];
    var PROJECTS = window.ELUCIDA_PROJECTS || [];
    function wall(x,y,w,h){ return Bodies.rectangle(x,y,w,h,{isStatic:true}); }
    var walls=[];
    function rebuild(){ W=stage.clientWidth; H=stage.clientHeight; Composite.remove(world,walls); var t=160;
      walls=[wall(W/2,-t/2,W+300,t),wall(W/2,H+t/2,W+300,t),wall(-t/2,H/2,t,H+300),wall(W+t/2,H/2,t,H+300)]; World.add(world,walls); }
    rebuild();
    function makeEl(html,cls){ var d=document.createElement('div'); d.className='obj'; d.innerHTML='<div class="'+cls+'">'+html+'</div>'; stage.appendChild(d); return d; }
    function addBody(el,x,y,extra){ var r=el.firstChild.getBoundingClientRect(); var w=r.width,h=r.height;
      var b=Bodies.rectangle(x,y,w,h,Object.assign({restitution:.7,frictionAir:.03,friction:.05,chamfer:{radius:14}},extra||{}));
      Body.setVelocity(b,{x:(Math.random()-.5)*.4,y:(Math.random()-.5)*.4}); Body.setAngularVelocity(b,(Math.random()-.5)*.012);
      World.add(world,b); items.push({b:b,el:el,w:w,h:h}); el.style.width=w+'px'; el.style.height=h+'px'; return b; }
    PROJECTS.forEach(function(p,i){
      var media = p.thumb ? '<img src="'+p.thumb+'" alt="">' : '<span class="pcard__mono">'+p.name+'</span>';
      var html='<div class="pcard__media" style="background:'+p.c+'">'+media+'<span class="pcard__tag">'+p.tag+'</span></div><div class="pcard__b"><div class="pcard__n">'+p.name+'</div><div class="pcard__t">'+p.k+'</div></div>';
      var el=makeEl(html,'pcard'); el.firstChild.style.setProperty('--cc',p.c);
      var x=W*(0.10+0.11*i)+(Math.random()-.5)*24, y=H*(0.09+(i%3)*0.075)+(Math.random()-.5)*20;
      var b=addBody(el,x,y); b.plugin={href:p.href}; });
    [['ELUCIDA','#82a0ff'],['into the light','#f0befa'],['70+ assessments','#c6f24e'],['still paranoid','#ffd23f'],['runs on Monster','#ff5a4d']].forEach(function(s){
      var el=makeEl(s[0],'sbadge'); el.firstChild.style.background=s[1]; if(s[1]==='#ff5a4d') el.firstChild.style.color='#fff';
      addBody(el, W*(0.15+Math.random()*.7), H*(0.09+Math.random()*.22),{frictionAir:.05}); });
    var mouse=Mouse.create(stage); mouse.pixelRatio=1;
    var mc=MouseConstraint.create(engine,{mouse:mouse,constraint:{stiffness:.16,render:{visible:false}}}); World.add(world,mc);
    var downPos=null,downBody=null,moved=false;
    Events.on(mc,'mousedown',function(){ downBody=mc.body; downPos=Object.assign({},mouse.position); moved=false; });
    Events.on(mc,'mousemove',function(){ if(downPos&&(Math.abs(mouse.position.x-downPos.x)>6||Math.abs(mouse.position.y-downPos.y)>6)) moved=true; });
    Events.on(mc,'mouseup',function(){ if(downBody && !moved && downBody.plugin && downBody.plugin.href){ var veil=document.querySelector('.veil'); if(veil){ veil.className='veil'; void veil.offsetWidth; veil.classList.add('in'); var h=downBody.plugin.href; setTimeout(function(){ window.location.href=h; },500); } else window.location.href=downBody.plugin.href; } downBody=null; downPos=null; });
    var last=performance.now();
    (function frame(now){ requestAnimationFrame(frame); var dt=Math.min(now-last,32); last=now; Engine.update(engine,dt);
      for(var k=0;k<items.length;k++){ var it=items[k],pp=it.b.position,ang=it.b.angle; it.el.style.transform='translate('+(pp.x-it.w/2)+'px,'+(pp.y-it.h/2)+'px) rotate('+ang+'rad)'; } })(last);
    addEventListener('resize',rebuild);
  }
})();
