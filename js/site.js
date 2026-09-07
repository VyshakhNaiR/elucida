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

/* ======================================================================
   Immersive WebGL hero backdrop (Three.js) — bright, airy floating shapes
   ====================================================================== */
(function(){
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.getElementById('webgl');
  if(!canvas || reduced || typeof THREE==='undefined') return;
  var renderer;
  try{ renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:true, alpha:true }); }
  catch(e){ canvas.style.display='none'; return; }
  function size(){ return { w: canvas.clientWidth||innerWidth, h: canvas.clientHeight||Math.round(innerHeight*0.98) }; }
  var s = size();
  renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(s.w, s.h, false);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, s.w/s.h, 0.1, 100); camera.position.z = 20;
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  var key = new THREE.DirectionalLight(0xffffff, 0.6); key.position.set(4,6,8); scene.add(key);
  var COLORS = [0x82a0ff, 0xf0befa, 0xff5a4d, 0xc6f24e, 0xffd23f];
  var geos = [ new THREE.IcosahedronGeometry(1.5,0), new THREE.TorusGeometry(1.2,0.42,10,20), new THREE.DodecahedronGeometry(1.5,0), new THREE.OctahedronGeometry(1.6,0), new THREE.TorusKnotGeometry(0.9,0.32,60,8) ];
  var shapes = [];
  for(var i=0;i<26;i++){
    var col = COLORS[i%COLORS.length];
    var g = geos[i%geos.length];
    var solid = Math.random()<0.5;
    var mat = solid ? new THREE.MeshStandardMaterial({ color:col, roughness:.5, metalness:.1, flatShading:true })
                    : new THREE.MeshBasicMaterial({ color:col, wireframe:true, transparent:true, opacity:.7 });
    var m = new THREE.Mesh(g, mat);
    var sc = 0.5 + Math.random()*1.4; m.scale.setScalar(sc);
    m.position.set((Math.random()-.5)*34, (Math.random()-.5)*22, (Math.random()-.5)*16 - 4);
    m.userData = { rx:(Math.random()-.5)*0.006, ry:(Math.random()-.5)*0.008, fy:0.2+Math.random()*0.5, ph:Math.random()*6.28, baseY:m.position.y };
    scene.add(m); shapes.push(m);
  }
  var mx=0, my=0, tmx=0, tmy=0;
  addEventListener('mousemove', function(e){ tmx=(e.clientX/innerWidth-0.5); tmy=(e.clientY/innerHeight-0.5); });
  addEventListener('resize', function(){ var z=size(); camera.aspect=z.w/z.h; camera.updateProjectionMatrix(); renderer.setSize(z.w,z.h,false); });
  var t=0;
  (function loop(){ requestAnimationFrame(loop); t+=0.016;
    mx += (tmx-mx)*0.04; my += (tmy-my)*0.04;
    camera.position.x = mx*6; camera.position.y = -my*4; camera.lookAt(0,0,0);
    for(var i=0;i<shapes.length;i++){ var m=shapes[i], u=m.userData; m.rotation.x+=u.rx; m.rotation.y+=u.ry; m.position.y = u.baseY + Math.sin(t*u.fy + u.ph)*0.6; }
    renderer.render(scene,camera);
  })();
})();

/* ======================================================================
   Live from GitHub — real public stats, client-side (no key, CORS-ok)
   ====================================================================== */
(function(){
  var el = document.getElementById('gh'); if(!el) return;
  var USER = 'VyshakhNaiR';
  var LANG_COLORS = { Python:'#82a0ff', HTML:'#ff5a4d', JavaScript:'#ffd23f', TypeScript:'#82a0ff', Shell:'#c6f24e', CSS:'#f0befa', Kotlin:'#a855f7', Other:'#5c564a' };
  function esc(n){ return String(n); }
  Promise.all([
    fetch('https://api.github.com/users/'+USER).then(function(r){ return r.ok?r.json():Promise.reject(); }),
    fetch('https://api.github.com/users/'+USER+'/repos?per_page=100&sort=updated').then(function(r){ return r.ok?r.json():Promise.reject(); })
  ]).then(function(res){
    var u=res[0], repos=res[1].filter(function(r){ return !r.fork; });
    var stars = repos.reduce(function(a,r){ return a+(r.stargazers_count||0); },0);
    var year = new Date(u.created_at).getFullYear();
    var langs={}; repos.forEach(function(r){ if(r.language){ langs[r.language]=(langs[r.language]||0)+1; } });
    var total = Object.values(langs).reduce(function(a,b){ return a+b; },0)||1;
    var entries = Object.entries(langs).sort(function(a,b){ return b[1]-a[1]; });
    var bar = entries.map(function(e){ var c=LANG_COLORS[e[0]]||LANG_COLORS.Other; return '<i style="width:'+(e[1]/total*100)+'%;background:'+c+'"></i>'; }).join('');
    var key = entries.map(function(e){ var c=LANG_COLORS[e[0]]||LANG_COLORS.Other; return '<span><i style="background:'+c+'"></i>'+e[0]+'</span>'; }).join('');
    el.innerHTML =
      '<div class="gh__cell"><div class="gh__n">'+esc(u.public_repos)+'</div><div class="gh__l gh__live">public repos</div></div>'+
      '<div class="gh__cell"><div class="gh__n">'+esc(stars)+'</div><div class="gh__l">stars earned</div></div>'+
      '<div class="gh__cell"><div class="gh__n">'+esc(u.followers)+'</div><div class="gh__l">followers</div></div>'+
      '<div class="gh__cell"><div class="gh__n">’'+String(year).slice(2)+'</div><div class="gh__l">on github since</div></div>'+
      '<div class="gh__langs"><div class="gh__bar">'+bar+'</div><div class="gh__key">'+key+'<span style="margin-left:auto;color:var(--coral)">@'+USER+' ↗</span></div></div>';
    el.parentElement.querySelector('.gh__load') && (function(){})();
  }).catch(function(){
    el.innerHTML = '<div class="gh__load">Live GitHub stats are rate-limited right now &mdash; find me at <a href="https://github.com/'+USER+'" target="_blank" rel="noopener" style="color:var(--coral)">github.com/'+USER+'</a>.</div>';
  });
})();
