(()=>{'use strict';
/* ---------- constants (1 unit = 1 ft, gravity 32.2; launch speeds scaled by 0.7 so the ramp is clearable) ---------- */
const G=32.2,DT=1/120,MPH=1.4667*0.7,R1=22,WALL=14,R2=9,CURL=22*Math.PI/180,SX=-110,GY=0.55,THR=26,DRAIN=0.28,KEY='roadsterLoopBest';
const L1=R1*Math.PI/2,LT=L1+WALL+R2*CURL,TAU=Math.PI*2;
const $=i=>document.getElementById(i),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=a=>{a=(a+Math.PI)%TAU;if(a<0)a+=TAU;return a-Math.PI};
let seed=7;const rnd=()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
/* ramp path sampled by arc length: quarter-pipe -> wall -> curl */
function path(s){s=clamp(s,0,LT);
 if(s<L1){const t=s/R1;return{x:R1*Math.sin(t),y:R1*(1-Math.cos(t)),a:t}}
 s-=L1;if(s<WALL)return{x:R1,y:R1+s,a:Math.PI/2};
 const t=(s-WALL)/R2;return{x:R1-R2+R2*Math.cos(t),y:R1+WALL+R2*Math.sin(t),a:Math.PI/2+t}}

/* ---------- three.js scene ---------- */
const R=new THREE.WebGLRenderer({canvas:$('c'),antialias:true});R.setPixelRatio(Math.min(2,devicePixelRatio||1));
const scene=new THREE.Scene();scene.background=new THREE.Color(0x03050d);scene.fog=new THREE.FogExp2(0x050818,0.0042);
const cam=new THREE.PerspectiveCamera(52,1,.5,2000);
const std=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c},o||{}));
const bas=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}));
scene.add(new THREE.HemisphereLight(0x5a78c8,0x080a14,.6));
const moon=new THREE.DirectionalLight(0x8fb0ff,.7);moon.position.set(-60,120,80);scene.add(moon);
const rampL=new THREE.PointLight(0xff3d8b,1.6,100);rampL.position.set(10,32,16);scene.add(rampL);
const rampL2=new THREE.PointLight(0x5cc8ff,1.1,90);rampL2.position.set(-25,18,18);scene.add(rampL2);
const boomL=new THREE.PointLight(0xffa040,0,70);scene.add(boomL);
function box(w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);scene.add(o);return o}
/* road */
const gnd=new THREE.Mesh(new THREE.PlaneGeometry(1400,90),std(0x0c1020,{metalness:.7,roughness:.32}));gnd.rotation.x=-Math.PI/2;gnd.position.set(-250,0,0);scene.add(gnd);
for(let x=-520;x<110;x+=15){box(7,.03,.4,bas(0xffb347),x,.03,10);box(7,.03,.4,bas(0xffb347),x,.03,-10)}
box(640,.04,.5,bas(0x5cc8ff),-210,.03,16);box(640,.04,.5,bas(0x5cc8ff),-210,.03,-16);
for(let x=-500;x<80;x+=52){box(.5,15,.5,std(0x1a2038),x,7.5,-19);box(2.4,.5,2.4,bas(0xffe2a8),x,15,-19)}
/* skyline + stars */
const wc=document.createElement('canvas');wc.width=32;wc.height=64;const wx=wc.getContext('2d');wx.fillStyle='#070b18';wx.fillRect(0,0,32,64);
for(let i=0;i<60;i++){wx.fillStyle=rnd()<.5?'#ffd27a':'#6fb6ff';wx.globalAlpha=.4+rnd()*.5;wx.fillRect((i%6)*5+2,((i/6)|0)*6+2,3,3)}
const wt=new THREE.CanvasTexture(wc);wt.magFilter=THREE.NearestFilter;
for(let i=0;i<70;i++){const w=14+rnd()*22,h=25+rnd()*95;box(w,h,w,bas(0x8890b0,{map:wt}),-520+rnd()*640,h/2,-75-rnd()*90)}
{const sp=new Float32Array(1500);for(let i=0;i<500;i++){sp[i*3]=-600+rnd()*900;sp[i*3+1]=60+rnd()*280;sp[i*3+2]=-260-rnd()*160}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(sp,3));scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,fog:false})))}
/* ramp */
const rp=[];for(let i=0;i<=60;i++)rp.push(path(LT*i/60));
{const sh=new THREE.Shape();sh.moveTo(0,-.2);rp.forEach(p=>sh.lineTo(p.x,p.y));const e=rp[60];sh.lineTo(e.x+3,e.y-1.5);sh.lineTo(R1+2.4,-.2);sh.closePath();
 const g=new THREE.ExtrudeGeometry(sh,{depth:14,bevelEnabled:false});g.translate(0,0,-7);
 scene.add(new THREE.Mesh(g,std(0x141a3a,{metalness:.5,roughness:.45})));
 scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(g,25),new THREE.LineBasicMaterial({color:0xff3d8b})));
 [-7,7].forEach(z=>{const c=new THREE.CatmullRomCurve3(rp.map(p=>new THREE.Vector3(p.x-.2*Math.sin(p.a),p.y+.2*Math.cos(p.a),z)));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(c,100,.22,6),bas(0xff3d8b)))});
 for(let s=1.5,k=0;s<LT;s+=2.4,k++){const p=path(s),o=new THREE.Mesh(new THREE.BoxGeometry(.3,.08,13.4),bas(k%2?0x3a4cc0:0x24306e));o.position.set(p.x-.05*Math.sin(p.a),p.y+.05*Math.cos(p.a),0);o.rotation.z=p.a;scene.add(o)}}
/* car (original wedge roadster, faces +x, origin at physics centre) */
const carG=new THREE.Group();scene.add(carG);const cm=new THREE.Group();cm.position.y=-GY;carG.add(cm);
const shp=pts=>{const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));return s};
{const bg=new THREE.ExtrudeGeometry(shp([[-2.3,.15],[2.4,.15],[2.45,.45],[1.2,.75],[.2,1.28],[-.9,1.3],[-1.9,.85],[-2.3,.7]]),{depth:1.9,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:2});bg.translate(0,0,-.95);
 cm.add(new THREE.Mesh(bg,std(0xdfe7f5,{metalness:.85,roughness:.22})));
 const cg=new THREE.ExtrudeGeometry(shp([[-1.7,.84],[-.85,1.32],[.15,1.31],[1.0,.78]]),{depth:1.7,bevelEnabled:false});cg.translate(0,0,-.85);
 cm.add(new THREE.Mesh(cg,std(0x0a1018,{metalness:1,roughness:.08})));}
const part=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);cm.add(o);return o};
part(.1,.12,1.5,bas(0xffffff),2.46,.43,0);part(.08,.1,1.7,bas(0xff2a3d),-2.38,.62,0);part(4.6,.05,1.7,bas(0x5cc8ff),0,.1,0);
const wheels=[];[[1.45,1],[1.45,-1],[-1.45,1],[-1.45,-1]].forEach(w=>{const g=new THREE.CylinderGeometry(.42,.42,.32,18);g.rotateX(Math.PI/2);const o=new THREE.Mesh(g,std(0x111318,{roughness:.8}));o.position.set(w[0],.42,w[1]*.95);
 const rim=new THREE.Mesh(new THREE.BoxGeometry(.5,.08,.34),bas(0x5cc8ff));o.add(rim);cm.add(o);wheels.push(o)});
const carL=new THREE.PointLight(0x4fc3ff,.9,18);carL.position.set(0,.1,0);cm.add(carL);
const plumes=[];[[1.45,.75],[1.45,-.75],[-1.45,.75],[-1.45,-.75]].forEach(p=>{const g=new THREE.ConeGeometry(.3,2.8,12,1,true);g.rotateX(Math.PI);g.translate(0,-1.4,0);
 const o=new THREE.Mesh(g,bas(0x4fc3ff,{transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));o.position.set(p[0],.12,p[1]);o.visible=false;cm.add(o);plumes.push(o)});
/* particles, debris, trail, preview */
const NP=400,pp=new Float32Array(NP*3),pc=new Float32Array(NP*3),pb=new Float32Array(NP*3),pv=new Float32Array(NP*3),pl=new Float32Array(NP),pm=new Float32Array(NP);let pi=0;
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pp,3));pg.setAttribute('color',new THREE.BufferAttribute(pc,3));
scene.add(Object.assign(new THREE.Points(pg,new THREE.PointsMaterial({size:1.3,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})),{frustumCulled:false}));
function emit(x,y,n,sp,c,life,dx,dy){for(let k=0;k<n;k++){const i=pi=(pi+1)%NP,a=rnd()*TAU,s=sp*(.3+rnd()*.7);
 pp[i*3]=x;pp[i*3+1]=y;pp[i*3+2]=(rnd()-.5)*2;pv[i*3]=(dx||0)+Math.cos(a)*s;pv[i*3+1]=(dy||0)+Math.sin(a)*s;pv[i*3+2]=(rnd()-.5)*sp*.3;
 pb[i*3]=c[0];pb[i*3+1]=c[1];pb[i*3+2]=c[2];pl[i]=pm[i]=life*(.5+rnd()*.5)}}
const debris=[];for(let i=0;i<16;i++){const o=new THREE.Mesh(new THREE.BoxGeometry(.4+rnd()*.7,.2+rnd()*.3,.4+rnd()*.5),i%3?std(0xdfe7f5,{metalness:.8,roughness:.3}):bas(0xff8a30));o.visible=false;scene.add(o);debris.push({o,v:new THREE.Vector3(),w:new THREE.Vector3()})}
const TN=90,tp=new Float32Array(TN*3),tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(tp,3));
scene.add(Object.assign(new THREE.Line(tg,new THREE.LineBasicMaterial({color:0x5cc8ff,transparent:true,opacity:.7})),{frustumCulled:false}));
let preview=null,rings=[];

/* ---------- audio ---------- */
let ac=null;function tone(f,d,type,v){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();
 const o=ac.createOscillator(),g=ac.createGain();o.type=type||'sine';o.frequency.value=f;g.gain.setValueAtTime(v||.12,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}}
function boomSnd(){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const n=ac.sampleRate*.8,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
 const s=ac.createBufferSource(),g=ac.createGain();s.buffer=b;g.gain.value=.5;s.connect(g);g.connect(ac.destination);s.start()}catch(e){}}

/* ---------- game state ---------- */
let S='title',simT=0,ct=0,greenAt=0,lit=0,lockT=0,hold=0,resT=0,msgT=0,shake=0,runs=0,thr=false,snap=true;
const keys={l:false,r:false,sp:false,ptr:false};
const car={x:SX,y:GY,vx:0,vy:0,a:0,w:0,s:0,v:0,v0:0,acc:0,vis:true};
let run={};
function setS(s){S=s;document.body.dataset.state=s;$('title').classList.toggle('hidden',s!=='title');$('results').classList.toggle('hidden',s!=='results')}
function msg(t,c,d){const m=$('msg');m.textContent=t;m.className='show '+(c||'');msgT=d||1.2}
function reset(){seed=1000+runs*977;rings.forEach(r=>scene.remove(r.g));rings=[];if(preview){scene.remove(preview);preview=null}
 Object.assign(car,{x:SX,y:GY,vx:0,vy:0,a:0,w:0,s:0,v:0,vis:true});debris.forEach(d=>d.o.visible=false);pl.fill(0);pp.fill(1e5);thr=false;
 run={reaction:0,mph:0,peakG:1,maxAlt:0,air:0,flips:0,rings:0,sink:0,tilt:0,bonus:0,gas:1,inv:false,score:0,best:false};
 for(let i=0;i<TN;i++){tp[i*3]=car.x;tp[i*3+1]=car.y;tp[i*3+2]=0}
 ct=0;lit=0;lockT=0;snap=true}
function startCount(){runs++;reset();greenAt=3.7+rnd()*1.2;setS('count')}
const score=()=>run.rings*500+run.flips*1500+Math.round(run.maxAlt)+Math.round(run.air*100)+run.bonus;
function press(){
 if(S==='title'){startCount();return}
 if(S!=='count'||lockT>0)return;
 if(ct<greenAt){msg('Too early, wait for green','bad',1.3);tone(180,.28,'square',.15);lockT=.4;return}
 launch(ct-greenAt)}
function launch(reaction){const mph=clamp(90-5*reaction,76,90);run.reaction=reaction;run.mph=mph;car.v0=mph*MPH;car.v=0;car.acc=car.v0*car.v0/(2*-SX);
 setS('drive');msg('GO!','go',.8);tone(880,.2,'sawtooth',.1);plan()}
/* predict the un-thrusted flight arc to place rings + dotted preview */
function ringMesh(){const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.TorusGeometry(2.4,.2,10,36),bas(0xffc247)));
 g.add(new THREE.Mesh(new THREE.TorusGeometry(2.4,.55,10,36),bas(0xffc247,{transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false})));return g}
function plan(){const e=path(LT),ve=Math.sqrt(Math.max(1,car.v0*car.v0-2*G*e.y));let x=e.x-GY*Math.sin(e.a),y=e.y+GY*Math.cos(e.a),vx=ve*Math.cos(e.a),vy=ve*Math.sin(e.a);const P=[];
 for(let t=0;y>GY&&t<30;t+=1/30){vy-=G/30;x+=vx/30;y+=vy/30;P.push([x,y])}
 [.14,.3,.46,.62,.78].forEach(f=>{const p=P[Math.floor(P.length*f)],g=ringMesh();g.position.set(p[0],p[1],0);scene.add(g);rings.push({g,x:p[0],y:p[1],got:false,t:0})});
 const pa=new Float32Array(Math.ceil(P.length/3)*3);P.filter((_,i)=>i%3==0).forEach((p,i)=>{pa[i*3]=p[0];pa[i*3+1]=p[1]});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pa,3));preview=new THREE.Points(g,new THREE.PointsMaterial({color:0x8fdcff,size:.8,transparent:true,opacity:.5}));scene.add(preview)}
function place(q){car.x=q.x-GY*Math.sin(q.a);car.y=q.y+GY*Math.cos(q.a);car.a=q.a}

/* ---------- fixed-step simulation ---------- */
function step(dt){
 simT+=dt;if(lockT>0)lockT=Math.max(0,lockT-dt);if(msgT>0){msgT-=dt;if(msgT<=0)$('msg').className=''}
 thr=false;
 /* particles + debris (cosmetic, seeded) */
 for(let i=0;i<NP;i++)if(pl[i]>0){pl[i]-=dt;pv[i*3+1]-=10*dt;pp[i*3]+=pv[i*3]*dt;pp[i*3+1]+=pv[i*3+1]*dt;pp[i*3+2]+=pv[i*3+2]*dt;const f=Math.max(0,pl[i]/pm[i]);pc[i*3]=pb[i*3]*f;pc[i*3+1]=pb[i*3+1]*f;pc[i*3+2]=pb[i*3+2]*f}
 debris.forEach(d=>{if(!d.o.visible)return;d.v.y-=G*dt;d.o.position.addScaledVector(d.v,dt);d.o.rotation.x+=d.w.x*dt;d.o.rotation.z+=d.w.z*dt;
  if(d.o.position.y<.2){d.o.position.y=.2;d.v.y*=-.35;d.v.x*=.7;d.v.z*=.7;d.w.multiplyScalar(.8)}});
 rings.forEach(r=>{if(r.got)r.t+=dt});
 switch(S){
 case'count':{ct+=dt;const n=Math.min(4,Math.floor(ct/.7));if(n>lit){lit=n;tone(520,.1,'sine',.08)}
  if(ct>=greenAt&&!run.gtone){run.gtone=1;tone(1040,.25,'sine',.12)}
  if(ct>greenAt+2.5)launch(2.5);break}
 case'drive':{car.v+=car.acc*dt;car.x+=car.v*dt;car.vx=car.v;car.y=GY;car.a=0;
  if(car.x>=0){car.x=0;car.v=car.v0;car.s=0;setS('ramp')}break}
 case'ramp':{const p=path(car.s);car.v=Math.sqrt(Math.max(4,car.v0*car.v0-2*G*p.y));car.s+=car.v*dt;const q=path(car.s);place(q);
  car.vx=car.v*Math.cos(q.a);car.vy=car.v*Math.sin(q.a);
  const k=car.s<L1?1/R1:car.s<L1+WALL?0:1/R2;run.peakG=Math.max(run.peakG,(car.v*car.v*k+G*Math.cos(q.a))/G);
  emit(car.x,car.y-.4,1,5,[1,.4,.2],.4);
  if(car.s>=LT){setS('air');car.w=.8;run.inv=false;msg('Hold Space / tap for thrusters · ← → rotate','hint',3)}break}
 case'air':{let ax=0,ay=-G;
  if((keys.sp||keys.ptr)&&run.gas>0){thr=true;ax-=Math.sin(car.a)*THR;ay+=Math.cos(car.a)*THR;run.gas=Math.max(0,run.gas-DRAIN*dt);
   if((simT*120|0)%2==0)plumes.forEach((_,i)=>{const lx=i<2?1.45:-1.45,lz=0,c=Math.cos(car.a),s=Math.sin(car.a);emit(car.x+lx*c+.1*-s,car.y+lx*s-.1*c,1,3,[.3,.7,1],.5,s*14+car.vx,-c*14+car.vy)})}
  const u=(keys.l?1:0)-(keys.r?1:0);car.w+=u*7*dt;car.w*=Math.exp(-1.6*dt);
  car.vx+=ax*dt;car.vy+=ay*dt;car.x+=car.vx*dt;car.y+=car.vy*dt;car.a+=car.w*dt;
  run.air+=dt;run.maxAlt=Math.max(run.maxAlt,car.y-GY);
  const tilt=Math.abs(wrap(car.a));if(!run.inv&&tilt>2.6){run.inv=true;run.flips++;tone(660,.15,'triangle',.1)}else if(run.inv&&tilt<2)run.inv=false;
  rings.forEach(r=>{if(!r.got&&Math.hypot(car.x-r.x,car.y-r.y)<3.4){r.got=true;run.rings++;run.gas=Math.min(1,run.gas+.35);tone(1200,.2,'triangle',.12);emit(r.x,r.y,40,16,[1,.8,.3],.7)}});
  if(car.y<=GY&&car.vy<0)touch();break}
 case'landed':{hold-=dt;car.vx*=Math.exp(-1.4*dt);car.x+=car.vx*dt;car.a*=Math.exp(-8*dt);car.y=GY;if(hold<=0)finish();break}
 case'crashed':{hold-=dt;if(hold<=0)finish();break}
 case'results':{resT=Math.max(0,resT-dt);break}}
}
function touch(){run.sink=-car.vy;run.tilt=Math.abs(wrap(car.a))*180/Math.PI;car.y=GY;
 if(run.sink<=39&&run.tilt<=28&&car.x<-1){run.bonus=Math.round((39-run.sink)*25+(28-run.tilt)*10);car.vy=0;car.a=wrap(car.a);setS('landed');hold=1.8;msg('Clean landing','go',1.6);emit(car.x,.2,60,14,[.5,.8,1],.6,0,6);tone(300,.2,'triangle',.15)}
 else crash()}
function crash(){setS('crashed');hold=2.4;car.vis=false;const x=car.x,y=Math.max(car.y,.8);
 emit(x,y,220,30,[1,.55,.15],1.2);emit(x,y,100,50,[1,.9,.6],.7);shake=1.4;boomL.position.set(x,y+2,6);boomL.intensity=8;$('flash').style.opacity=.8;
 debris.forEach(d=>{d.o.visible=true;d.o.position.set(x,y,0);d.v.set((rnd()-.5)*40+car.vx*.3,8+rnd()*30,(rnd()-.5)*20);d.w.set(rnd()*14,0,rnd()*14)});
 msg('CRASH','bad',2);boomSnd()}
function finish(){run.score=score();let best=0;try{best=+localStorage.getItem(KEY)||0}catch(e){}
 run.best=run.score>best;if(run.best){best=run.score;try{localStorage.setItem(KEY,String(best))}catch(e){}}
 const sc=run.score;run.grade=S==='crashed'?'F':sc>=7000?'S':sc>=5000?'A':sc>=3500?'B':sc>=2000?'C':'D';
 const t=(i,v)=>$(i).textContent=v;t('grade',run.grade);t('r-score',sc.toLocaleString());$('newbest').classList.toggle('hidden',!run.best);
 t('r-react',run.reaction.toFixed(2)+' s');t('r-speed',run.mph.toFixed(1)+' mph');t('r-g',run.peakG.toFixed(1)+' G');t('r-alt',run.maxAlt.toFixed(0)+' ft');
 t('r-air',run.air.toFixed(2)+' s');t('r-flips',run.flips);t('r-rings',run.rings+' / 5');t('r-td',run.sink.toFixed(1)+' ft/s');t('r-best','Best: '+best.toLocaleString());
 resT=.7;setS('results');$('msg').className=''}
function again(){if(S!=='results'||resT>0)return;$('flash').style.opacity=0;startCount()}

/* ---------- input ---------- */
addEventListener('keydown',e=>{const k=e.code;
 if(k==='Space'||k==='ArrowLeft'||k==='ArrowRight'||k==='KeyA'||k==='KeyD')e.preventDefault();
 if(k==='ArrowLeft'||k==='KeyA')keys.l=true;else if(k==='ArrowRight'||k==='KeyD')keys.r=true;
 else if(k==='Space'){keys.sp=true;if(!e.repeat){if(S==='results')again();else press()}}});
addEventListener('keyup',e=>{const k=e.code;if(k==='ArrowLeft'||k==='KeyA')keys.l=false;else if(k==='ArrowRight'||k==='KeyD')keys.r=false;else if(k==='Space')keys.sp=false});
addEventListener('blur',()=>{keys.l=keys.r=keys.sp=keys.ptr=false});
addEventListener('pointerdown',e=>{if(e.target.closest('button,a'))return;keys.ptr=true;press()});
addEventListener('pointerup',()=>keys.ptr=false);addEventListener('pointercancel',()=>keys.ptr=false);
$('start').onclick=()=>{if(S==='title')startCount()};$('again').onclick=again;
[['bl','l'],['br','r']].forEach(([id,k])=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.stopPropagation();keys[k]=true});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false))});
addEventListener('contextmenu',e=>e.preventDefault());

/* ---------- render ---------- */
const cp=new THREE.Vector3(),cl=new THREE.Vector3();let zs=1;
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;zs=clamp(1.5/(w/h),1,2.4);cam.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
const hc={};const hud=(i,v)=>{if(hc[i]!==v){hc[i]=v;$(i).textContent=v}};
function render(dt){
 carG.visible=car.vis;carG.position.set(car.x,car.y,0);carG.rotation.z=car.a;
 plumes.forEach(p=>{p.visible=thr;if(thr)p.scale.set(1,.8+Math.random()*.5,1)});
 const sp=S==='drive'||S==='ramp'||S==='landed'?car.vx:0;wheels.forEach(w=>w.rotation.z-=sp*dt/.42);
 rings.forEach(r=>{const g=r.g;if(r.got){g.scale.setScalar(1+r.t*4);g.visible=r.t<.35}else g.scale.setScalar(1+Math.sin(simT*4+r.x)*.04)});
 pg.attributes.position.needsUpdate=pg.attributes.color.needsUpdate=true;
 if(S==='drive'||S==='ramp'||S==='air'){tp.copyWithin(0,3);const n=(TN-1)*3;tp[n]=car.x;tp[n+1]=car.y;tp[n+2]=0;tg.attributes.position.needsUpdate=true}
 /* camera */
 let tx,ty,tz,lx,ly;const alt=Math.max(0,car.y-GY);
 if(S==='title'||S==='count'){const o=S==='title'?simT*.25:0;tx=car.x-13+Math.sin(o)*4;ty=3.2+Math.cos(o)*.8;tz=8+Math.cos(o)*2;lx=car.x+9;ly=1.2}
 else{const ah=clamp(car.vx*.25,-14,22);tx=car.x+ah;ty=car.y*.65+7;tz=(44+alt*.55)*zs;lx=tx;ly=car.y*.8+2}
 if(snap){cp.set(tx,ty,tz);cl.set(lx,ly,0);snap=false}
 const k=1-Math.exp(-3.5*dt);cp.x+=(tx-cp.x)*k;cp.y+=(ty-cp.y)*k;cp.z+=(tz-cp.z)*k;cl.x+=(lx-cl.x)*k;cl.y+=(ly-cl.y)*k;
 cam.position.copy(cp);
 if(shake>0){shake=Math.max(0,shake-dt*1.2);cam.position.x+=(Math.random()-.5)*shake*4;cam.position.y+=(Math.random()-.5)*shake*4}
 cam.lookAt(cl);if(shake>0)cam.rotation.z+=(Math.random()-.5)*shake*.05;
 const f=52+clamp(Math.hypot(car.vx,car.vy)*.12,0,10);if(Math.abs(cam.fov-f)>.05){cam.fov=f;cam.updateProjectionMatrix()}
 boomL.intensity*=Math.exp(-4*dt);const fl=$('flash');if(+fl.style.opacity>0)fl.style.opacity=Math.max(0,fl.style.opacity-dt*2.2);
 /* hud */
 const spd=S==='air'?Math.hypot(car.vx,car.vy):car.vx;hud('h-speed',Math.max(0,Math.round(spd/MPH)));hud('h-alt',Math.round(alt));hud('h-air',(run.air||0).toFixed(1));
 hud('h-rings',run.rings||0);hud('h-flips',run.flips||0);hud('h-score',S==='title'?'0':score().toLocaleString());
 $('gasfill').style.width=((run.gas==null?1:run.gas)*100).toFixed(0)+'%';
 const L=$('lights').children;for(let i=0;i<4;i++){const on=(S==='count'?i<lit:S!=='title'),go=i===3&&on&&(S!=='count'||ct>=greenAt);L[i].className=go?'go':on?'on':''}
 R.render(scene,cam)}
/* ---------- main loop: fixed 1/120 s step with accumulator ---------- */
let last=0,acc=0;reset();setS('title');
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.1,(t-last)/1000||0);last=t;acc+=dt;while(acc>=DT){step(DT);acc-=DT}render(dt)}
requestAnimationFrame(frame);
})();
