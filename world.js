import { random } from './genetics.js';
import { ROUND_SECONDS, REPLAY_HZ, REPLAY_FRAMES, sampleReplay, scoreTitle } from './battle.js';

const TAU = Math.PI * 2;
const color = (h,s,l,a=1) => `hsla(${h},${s}%,${l}%,${a})`;

function smoothPath(points) {
  const path=new Path2D();
  const last=points[points.length-1],first=points[0];
  path.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);
  points.forEach((p,i)=>{const next=points[(i+1)%points.length];path.quadraticCurveTo(p[0],p[1],(p[0]+next[0])/2,(p[1]+next[1])/2);});
  path.closePath(); return path;
}

function bodyPath(s,t,r) {
  const points=[];
  for(let i=0;i<80;i++){
    const angle=i/80*TAU;
    let radius=1+Math.sin(angle*s.lobes+t*.8)*.047+Math.cos(angle*3-t*.6)*.04;
    let x=Math.cos(angle),y=Math.sin(angle);
    if(s.form===0){x*=1.12; y*=.72; if(y>.04)y*=.65; radius+=Math.sin(angle*9)*.025;}
    if(s.form===1)radius=.72+Math.sin(angle*6+t*.7)*.08;
    if(s.form===2)radius=.85+Math.sin(angle*s.lobes+t*.32)*.18+Math.cos(angle*3-t*.4)*.12;
    if(s.form===3){x*=1.08;y*=.87;radius+=Math.sin(angle*12)*.025;}
    if(s.form===4)radius=.91+Math.sin(angle*4+t*.5)*.1;
    if(s.form===5){x*=1.45;y*=.67;radius=1+Math.cos(angle*2)*.13+Math.sin(angle*4+t*.8)*.09;}
    points.push([x*r*radius,y*r*radius]);
  }
  return smoothPath(points);
}

function drawRibbon(ctx,from,points,width,hue) {
  ctx.beginPath();ctx.moveTo(...from);
  for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
  ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=width+5;ctx.strokeStyle=color(hue,62,68,.13);ctx.stroke();
  ctx.lineWidth=width;ctx.strokeStyle=color(hue,52,58,.39);ctx.stroke();
  ctx.lineWidth=Math.max(.7,width*.12);ctx.strokeStyle=color(hue,70,98,.75);ctx.stroke();
}

export function drawCreature(ctx,s,x,y,r,t=0,options={}) {
  if(!s || r<=0)return;
  const rng=random(s.seed),h=s.hue;
  ctx.save();ctx.translate(x,y);ctx.rotate(options.rotation||Math.sin(t*.35+s.seed)*.07);
  const jiggle=1+Math.sin(t*1.8+s.seed)*.026;ctx.scale(jiggle,1/jiggle);
  // 触须用连续曲线绘制，末端相位各不相同，避免所有肢体同步摆动。
  if(s.form<=1){
    for(let j=0;j<s.arms;j++){
      const phase=j*2.1+s.seed;
      const points=[];
      const startX=s.form===0?(j/(s.arms-1)-.5)*r*1.7:Math.cos(j/s.arms*TAU)*r*.55;
      const startY=s.form===0?r*.13:Math.sin(j/s.arms*TAU)*r*.55;
      const length=r*(.8+rng()*.9),angle=j/s.arms*TAU;
      for(let k=0;k<=32;k++){
        const u=k/32;
        if(s.form===0)points.push([startX+Math.sin(u*6-t*1.8+phase)*r*.15*u+(j/(s.arms-1)-.5)*r*.45*u,startY+u*length]);
        else points.push([startX+Math.cos(angle)*length*u+Math.sin(u*5+t+phase)*r*.2*u,startY+Math.sin(angle)*length*u+Math.cos(u*6+t+phase)*r*.19*u]);
      }
      drawRibbon(ctx,[startX,startY],points,r*(j%3===0?.055:.028),h+j*2);
      const end=points.at(-1);ctx.beginPath();ctx.arc(end[0],end[1],r*.025,0,TAU);ctx.fillStyle=color(h,70,91,.8);ctx.fill();
    }
  }
  if(s.form===2){for(let j=0;j<3;j++){const angle=j*TAU/3+.4;const points=Array.from({length:28},(_,k)=>{const u=k/27;return[Math.cos(angle)*(r*.65+u*r*.7)+Math.sin(t+u*5+j)*u*r*.2,Math.sin(angle)*(r*.65+u*r*.7)+Math.cos(t+u*6+j)*u*r*.2];});drawRibbon(ctx,points[0],points,r*.038,h);}}
  if(s.form===3){
    ctx.fillStyle=color(h+8,75,72,.35);ctx.strokeStyle=color(h,58,90,.8);ctx.lineWidth=1.2;
    for(const dir of [-1,1]){const p=new Path2D();p.moveTo(dir*r*.75,-r*.1);p.quadraticCurveTo(dir*r*1.65,-r*.7,dir*r*1.35,r*.3);p.quadraticCurveTo(dir*r*1.1,r*.55,dir*r*.75,r*.2);ctx.fill(p);ctx.stroke(p);}
  }
  if(s.form===4){for(let j=0;j<4;j++){const angle=(j+.5)*TAU/4;ctx.beginPath();ctx.ellipse(Math.cos(angle)*r*.77,Math.sin(angle)*r*.8,r*.32,r*.37,angle,0,TAU);ctx.fillStyle=color(h,65,76,.42);ctx.fill();}}
  if(s.form===5){const points=Array.from({length:40},(_,k)=>{const u=k/39;return[Math.sin(u*6-t*1.5)*u*r*.3,r*.35+u*r*1.4];});drawRibbon(ctx,[0,r*.35],points,r*.05,h);}
  const path=bodyPath(s,t,r);
  ctx.shadowColor=color(h,45,25,.11);ctx.shadowBlur=r*.16;ctx.shadowOffsetY=r*.15;
  const body=ctx.createRadialGradient(-r*.38,-r*.48,r*.02,r*.1,r*.25,r*1.7);
  body.addColorStop(0,color(h-12,68,96,.98));body.addColorStop(.28,color(h,70,81,.82));body.addColorStop(.52,color(h+10,65,69,.65));body.addColorStop(.76,color(h+28,58,50,.67));body.addColorStop(1,color(h+25,62,36,.9));
  ctx.fillStyle=body;ctx.fill(path);ctx.shadowColor='transparent';
  ctx.save();ctx.clip(path);
  const inner=ctx.createRadialGradient(r*.12,r*.2,0,r*.05,r*.2,r*.9);inner.addColorStop(0,color(h+45,55,63,.02));inner.addColorStop(.55,color(h+45,58,69,.08));inner.addColorStop(.76,color(h+60,65,67,.4));inner.addColorStop(.9,color(h-20,60,93,.05));inner.addColorStop(1,color(h,80,90,0));ctx.fillStyle=inner;ctx.fillRect(-r*2,-r*2,r*4,r*4);
  // 内部细胞和斑点固定在各自的种子位置，动画时只作很小的漂移。
  for(let i=0;i<48;i++){
    const angle=rng()*TAU,dist=Math.sqrt(rng())*r*.85,px=Math.cos(angle)*dist,py=Math.sin(angle)*dist*.8;
    ctx.beginPath();ctx.ellipse(px+Math.sin(t+i)*r*.008,py,r*(.012+rng()*.043),r*(.008+rng()*.031),angle,0,TAU);ctx.fillStyle=color(h+i%4*10,45,95,.12+rng()*.22);ctx.fill();ctx.lineWidth=.65;ctx.strokeStyle=color(h+15,65,45,.1);ctx.stroke();
  }
  for(let k=0;k<3;k++){
    ctx.save();ctx.translate(-r*.04,-r*.02);ctx.scale(1-k*.09,1-k*.1);ctx.strokeStyle=color(h+10,60,99,.18-k*.035);ctx.lineWidth=1;ctx.stroke(path);ctx.restore();
  }
  const shine=ctx.createRadialGradient(-r*.4,-r*.46,0,-r*.4,-r*.46,r*.85);shine.addColorStop(0,'#ffffffd0');shine.addColorStop(.2,'#ffffff3d');shine.addColorStop(.7,'#ffffff00');ctx.fillStyle=shine;ctx.fillRect(-r*2,-r*2,r*4,r*4);
  ctx.restore();
  ctx.lineWidth=r*.012;ctx.strokeStyle=color(h,70,97,.85);ctx.stroke(path);
  ctx.save();ctx.translate(-r*.015,-r*.02);ctx.strokeStyle=color(h+20,48,42,.2);ctx.lineWidth=.7;ctx.stroke(path);ctx.restore();
  const eyeY=s.form===0?-r*.2:-r*.12,eyeGap=s.eyes===3?r*.34:r*.25;
  const gaze=options.gaze||{x:0,y:0};const blink=options.blink ?? (Math.sin(t*.72+s.seed)> .996 ? .1 : 1);
  for(let i=0;i<s.eyes;i++){
    const ex=(i-(s.eyes-1)/2)*eyeGap*1.4,ey=eyeY+(i===1&&s.eyes===3?-r*.13:0),er=r*(s.form===5?.13:.16);
    ctx.save();ctx.translate(ex,ey);ctx.scale(1,blink);ctx.shadowColor='#17394725';ctx.shadowBlur=r*.07;ctx.shadowOffsetY=r*.025;
    ctx.beginPath();ctx.ellipse(0,0,er*.82,er*1.05,0,0,TAU);ctx.fillStyle='#f8ffffed';ctx.fill();ctx.shadowColor='transparent';
    ctx.beginPath();ctx.ellipse(gaze.x*er*.3,er*.1+gaze.y*er*.25,er*.38,er*.5,0,0,TAU);ctx.fillStyle='#173746';ctx.fill();
    ctx.beginPath();ctx.arc(gaze.x*er*.3-er*.1,-er*.1+gaze.y*er*.25,er*.13,0,TAU);ctx.fillStyle='#fff';ctx.fill();ctx.restore();
  }
  ctx.beginPath();ctx.arc(0,eyeY+r*.32,r*.085,.15,Math.PI-.15);ctx.lineWidth=r*.018;ctx.strokeStyle=color(h+40,35,30,.5);ctx.stroke();
  if(options.fed){ctx.font=`${r*.22}px Arial`;ctx.fillStyle=color(h,55,45,.65);ctx.fillText('♡',r*.65,-r*.8);}
  ctx.restore();
}

export class PetriWorld {
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw new Error('Canvas unavailable');
    this.specimens=[];this.particles=[];this.pointer={x:-999,y:-999,active:false};this.food=[];this.ripples=[];this.game=null;this.keys=new Set();
    this.t=0;this.last=0;this.lastDraw=0;this.width=0;this.height=0;this.paused=matchMedia('(prefers-reduced-motion: reduce)').matches;this.frame=0;
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
    this.onPointerMove=e=>{const rect=canvas.getBoundingClientRect();this.pointer={x:e.clientX-rect.left,y:e.clientY-rect.top,active:true};if(this.paused)this.draw();};
    this.onPointerLeave=()=>{this.pointer.active=false;};
    this.onPointerDown=e=>{this.onPointerMove(e);if(this.game)return;const {x,y}=this.pointer;this.ripples.push({x,y,age:0});this.specimens.forEach(p=>{const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);if(d<this.radius*.8){p.vx+=dx/Math.max(d,1)*140;p.vy+=dy/Math.max(d,1)*100;}});if(this.paused)this.draw();};
    canvas.addEventListener('pointermove',this.onPointerMove);canvas.addEventListener('pointerleave',this.onPointerLeave);canvas.addEventListener('pointerdown',this.onPointerDown);
    this.onVisibility=()=>{this.last=0;if(document.hidden&&this.game)this.cancelGame('离开页面，本局已取消。再开一局就能重新挑战。');};document.addEventListener('visibilitychange',this.onVisibility);
    this.onKeyDown=e=>{if(!this.game||e.target.closest('input,textarea,select'))return;const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(key)){e.preventDefault();this.keys.add(key);if(key===' '&&!e.repeat)this.dash();}};
    this.onKeyUp=e=>this.keys.delete(e.key.toLowerCase());document.addEventListener('keydown',this.onKeyDown);document.addEventListener('keyup',this.onKeyUp);
    this.resize();this.animate=this.animate.bind(this);this.frame=requestAnimationFrame(this.animate);
  }
  resize(){
    const rect=this.canvas.getBoundingClientRect();this.width=Math.max(1,rect.width);this.height=Math.max(1,rect.height);
    const dpr=Math.min(devicePixelRatio||1,1.5);this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.cx=this.width*(innerWidth>680?.59:.5);this.cy=this.height*(innerWidth>680?.46:.45);this.radius=Math.min(this.width*(innerWidth>680?.385:.465),this.height*.438);
    this.specimens.forEach((p,i)=>{p.x=this.cx+(i?1:-1)*(this.specimens.length===2?this.radius*.3:0);p.y=this.cy;});this.draw();
  }
  set(a,b=null,experiment=null){
    this.experiment=experiment;
    this.specimens=[a,b].filter(Boolean).map((s,i)=>({s,x:this.cx+(b?(i?1:-1)*this.radius*.38:0),y:this.cy,vx:0,vy:0,fed:0,phase:i*2.5+s.seed%6}));
    this.food=[];this.ripples=[{x:this.cx,y:this.cy,age:0}];this.draw();
  }
  feed(){
    for(let i=0;i<8;i++){const angle=i/8*TAU;this.food.push({x:this.cx+Math.cos(angle)*this.radius*.5,y:this.cy+Math.sin(angle)*this.radius*.48,life:7+i*.3});}
    this.specimens.forEach(p=>p.fed=3);if(this.paused)this.draw();
  }
  togglePause(){if(this.game){this.cancelGame('本局已结束，准备好可以重新开战。');return this.paused;}this.paused=!this.paused;this.last=0;this.draw();return this.paused;}
  startGame({specimen,seed,opponent,onTick,onFinish,onCancel}){
    const rng=random(seed),spawn=()=>{const a=rng()*TAU,d=Math.sqrt(rng())*.77;return{x:Math.cos(a)*d,y:Math.sin(a)*d};};
    this.game={specimen,seed,opponent,onTick,onFinish,onCancel,rng,spawn,started:performance.now()+1800,elapsed:0,x:-.3,y:.3,score:0,combo:0,lastEat:-5,hits:0,collected:0,safeUntil:0,dashUntil:0,dashReady:0,frames:[],dots:Array.from({length:5},spawn),lastHud:-1};
    this.keys.clear();this.paused=false;this.pointer.active=false;this.canvas.classList.add('is-playing');this.draw();
  }
  dash(){const g=this.game;if(g&&g.elapsed>=g.dashReady){g.dashUntil=g.elapsed+.3;g.dashReady=g.elapsed+3;}}
  cancelGame(message){const g=this.game;if(!g)return;this.game=null;this.canvas.classList.remove('is-playing');this.keys.clear();g.onCancel?.(message);this.draw();}
  updateGame(dt,now){
    const g=this.game;if(!g)return;g.elapsed=Math.max(0,Math.min(ROUND_SECONDS,(now-g.started)/1000));
    if(now<g.started){g.onTick?.({remaining:ROUND_SECONDS,score:0,combo:0,opponentScore:g.opponent?0:null,dashReady:true,countdown:Math.ceil((g.started-now)/1000)});return;}
    let dx=(this.keys.has('arrowright')||this.keys.has('d')?1:0)-(this.keys.has('arrowleft')||this.keys.has('a')?1:0),dy=(this.keys.has('arrowdown')||this.keys.has('s')?1:0)-(this.keys.has('arrowup')||this.keys.has('w')?1:0);
    const usingKeys=dx||dy;
    if(!usingKeys&&this.pointer.active){dx=(this.pointer.x-this.cx)/this.radius-g.x;dy=(this.pointer.y-this.cy)/this.radius-g.y;}
    const distance=Math.hypot(dx,dy),speed=g.elapsed<g.dashUntil?2.7:1.25;
    if(distance>.002){const step=Math.min(distance,dt*speed);g.x+=dx/distance*step;g.y+=dy/distance*step;}
    const edge=Math.hypot(g.x,g.y);if(edge>.82){g.x*=.82/edge;g.y*=.82/edge;}
    g.dots.forEach(dot=>{if(Math.hypot(dot.x-g.x,dot.y-g.y)<.13){g.combo=g.elapsed-g.lastEat<1.65?Math.min(5,g.combo+1):1;g.score+=10*g.combo;g.collected++;g.lastEat=g.elapsed;let next=g.spawn();for(let i=0;i<12&&Math.hypot(next.x-g.x,next.y-g.y)<.3;i++)next=g.spawn();dot.x=next.x;dot.y=next.y;}});
    const hazards=this.gameHazards(g.elapsed);
    if(g.elapsed>g.safeUntil&&hazards.some(h=>Math.hypot(h.x-g.x,h.y-g.y)<.16)){g.score=Math.max(0,g.score-15);g.combo=0;g.hits++;g.safeUntil=g.elapsed+1.1;}
    // 每二百毫秒记录位置和真实累计分数，朋友打开后看到的是这一局的残影。
    while(g.frames.length<Math.min(REPLAY_FRAMES,Math.floor(g.elapsed*REPLAY_HZ)+1))g.frames.push([g.x,g.y,g.score]);
    if(g.elapsed-g.lastHud>.07){g.lastHud=g.elapsed;g.onTick?.({remaining:Math.max(0,ROUND_SECONDS-g.elapsed),score:g.score,combo:g.combo,opponentScore:g.opponent?sampleReplay(g.opponent.frames,g.elapsed).score:null,dashReady:g.elapsed>=g.dashReady});}
    if(g.elapsed>=ROUND_SECONDS){while(g.frames.length<REPLAY_FRAMES)g.frames.push([g.x,g.y,g.score]);const result={seed:g.seed,score:g.score,frames:g.frames,hits:g.hits,collected:g.collected,opponentScore:g.opponent?.score??null};this.game=null;this.canvas.classList.remove('is-playing');this.keys.clear();g.onFinish?.(result);}
  }
  gameHazards(t){return[0,1,2].map((i)=>{const angle=t*(i===1?-.42:.35)+i*TAU/3;return{x:Math.cos(angle)*(.3+i*.13),y:Math.sin(angle)*(.38+i*.1)};});}
  drawGame(){
    const c=this.ctx,g=this.game;if(!g)return;const r=this.radius,toPixel=p=>({x:this.cx+p.x*r,y:this.cy+p.y*r});
    g.dots.forEach((d,i)=>{const p=toPixel(d);const glow=c.createRadialGradient(p.x-2,p.y-3,0,p.x,p.y,r*.06);glow.addColorStop(0,'#f6ffff');glow.addColorStop(.28,'#66d7e8');glow.addColorStop(.74,'#329eb4');glow.addColorStop(1,'#359daf22');c.beginPath();c.arc(p.x,p.y,r*.048+Math.sin(this.t*4+i)*r*.003,0,TAU);c.fillStyle=glow;c.fill();});
    this.gameHazards(g.elapsed).forEach((h,i)=>{const p=toPixel(h),points=[];for(let k=0;k<22;k++){const a=k/22*TAU,d=r*(k%2?.073:.1);points.push([p.x+Math.cos(a)*d,p.y+Math.sin(a)*d]);}const path=smoothPath(points);const fill=c.createRadialGradient(p.x-r*.03,p.y-r*.04,0,p.x,p.y,r*.11);fill.addColorStop(0,'#ffd2ce');fill.addColorStop(.45,'#db777f');fill.addColorStop(1,'#9b4357');c.fillStyle=fill;c.fill(path);c.fillStyle='#712b45';c.beginPath();c.arc(p.x-r*.024,p.y-r*.01,r*.009,0,TAU);c.arc(p.x+r*.024,p.y-r*.01,r*.009,0,TAU);c.fill();});
    if(g.opponent){const ghost=sampleReplay(g.opponent.frames,g.elapsed),p=toPixel(ghost);c.save();c.globalAlpha=.45;drawCreature(c,g.opponent.specimen,p.x,p.y,r*.075,this.t,{blink:1});c.restore();c.beginPath();c.arc(p.x,p.y,r*.115,0,TAU);c.strokeStyle='#9d8ab47a';c.lineWidth=1;c.stroke();c.fillStyle='#725d98';c.font='10px Arial';c.textAlign='center';c.fillText(`@${g.opponent.specimen.name} 的残影`,p.x,p.y-r*.16,r*.9);}
    const me=toPixel(g);c.save();if(g.elapsed<g.safeUntil)c.globalAlpha=.5+Math.sin(g.elapsed*25)*.3;drawCreature(c,g.specimen,me.x,me.y,r*.087,this.t,{blink:1});c.restore();
    c.beginPath();c.arc(me.x,me.y,r*.12,0,TAU);c.strokeStyle='#176f8180';c.lineWidth=1.2;c.stroke();c.fillStyle='#183a46';c.font='10px "Microsoft YaHei",sans-serif';c.textAlign='center';c.fillText('你',me.x,me.y+r*.19);
    if(g.elapsed<g.dashUntil){c.beginPath();c.arc(me.x,me.y,r*.12,0,TAU);c.strokeStyle='#fff';c.lineWidth=2;c.stroke();}
  }
  animate(now){
    const dt=this.last?Math.min((now-this.last)/1000,.035):0;this.last=now;
    // 物理保持按真实时间更新，画面限于每秒约三十帧，避免手机反复计算玻璃阴影。
    if(!this.paused&&!document.hidden){this.t+=dt;if(this.game)this.updateGame(dt,now);else this.update(dt);if(now-this.lastDraw>=32){this.draw();this.lastDraw=now;}}
    this.frame=requestAnimationFrame(this.animate);
  }
  update(dt){
    const r=this.radius,t=this.t,behavior=this.experiment?.behavior;
    this.specimens.forEach((p,i)=>{
      const pair=this.specimens.length===2;
      let tx=this.cx+(pair?(i?1:-1)*r*.35:0)+Math.sin(t*.35+p.phase)*r*.075,ty=this.cy+Math.cos(t*.47+p.phase)*r*.065;
      if(pair){
        if(behavior==='orbit'){tx=this.cx+Math.cos(t*.32+i*Math.PI)*r*.39;ty=this.cy+Math.sin(t*.32+i*Math.PI)*r*.26;}
        if(behavior==='close'){tx=this.cx+(i?1:-1)*r*.24;ty=this.cy+Math.sin(t*.5+i)*r*.08;}
        if(behavior==='apart'){tx=this.cx+(i?1:-1)*r*.52;ty=this.cy+Math.sin(t*.5+i)*r*.12;}
        if(behavior==='bounce'){tx=this.cx+(i?1:-1)*(r*.32+Math.sin(t*1.5)*r*.12);ty=this.cy+Math.cos(t*1.5+i*Math.PI)*r*.15;}
        if(behavior==='chase'){tx=this.cx+Math.cos(t*.65+i*1.6)*r*.41;ty=this.cy+Math.sin(t*.65+i*1.6)*r*.3;}
        if(behavior==='wave'){ty=this.cy+Math.sin(t*.9)*r*.18;}
      }
      if(this.food.length){let f=this.food.reduce((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(b.x-p.x,b.y-p.y)?a:b);tx=f.x;ty=f.y;if(Math.hypot(p.x-f.x,p.y-f.y)<r*.15){f.life=0;p.fed=2;}}
      p.vx+=(tx-p.x)*dt*1.7;p.vy+=(ty-p.y)*dt*1.7;
      const damping=Math.exp(-dt*2.6);p.vx*=damping;p.vy*=damping;p.x+=p.vx*dt;p.y+=p.vy*dt;p.fed=Math.max(0,p.fed-dt);
      const dx=p.x-this.cx,dy=p.y-this.cy,d=Math.hypot(dx,dy);if(d>r*.66){p.x=this.cx+dx/d*r*.66;p.y=this.cy+dy/d*r*.66;}
    });
    this.food.forEach(f=>f.life-=dt);this.food=this.food.filter(f=>f.life>0);this.ripples.forEach(w=>w.age+=dt);this.ripples=this.ripples.filter(w=>w.age<2.2);
  }
  drawDish(){
    const c=this.ctx,{cx,cy,radius:r}=this;
    // 同心折射和偏移高光构成培养皿的玻璃边缘，主体保持透明。
    c.save();c.translate(cx,cy);
    const shadow=c.createRadialGradient(0,r*.24,r*.5,0,r*.12,r*1.24);shadow.addColorStop(0,'#83aeb116');shadow.addColorStop(.68,'#6f9ea127');shadow.addColorStop(.84,'#7393961c');shadow.addColorStop(1,'#68949600');c.fillStyle=shadow;c.fillRect(-r*1.5,-r*1.3,r*3,r*3);
    const water=c.createRadialGradient(-r*.38,-r*.48,0,r*.03,r*.07,r);water.addColorStop(0,'#f8ffffda');water.addColorStop(.46,'#d1ecedb5');water.addColorStop(.8,'#cae3e580');water.addColorStop(1,'#b4d4d8b3');c.beginPath();c.arc(0,0,r,0,TAU);c.fillStyle=water;c.fill();
    for(let i=0;i<8;i++){c.beginPath();c.arc(0,(i-3)*.4,r-i*2,0,TAU);c.strokeStyle=['#ffffffdc','#719f9e3b','#ffffffa5','#93b9ba69','#dffbfbdd','#829ba439','#fff9','#fff7'][i];c.lineWidth=i===0?3.5:1.3;c.stroke();}
    c.beginPath();c.arc(-2,-2,r-10,Math.PI*1.04,Math.PI*1.64);c.strokeStyle='#fff9';c.lineWidth=5;c.stroke();
    c.beginPath();c.arc(0,1,r-14,.05,Math.PI*.42);c.strokeStyle='#8aafb35c';c.lineWidth=3;c.stroke();
    const rng=random(91823);for(let i=0;i<33;i++){const a=rng()*TAU,d=Math.sqrt(rng())*r*.88;const x=Math.cos(a)*d+Math.sin(this.t*.14+i)*2,y=Math.sin(a)*d+Math.cos(this.t*.16+i)*2;c.beginPath();c.arc(x,y,.8+rng()*2.6,0,TAU);c.strokeStyle='#7cafba2d';c.lineWidth=.8;c.stroke();c.beginPath();c.arc(x-.4,y-.7,.7,0,TAU);c.fillStyle='#ffffffa3';c.fill();}
    c.restore();
  }
  draw(){
    if(!this.ctx||!this.width)return;
    const c=this.ctx;c.clearRect(0,0,this.width,this.height);this.drawDish();
    if(this.game){this.drawGame();return;}
    const two=this.specimens.length===2,r=this.radius*(two?.29:.43);
    this.ripples.forEach(w=>{c.beginPath();c.arc(w.x,w.y,w.age*this.radius*.48+8,0,TAU);c.lineWidth=1;c.strokeStyle=`rgba(255,255,255,${Math.max(0,.45-w.age*.2)})`;c.stroke();});
    for(const p of this.specimens){
      const gaze=this.pointer.active?{x:Math.max(-1,Math.min(1,(this.pointer.x-p.x)/this.radius)),y:Math.max(-1,Math.min(1,(this.pointer.y-p.y)/this.radius))}:{x:Math.sin(this.t*.4)*.3,y:0};
      drawCreature(c,p.s,p.x,p.y,r,this.t+p.phase,{gaze,fed:p.fed>0});
      c.save();c.fillStyle='#39616c';c.textAlign='center';c.font=`${innerWidth>680?11:9}px Arial,"Microsoft YaHei",sans-serif`;c.fillText(`@${p.s.name}`,p.x,p.y+r*(p.s.form===0?2.02:1.57),two?this.radius*.8:this.radius*1.6);c.restore();
    }
    this.food.forEach((f,i)=>{c.save();c.translate(f.x,f.y+Math.sin(this.t+i)*3);c.fillStyle='#c279957d';c.font='16px Arial';c.textAlign='center';c.fillText('♡',0,0);c.restore();});
  }
  destroy(){cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.canvas.removeEventListener('pointermove',this.onPointerMove);this.canvas.removeEventListener('pointerleave',this.onPointerLeave);this.canvas.removeEventListener('pointerdown',this.onPointerDown);document.removeEventListener('visibilitychange',this.onVisibility);document.removeEventListener('keydown',this.onKeyDown);document.removeEventListener('keyup',this.onKeyUp);}
}

export function drawPoster(a,b,experiment){
  const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=1700;const c=canvas.getContext('2d');if(!c)throw new Error('当前浏览器无法导出图片');
  c.fillStyle='#eaf0f1';c.fillRect(0,0,1400,1700);
  const grad=c.createRadialGradient(700,720,0,700,720,710);grad.addColorStop(0,'#fbffff');grad.addColorStop(.65,'#d3e9eb');grad.addColorStop(1,'#eaf0f1');c.fillStyle=grad;c.fillRect(0,0,1400,1700);
  c.fillStyle='#183a46';c.font='bold 30px "Microsoft YaHei",sans-serif';c.fillText('推友斗菌场',75,104);c.font='17px Arial';c.fillText('AMZ / 20 SECONDS. ONE PETRI DISH.',75,145);c.textAlign='right';c.font='23px Arial';c.fillText('@AmzTjh34230',1325,112);c.textAlign='left';
  c.fillStyle='#526f7b';c.font='23px "Microsoft YaHei",sans-serif';c.fillText(b?'双人观察报告':'互联网物种证件',75,239);
  const specs=b?[a,b]:[a];specs.forEach((s,i)=>{const x=b?(i?985:415):700,y=690,r=b?200:290;drawCreature(c,s,x,y,r,1.8,{blink:1,gaze:{x:b?(i?-.7:.7):.1,y:0}});c.textAlign='center';c.fillStyle='#42636c';c.font='24px "Microsoft YaHei",sans-serif';c.fillText(`@${s.name}`,x,b?1090:1180,b?520:1200);});
  c.textAlign='left';c.fillStyle='#183a46';c.font=`bold ${b?64:63}px "Microsoft YaHei",sans-serif`;const title=b?experiment.title:a.title;c.fillText(title,75,1310);
  c.fillStyle='#506c77';c.font='29px "Microsoft YaHei",sans-serif';c.fillText(b?experiment.line:a.description,75,1382);c.font='27px "Microsoft YaHei",sans-serif';c.fillText(b?'把你们放在一起，会发生什么？':`「${a.quote}」`,75,1444);
  c.strokeStyle='#bed0d5';c.lineWidth=1;c.beginPath();c.moveTo(75,1510);c.lineTo(1325,1510);c.stroke();c.fillStyle='#2e5866';c.font='24px "Microsoft YaHei",sans-serif';c.fillText('你的网名，会长成什么样？',75,1574);c.font='22px Arial';c.textAlign='right';c.fillText('yns34-hub.github.io/petri',1325,1574);c.textAlign='left';c.fillStyle='#526e78';c.font='17px "Microsoft YaHei",sans-serif';c.fillText('由网名与心情生成 · 虚构物种，纯属好玩',75,1635);c.font='16px Arial';c.textAlign='right';c.fillText(a.code,1325,1635);
  return canvas;
}

export function drawScorePoster(specimen,result){
  const canvas=drawPoster(specimen,null,null),c=canvas.getContext('2d');
  c.fillStyle='#eaf0f1';c.fillRect(0,190,1400,110);c.fillRect(0,1150,1400,360);
  c.fillStyle='#506c77';c.font='25px "Microsoft YaHei",sans-serif';c.fillText(`推友斗菌场 / 20 秒真实战绩 / @${specimen.name}`,75,249,1250);
  c.fillStyle='#183a46';c.font='bold 140px Arial';c.fillText(`${result.score}`,75,1305);c.font='32px "Microsoft YaHei",sans-serif';c.fillText('分',520,1300);
  c.font='bold 51px "Microsoft YaHei",sans-serif';c.fillText(scoreTitle(result.score),75,1390);
  c.fillStyle='#506c77';c.font='29px "Microsoft YaHei",sans-serif';c.fillText(`抢到 ${result.collected} 颗营养泡泡，碰撞 ${result.hits} 次。`,75,1450);
  c.fillStyle='#183a46';c.font='26px "Microsoft YaHei",sans-serif';c.fillText('你能赢过我的残影吗？',780,1360);
  c.fillStyle='#506c77';c.font='21px "Microsoft YaHei",sans-serif';c.fillText('打开挑战链接，同一场地见。',780,1410);
  return canvas;
}
