(()=>{'use strict';
const Q=new URLSearchParams(location.search),DEBUG=Q.has('debug'),$=id=>document.getElementById(id);
const MPH=.8,G=32.2,RR=22,WH=14,CR=9,OV=22*Math.PI/180,DT=1/120,H0=.75,TAU=Math.PI*2;
const touch=matchMedia('(pointer:coarse)').matches||'ontouchstart' in window,mobile=touch||innerWidth<700;
const wrap=a=>{a%=TAU;if(a>Math.PI)a-=TAU;if(a<-Math.PI)a+=TAU;return a};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let best=0,muted=false;
try{best=+localStorage.getItem('rl_best')||0;muted=localStorage.getItem('rl_mute')==='1'}catch(e){}
let renderer;
try{if(typeof THREE==='undefined')throw 0;renderer=new THREE.WebGLRenderer({antialias:!mobile});if(!renderer.getContext())throw 0}catch(e){$('nogl').hidden=false;$('title').hidden=true;return}
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const host=$('game');host.insertBefore(renderer.domElement,host.firstChild);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x03050b);scene.fog=new THREE.FogExp2(0x05080f,.0055);
const camera=new THREE.PerspectiveCamera(50,1,.5,1200);

// ---------- ramp path (arc-length parametrised) ----------
const La=RR*Math.PI/2,Lc=CR*OV,L=La+WH+Lc;
function pathAt(s){
 if(s<La){const t=s/RR;return{x:RR*Math.sin(t),y:RR-RR*Math.cos(t),a:t}}
 if(s<La+WH)return{x:RR,y:RR+(s-La),a:Math.PI/2};
 const p=(s-La-WH)/CR;return{x:RR-CR+CR*Math.cos(p),y:RR+WH+CR*Math.sin(p),a:Math.PI/2+p}}
const onPath=(s)=>{const p=pathAt(s);return{x:p.x-Math.sin(p.a)*H0,y:p.y+Math.cos(p.a)*H0,a:p.a}};

// ---------- scene ----------
const V=(x,y)=>new THREE.Vector2(x,y);
const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.4,metalness:.2},o));
const B=c=>new THREE.MeshBasicMaterial({color:c});
function glowTex(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)}
const GT=glowTex();
const sprite=(col,sc,x,y,z,par)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GT,color:col,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));s.scale.set(sc,sc,1);s.position.set(x,y,z);(par||scene).add(s);return s};
// sky
{const n=1400,p=new Float32Array(n*3);for(let i=0;i<n;i++){const u=Math.random()*TAU,v=Math.acos(Math.random()*.9+.1),r=700;p[i*3]=r*Math.sin(v)*Math.cos(u);p[i*3+1]=r*Math.cos(v);p[i*3+2]=-Math.abs(r*Math.sin(v)*Math.sin(u))-50}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.6,color:0xcfd9ff,fog:false,sizeAttenuation:false})));
 sprite(0xaac4ff,260,-150,230,-600);sprite(0xeef4ff,50,-150,230,-598)}
scene.add(new THREE.HemisphereLight(0x5a6c9a,0x10131a,.55));
const moon=new THREE.DirectionalLight(0x8fa8e0,.5);moon.position.set(-60,90,40);scene.add(moon);
// road
{const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.fillStyle='#14171d';x.fillRect(0,0,256,64);x.fillStyle='#d8dde6';x.fillRect(20,30,110,4);x.fillStyle='#ff2d2d';x.fillRect(0,0,256,3);x.fillRect(0,61,256,3);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(70,1);t.anisotropy=4;
 const r=new THREE.Mesh(new THREE.PlaneGeometry(900,18),M(0xffffff,{map:t,roughness:.55}));r.rotation.x=-Math.PI/2;r.position.set(-420,0,0);scene.add(r);
 const gr=new THREE.Mesh(new THREE.PlaneGeometry(1400,400),M(0x0a0d12,{roughness:1}));gr.rotation.x=-Math.PI/2;gr.position.set(-380,-.05,0);scene.add(gr)}
// ramp
{const top=[],bot=[];for(let s=0;s<=L;s+=.4){const p=pathAt(s);top.push(V(p.x,p.y));bot.push(V(p.x+Math.sin(p.a)*1.4,p.y-Math.cos(p.a)*1.4))}
 const e=pathAt(L);top.push(V(e.x,e.y));bot.push(V(e.x+Math.sin(e.a)*1.4,e.y-Math.cos(e.a)*1.4));
 const sh=new THREE.Shape(top.concat(bot.reverse()));const gm=new THREE.ExtrudeGeometry(sh,{depth:16,bevelEnabled:false});gm.translate(0,0,-8);
 scene.add(new THREE.Mesh(gm,M(0x2a303a,{metalness:.5,roughness:.45,side:THREE.DoubleSide})));
 const lip=new THREE.Mesh(new THREE.BoxGeometry(.5,.35,16.2),B(0xff2d2d));lip.position.set(e.x,e.y,0);lip.rotation.z=e.a;scene.add(lip);
 const base=new THREE.Mesh(new THREE.BoxGeometry(.3,.15,16.2),B(0xff2d2d));base.position.set(0,.08,0);scene.add(base);
 // back wall blocker
 const back=new THREE.Mesh(new THREE.BoxGeometry(1,40,18),M(0x15181e));back.position.set(RR+1.9,18,0);scene.add(back);
 for(const z of[-24,24]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,34,8),M(0x20252d));pole.position.set(-14,17,z);scene.add(pole);
  const sp=new THREE.SpotLight(0xdfe8ff,2.4,160,.55,.5,1);sp.position.set(-14,34,z);sp.target.position.set(12,16,0);scene.add(sp,sp.target);sprite(0xffffff,10,-14,34,z)}}
// crowd
{const n=mobile?4000:9000,p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++){const side=Math.random()<.5?-1:1;p[i*3]=-70+Math.random()*100;p[i*3+1]=.6+Math.random()*(3+Math.random()*4);p[i*3+2]=side*(13+Math.random()*30);
  const w=Math.random()<.35,k=.5+Math.random()*.5;c[i*3]=w?k:k*.9;c[i*3+1]=w?k*.8:k*.7;c[i*3+2]=w?k*.5:k*.5}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
 scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:.45,vertexColors:true})));
 for(const z of[-12,12]){const f=new THREE.Mesh(new THREE.BoxGeometry(110,1,.3),M(0x1b2027));f.position.set(-20,.5,z);scene.add(f)}}

// ---------- car ----------
const car=new THREE.Group();scene.add(car);
const ext=(pts,w,mat)=>{const ge=new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(p=>V(p[0],p[1]))),{depth:w,bevelEnabled:false});ge.translate(0,0,-w/2);return new THREE.Mesh(ge,mat)};
const bx=(x,y,z,w,h,d,mat,par)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);(par||car).add(m);return m};
const paint=M(0xf1f3f6,{metalness:.35,roughness:.22}),graph=M(0x2a2d33,{roughness:.5}),glass=M(0x0a0f18,{metalness:.9,roughness:.1});
car.add(ext([[-2.3,-.55],[2.2,-.55],[2.38,-.3],[2.25,-.05],[.9,.12],[.05,.52],[-1,.5],[-1.9,.15],[-2.3,.12]],1.9,paint));
{const c=ext([[.85,.14],[.1,.5],[-.95,.48],[-1.55,.2],[.85,.14]],1.62,glass);c.position.y=.01;car.add(c)}
for(const z of[-.96,.96]){bx(0,-.5,z,3.6,.12,.1,graph);bx(1.3,-.15,z*1.01,.9,.07,.04,graph);bx(-1.3,.02,z*1.01,.8,.06,.04,M(0xc9ced6));bx(.7,-.25,z*1.01,.5,.14,.04,graph)}
bx(-2.38,.2,0,.5,.07,1.9,graph).rotation.z=.2;
for(let i=-2;i<=2;i++)bx(-2.2,-.5,i*.36,.5,.22,.04,graph);
bx(-2.4,-.38,0,.2,.1,1.7,graph);
for(const z of[-.62,.62]){bx(2.3,-.12,z,.14,.07,.5,B(0xeaf4ff));sprite(0xbcd8ff,1.4,2.45,-.1,z,car);
 bx(-2.31,.02,z*1.2,.05,.07,.45,B(0xff1a1a));bx(-2.31,-.14,z*1.45,.05,.3,.07,B(0xff1a1a))}
const wheels=[];const tire=M(0x0b0b0d,{roughness:.8}),rim=M(0xb7bcc6,{metalness:.8,roughness:.25});
for(const x of[1.45,-1.45])for(const z of[-.98,.98]){const g=new THREE.Group();g.position.set(x,-.37,z);
 const t=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.3,20),tire);t.rotation.x=Math.PI/2;g.add(t);
 for(let i=0;i<5;i++){const b=bx(0,0,z>0?.16:-.16,.5,.07,.03,rim,g);b.position.x=Math.cos(i*TAU/5)*.14;b.position.y=Math.sin(i*TAU/5)*.14;b.rotation.z=i*TAU/5}
 car.add(g);wheels.push(g)}
const plumes=[];const plMat=new THREE.MeshBasicMaterial({color:0x58a8ff,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false});
for(const x of[1.3,-1.3])for(const z of[-.6,.6]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.05,10),graph);p.position.set(x,-.56,z);car.add(p);
 const c=new THREE.Mesh(new THREE.ConeGeometry(.16,1.8,12),plMat);c.rotation.z=Math.PI;c.position.set(x,-1.45,z);c.visible=false;car.add(c);plumes.push(c)}
const carLight=new THREE.PointLight(0x9bbcff,.8,24);carLight.position.set(0,2.5,3);car.add(carLight);
const blob=new THREE.Mesh(new THREE.PlaneGeometry(5.6,3),new THREE.MeshBasicMaterial({map:GT,color:0x000000,transparent:true,opacity:.8,depthWrite:false}));blob.rotation.x=-Math.PI/2;blob.position.y=.03;scene.add(blob);
// rings
const rings=[];for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.TorusGeometry(3.4,.2,8,32),B(0x3ee6ff));m.visible=false;scene.add(m);rings.push({m,got:false})}
// fx
const debris=[];for(let i=0;i<14;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.3+Math.random()*.6,.15,.3+Math.random()*.4),i%3?paint:graph);m.visible=false;scene.add(m);debris.push({m,v:new THREE.Vector3(),w:new THREE.Vector3()})}
const FN=120,fxP=new Float32Array(FN*3),fxV=new Float32Array(FN*3);const fxG=new THREE.BufferGeometry();fxG.setAttribute('position',new THREE.BufferAttribute(fxP,3));
const fx=new THREE.Points(fxG,new THREE.PointsMaterial({size:1.6,color:0xff8a2a,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));fx.visible=false;fx.frustumCulled=false;scene.add(fx);
let fxT=0;

// ---------- audio ----------
let AC,master,eng,engG,hissG;
function initAudio(){if(AC)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=muted?0:.5;master.connect(AC.destination);
 eng=AC.createOscillator();eng.type='sawtooth';const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=1200;engG=AC.createGain();engG.gain.value=0;eng.connect(f);f.connect(engG);engG.connect(master);eng.start();
 const buf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 const n=AC.createBufferSource();n.buffer=buf;n.loop=true;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=3200;hissG=AC.createGain();hissG.gain.value=0;n.connect(bp);bp.connect(hissG);hissG.connect(master);n.start()}catch(e){AC=null}}
function tone(f,d,type,vol,slide){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.value=f;if(slide)o.frequency.exponentialRampToValueAtTime(slide,AC.currentTime+d);
 g.gain.setValueAtTime(vol||.3,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.connect(g);g.connect(master);o.start();o.stop(AC.currentTime+d)}
const sBeep=hi=>tone(hi?1100:660,hi?.35:.14,'square',.15),sChime=()=>{tone(1320,.4,'sine',.25);setTimeout(()=>tone(1760,.5,'sine',.2),80)},
 sBoom=()=>{tone(90,.9,'sawtooth',.5,25);tone(200,.5,'square',.2,30)},sThud=()=>tone(70,.3,'sine',.5,30);
function setMute(m){muted=m;try{localStorage.setItem('rl_mute',m?'1':'0')}catch(e){}if(master)master.gain.value=m?0:.5;$('mute').classList.toggle('off',m)}
$('mute').onclick=e=>{e.stopPropagation();setMute(!muted)};setMute(muted);

// ---------- game state ----------
const keys={left:false,right:false,thrust:false};
const g={state:'title',x:-90,y:H0,a:0,vx:0,vy:0,w:0,v:0,acc:0,s:0,run:0,lock:0,t:0,lit:0,greenAt:0,green:false,greenT:0,after:0,shake:0,wheelA:0};
function resetRun(){Object.assign(g,{x:-90,y:H0,a:0,vx:0,vy:0,w:0,v:0,s:0,score:0,rings:0,flips:0,gas:1,peakG:1,maxAlt:0,air:0,inv:false,sink:0,reaction:0,rampMph:0,tdSpeed:0,crashed:false,soft:0,gNow:1,thrusting:false,t:0,lit:0,green:false,lock:0});
 car.visible=true;fx.visible=false;debris.forEach(d=>d.m.visible=false);rings.forEach(r=>{r.m.visible=false;r.got=false});$('msg').textContent='';
 const L=$('lights').children;for(const l of L)l.className=''}
resetRun();
let adActive=false,runs=0;
const hud={score:$('score'),best:$('best'),speed:$('speed'),flips:$('flips'),rings:$('rings'),gval:$('gval'),alt:$('alt'),sink:$('sink')},cache={};
const setT=(k,v)=>{if(cache[k]!==v){cache[k]=v;hud[k].textContent=v}};
const setW=(id,k,v)=>{if(cache[id]!==v){cache[id]=v;$(id).style[k]=v}};
function callout(t){const c=$('callout');c.textContent=t;c.classList.remove('on');void c.offsetWidth;c.classList.add('on')}
const setState=s=>{g.state=s;$('hud').hidden=!(s!=='title'&&s!=='results');$('title').hidden=s!=='title';$('results').hidden=s!=='results';$('lights').hidden=s!=='count'&&s!=='drive'};

function startRun(){resetRun();setState('count');g.run=++runs}
function begin(){initAudio();if(AC&&AC.state==='suspended')AC.resume();
 const n=runs+1;if(n%3===0)showAd(startRun);else startRun()}
function action(){if(adActive||g.lock>0)return;const s=g.state;
 if(s==='title'||s==='results')begin();
 else if(s==='count'){if(g.green)launch(g.t-g.greenT);else{g.lock=.4;$('msg').textContent='Too early, wait for green';sBeep(false);tone(180,.3,'sawtooth',.2);setTimeout(()=>{if(g.state==='count')$('msg').textContent=''},900)}}}
function launch(r){g.reaction=r;const mph=clamp(90-5*r,76,90);g.rampMph=mph;g.v0=mph*MPH;g.acc=g.v0*g.v0/(2*-g.x);g.v=0;setState('drive');callout('Launch');
 // place rings along the (unthrusted) ballistic arc
 const e=onPath(L),ve=Math.sqrt(Math.max(1,g.v0*g.v0-2*G*e.y)),vx=ve*Math.cos(e.a),vy=ve*Math.sin(e.a),T=(vy+Math.sqrt(vy*vy+2*G*(e.y-H0)))/G;
 [.16,.3,.46,.64,.82].forEach((f,i)=>{const t=T*f;rings[i].m.position.set(e.x+vx*t,e.y+vy*t-.5*G*t*t+(i%2?2:-1),0);rings[i].m.visible=true})}

// ---------- ads ----------
function showAd(done){let fin=false,shown=false,t1,t2;adActive=true;if(AC)AC.suspend();
 const end=()=>{if(fin)return;fin=true;clearTimeout(t1);clearTimeout(t2);adActive=false;if(AC&&AC.state==='suspended')AC.resume();last=performance.now();done()};
 t1=setTimeout(()=>{if(!shown)end()},2500);
 try{if(typeof adBreak!=='function'||window.__adsBlocked)throw 0;
  adBreak({type:'next',name:'run-'+(runs+1),beforeAd:()=>{shown=true;clearTimeout(t1);t2=setTimeout(end,120000)},afterAd:end,adBreakDone:end})}catch(e){end()}}

// ---------- simulation ----------
function crash(why){if(g.state==='crashed')return;g.crashed=true;setState('crashed');g.after=0;g.shake=1;car.visible=false;sBoom();callout(why||'Crash');
 for(let i=0;i<FN;i++){fxP[i*3]=g.x;fxP[i*3+1]=g.y;fxP[i*3+2]=0;const a=Math.random()*TAU,s=4+Math.random()*16;fxV[i*3]=Math.cos(a)*s;fxV[i*3+1]=Math.abs(Math.sin(a))*s+3;fxV[i*3+2]=(Math.random()-.5)*10}
 fx.visible=true;fxT=1;debris.forEach(d=>{d.m.visible=true;d.m.position.set(g.x,g.y,0);d.v.set((Math.random()-.5)*22+g.vx*.3,Math.random()*18+4,(Math.random()-.5)*10);d.w.set(Math.random()*8,Math.random()*8,Math.random()*8)})}
function step(){const st=g.state;if(g.lock>0)g.lock-=DT;
 if(st==='count'){g.t+=DT;const n=Math.min(4,Math.floor(g.t/.7)),Ls=$('lights').children;
  while(g.lit<n){Ls[g.lit].className='r';g.lit++;sBeep(false);if(g.lit===4)g.greenAt=g.t+.5+Math.random()*1.2}
  if(g.lit===4&&!g.green&&g.t>=g.greenAt){g.green=true;g.greenT=g.t;Ls[3].className='g';sBeep(true)}
  if(g.green&&g.t-g.greenT>3)launch(3)}
 else if(st==='drive'){g.v=Math.min(g.v0,g.v+g.acc*DT);g.x+=g.v*DT;g.wheelA+=g.v*DT/.38;if(g.x>=0){g.x=0;g.s=0;setState('ramp')}}
 else if(st==='ramp'){const p=pathAt(g.s);g.v-=G*Math.sin(p.a)*DT;g.s+=g.v*DT;g.wheelA+=g.v*DT/.38;
  g.gNow=g.s<La?1+g.v*g.v/(RR*G):1+g.v*g.v/(CR*G)*(g.s>La+WH?1:0);g.peakG=Math.max(g.peakG,g.gNow);
  if(g.v<3){crash('Stalled');return}
  if(g.s>=L){const e=pathAt(L),pe=onPath(L);g.x=pe.x;g.y=pe.y;g.a=e.a;g.vx=g.v*Math.cos(e.a);g.vy=g.v*Math.sin(e.a);g.w=.6;g.inv=false;setState('air');g.gNow=0;return}
  const q=onPath(g.s);g.x=q.x;g.y=q.y;g.a=q.a}
 else if(st==='air'){g.air+=DT;const tq=(keys.left?1:0)-(keys.right?1:0);g.w+=tq*8*DT;g.w*=1-1.2*DT;g.w=clamp(g.w,-7,7);g.a+=g.w*DT;
  g.thrusting=keys.thrust&&g.gas>0;let ax=0,ay=-G;if(g.thrusting){ax=-Math.sin(g.a)*26;ay+=Math.cos(g.a)*26;g.gas=Math.max(0,g.gas-.28*DT)}
  g.gNow=g.thrusting?26/G:0;g.peakG=Math.max(g.peakG,Math.max(1,g.gNow));
  g.vx+=ax*DT;g.vy+=ay*DT;g.x+=g.vx*DT;g.y+=g.vy*DT;g.maxAlt=Math.max(g.maxAlt,g.y-H0);
  const c=Math.cos(g.a);if(!g.inv&&c<-.7){g.inv=true;g.flips++;callout('Flip x'+g.flips);tone(520,.25,'triangle',.2,900)}else if(g.inv&&c>-.4)g.inv=false;
  for(const r of rings)if(!r.got&&r.m.visible&&Math.hypot(r.m.position.x-g.x,r.m.position.y-g.y)<4.6){r.got=true;r.m.visible=false;g.rings++;g.gas=Math.min(1,g.gas+.35);callout('Ring');sChime()}
  if(g.y<=H0&&g.vy<0)land()}
 else if(st==='landed'){g.after+=DT;g.vx*=1-1.8*DT;g.x+=g.vx*DT;g.wheelA+=g.vx*DT/.38;if(g.after>1.5)finish()}
 else if(st==='crashed'){g.after+=DT;g.shake*=1-2.5*DT;if(g.after>1.7)finish()}}
function land(){const sink=-g.vy,tilt=Math.abs(wrap(g.a))*180/Math.PI;g.sink=sink;g.tdSpeed=sink;g.y=H0;g.peakG=Math.max(g.peakG,1+sink/12);
 if(sink<=39&&tilt<=28&&g.x<-1){g.state='landed';setState('landed');g.soft=Math.round(1000*(1-sink/39));g.a=0;g.vy=0;g.w=0;g.after=0;sThud();callout('Stuck it')}
 else crash(g.x>=-1?'Hit the ramp':(tilt>28?'Bad angle':'Too hard'))}
function score(){return g.rings*500+g.flips*1500+Math.round(g.maxAlt*10)+Math.round(g.air*100)+(g.crashed?0:g.soft)}
function finish(){const sc=score();g.score=sc;const nb=sc>best;if(nb){best=sc;try{localStorage.setItem('rl_best',best)}catch(e){}}
 const gr=g.crashed?'F':sc>=9000?'S':sc>=6500?'A':sc>=4500?'B':sc>=2500?'C':'D';
 $('grade').textContent=gr;$('newbest').hidden=!nb;$('rscore').textContent=sc.toLocaleString();
 const f=(id,t)=>$(id).textContent=t;f('r_react',g.reaction.toFixed(3)+' s');f('r_speed',g.rampMph.toFixed(1)+' mph');f('r_g',g.peakG.toFixed(1)+' G');f('r_alt',Math.round(g.maxAlt)+' ft');
 f('r_air',g.air.toFixed(1)+' s');f('r_flips',g.flips);f('r_rings',g.rings+' / 5');f('r_td',g.tdSpeed.toFixed(1)+' ft/s'+(g.crashed?' (crash)':''));setState('results');Object.keys(cache).forEach(k=>delete cache[k])}

// ---------- camera ----------
const cp=new THREE.Vector3(-110,5,14),cl=new THREE.Vector3(-90,1,0),tp=new THREE.Vector3(),tl=new THREE.Vector3(),pj=new THREE.Vector3();let cb=0;
function updateCam(dt){const air=g.state==='air'||g.state==='landed'||g.state==='crashed',tgt=air?1:g.state==='ramp'?.6:0;cb+=(tgt-cb)*Math.min(1,dt*2.5);
 const port=camera.aspect<1,m=port?1.25:1;
 const chx=g.x-16*m,chy=g.y+4.5,chz=13*m,sx=g.x,sy=g.y+3,sz=Math.max(46,Math.abs(g.y)*.6+34)*m;
 tp.set(chx+(sx-chx)*cb,chy+(sy-chy)*cb,chz+(sz-chz)*cb);tl.set(g.x+6*(1-cb),g.y+1+cb*1.5,0);
 const k=Math.min(1,dt*(air?4:8));cp.lerp(tp,k);cl.lerp(tl,Math.min(1,dt*6));
 camera.position.copy(cp);if(g.shake>.01){camera.position.x+=(Math.random()-.5)*g.shake*2;camera.position.y+=(Math.random()-.5)*g.shake*2}
 camera.lookAt(cl);camera.updateMatrixWorld();
 for(let i=0;i<4;i++){pj.set(g.x,g.y,0).project(camera);const ex=Math.max(0,Math.abs(pj.x)-.7),ey=Math.max(0,Math.abs(pj.y)-.7);if(!ex&&!ey)break;
  camera.position.z+=(ex+ey)*camera.position.z*.4+.5;camera.position.y+=(g.y-camera.position.y)*.1;camera.lookAt(cl);camera.updateMatrixWorld()}}

// ---------- render ----------
let last=performance.now(),acc=0;
function render(dt){
 car.position.set(g.x,g.y,0);car.rotation.z=g.a;car.rotation.y=0;
 const spin=g.state==='air'?(g.wheelA+=dt*18):g.wheelA;for(const w of wheels)w.rotation.z=-spin;
 const th=g.thrusting&&g.state==='air';for(const p of plumes){p.visible=th;if(th){p.scale.set(1,.7+Math.random()*.6,1)}}
 blob.visible=g.y<60&&g.x<RR&&g.state!=='crashed';const h=Math.max(0,g.y-H0);blob.position.x=g.x;blob.scale.set(1/(1+h*.04),1/(1+h*.04),1);blob.material.opacity=.8/(1+h*.08);
 rings.forEach(r=>{if(r.m.visible)r.m.rotation.y+=dt*1.5});
 if(fx.visible){fxT-=dt*.7;for(let i=0;i<FN;i++){fxV[i*3+1]-=G*dt*.6;for(let j=0;j<3;j++)fxP[i*3+j]+=fxV[i*3+j]*dt}fxG.attributes.position.needsUpdate=true;fx.material.opacity=Math.max(0,fxT);if(fxT<=0)fx.visible=false}
 for(const d of debris)if(d.m.visible){d.v.y-=G*dt;d.m.position.addScaledVector(d.v,dt);d.m.rotation.x+=d.w.x*dt;d.m.rotation.z+=d.w.z*dt;if(d.m.position.y<.1){d.m.position.y=.1;d.v.multiplyScalar(.4);d.v.y=Math.abs(d.v.y)*.3}}
 if(AC&&engG){const sp=g.state==='air'?Math.hypot(g.vx,g.vy):g.v,on=g.state==='drive'||g.state==='ramp'||g.state==='count';eng.frequency.value=70+sp*7;engG.gain.value=on&&!muted?.12:g.state==='air'?.02:0;hissG.gain.value=th?.25:0}
 if(g.state!=='title'&&g.state!=='results'){
  const mph=Math.round((g.state==='air'||g.state==='landed'||g.state==='crashed'?Math.hypot(g.vx,g.vy):g.v)/MPH);
  setT('score',score().toLocaleString());setT('best',best.toLocaleString());setT('speed',mph);setT('flips',g.flips);setT('rings',g.rings);
  setW('gas','width',Math.round(g.gas*100)+'%');setT('gval',g.gNow.toFixed(1));setW('gfill','height',Math.round(clamp(g.gNow/6,0,1)*100)+'%');
  const alt=Math.max(0,g.y-H0);setT('alt',Math.round(alt));setW('afill','height',Math.round(clamp(alt/100,0,1)*100)+'%');setT('sink',Math.round(Math.max(0,-g.vy))+' ft/s')}
 updateCam(dt);renderer.render(scene,camera)}
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.25,Math.max(0,(t-last)/1000));last=t;
 if(!adActive){acc+=dt;while(acc>=DT){step();acc-=DT}}render(dt)}

// ---------- input ----------
function resize(){const w=innerWidth,h=innerHeight;renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.5:2));renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<1?62:50;camera.updateProjectionMatrix()}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));resize();
addEventListener('keydown',e=>{if(adActive)return;const k=e.code;
 if(k==='ArrowLeft'){keys.left=true;e.preventDefault()}else if(k==='ArrowRight'){keys.right=true;e.preventDefault()}
 else if(k==='Space'){e.preventDefault();keys.thrust=true;if(!e.repeat)action()}else if(k==='Enter'&&!e.repeat)action();else if(k==='KeyM'&&!e.repeat)setMute(!muted)});
addEventListener('keyup',e=>{const k=e.code;if(k==='ArrowLeft')keys.left=false;else if(k==='ArrowRight')keys.right=false;else if(k==='Space')keys.thrust=false});
addEventListener('blur',()=>{keys.left=keys.right=keys.thrust=false});
$('start').onclick=action;$('again').onclick=action;
renderer.domElement.addEventListener('pointerdown',e=>{if(!touch||e.pointerType==='mouse')return;action()});
if(touch){$('touch').hidden=false;$('hint').textContent='Tap to launch on green. Use the buttons to rotate and thrust.';
 const held=new Set(),map={bl:'left',br:'right',bt:'thrust'};
 const sync=()=>{const v=[...held].map(h=>h.k);keys.left=v.includes('left');keys.right=v.includes('right');keys.thrust=v.includes('thrust');
  for(const id in map)$(id).classList.toggle('on',v.includes(map[id]))};
 for(const id in map){const b=$(id);
  b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();try{b.setPointerCapture(e.pointerId)}catch(_){}held.add({id:e.pointerId,k:map[id],b});sync();if(id==='bt')action()});
  const up=e=>{for(const h of held)if(h.id===e.pointerId&&h.b===b)held.delete(h);sync()};
  ['pointerup','pointercancel','lostpointercapture'].forEach(n=>b.addEventListener(n,up));b.addEventListener('contextmenu',e=>e.preventDefault())}}
$('best').textContent=best.toLocaleString();
if(DEBUG)window.__roadster={get state(){return g.state},get g(){return g},keys,action,setState,begin,get best(){return best},get runs(){return runs},get adActive(){return adActive},showAd,crash,startRun,land,step};
requestAnimationFrame(frame);
})();
