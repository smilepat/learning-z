(()=>{
const {SP,STEPS,BOOKS,G,PLACEMENT}=window.RS_DATA;
/* 선택 언어 묶음(data/words-zh.js 등). 고르지 않으면 L1 은 null 이고 화면에는 영어만 나온다. */
const CH=window.RS_CHUNK,L1=(window.RS_PACKS||{})[window.RS_L1CODE]||null,KO=(L1&&L1.chunks)||{};
/* 예전 기록에 남아 있는 한국어 활동 이름을 영어로 보여 준다 */
const LEG={'듣기 도장':'Listening stamp','읽기 도장':'Reading stamp','다시 세우기 도장':'Rebuild stamp','확인 문제 도장':'Check stamp','듣기 완료':'Listening done','읽기 완료':'Reading done','퀴즈 통과':'Check passed','퀴즈 만점':'Check: all correct'},why=s=>LEG[s]||String(s).replace(/^(확인 문제|퀴즈) /,'Check ');
const HUMAN=new Set((window.RS_DATA.REVIEWED||{}).human||[]);
const rvChip=id=>HUMAN.has(id)?'<span class="chip done">Human-reviewed</span>':'<span class="chip help">AI-reviewed only</span>';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- 아이콘 ---------- */
const IC={
spk:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
mic:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 11a6 6 0 0 0 12 0M12 17v4"/></svg>',
stop:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>',
ok:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
replay:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5"/></svg>',
stamp:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="#FACC15" stroke="#172554" stroke-width="1.5"/><path fill="none" stroke="#172554" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M7.5 12.4l3 3 6-6.3"/></svg>'
};

/* ---------- 단어 그림: 투명 배경, 같은 선 굵기, 글자 없음 ---------- */
const svg=n=>`<svg class="sp" viewBox="0 0 100 100" role="img" aria-label="${n}"><g stroke="#334155" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${SP[n]}</g></svg>`;
const pics=a=>`<div class="pics">${a.map(svg).join('')}</div>`;

/* ---------- 단계와 책 ---------- */
const SK={detail:'Details',vocab:'Word meaning',main:'Main idea',seq:'Order of events',infer:'Inference'};
const wc=b=>b.pages.reduce((n,p)=>n+p[0].match(/[A-Za-z']+/g).length,0);
const byId=id=>BOOKS.find(b=>b.id===id);

/* ---------- 기록 (이 기기에만 저장) ---------- */
const KEY='readstep.v1',blank=()=>({books:{},log:[],assigned:[],skills:{},name:'',secs:0,cls:{},slow:false,place:null,taps:{},stuck:[],chunk:false});
let S=blank();
try{const raw=localStorage.getItem(KEY);if(raw)S=Object.assign(blank(),JSON.parse(raw))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const rec=id=>S.books[id]||(S.books[id]={listen:false,read:false,build:false,best:-1,tries:0});
const passed=b=>{const r=S.books[b.id];return!!r&&r.best/b.quiz.length>=.8};
const bookDone=b=>{const r=S.books[b.id];return!!r&&!!r.read&&passed(b)};
/* 한 단계에서 책 NEED권을 마치면(끝까지 읽고 확인 문제 통과) 다음 단계. 자체 기준(잠정), docs/level-guide.md 8절 */
const NEED=4,needOf=n=>Math.min(NEED,BOOKS.filter(b=>b.step===n).length);
const stepDone=n=>BOOKS.filter(b=>b.step===n&&bookDone(b)).length>=needOf(n);
/* 도장: 책마다 듣기, 읽기, 다시 세우기, 확인 문제 네 개. 점수를 모으지 않고 한 일을 찍는다. */
const stamps=()=>BOOKS.reduce((n,b)=>{const r=S.books[b.id];return r?n+(r.listen?1:0)+(r.read?1:0)+(r.build?1:0)+(passed(b)?1:0):n},0);
/* 막힌 곳 기록: 어느 책 어느 쪽에서 멈췄는지(확인 문제 첫 시도 오답, 다시 세우기 실수) */
function stuck(id,p,s){S.stuck=S.stuck||[];S.stuck.unshift({id,p,s,t:Date.now()});S.stuck=S.stuck.slice(0,60);save()}
function recStep(){const top=Math.max(1,...STEPS.filter(s=>s.ready).map(s=>s.n)),start=Math.min(top,Math.max(1,(S.place&&+S.place.step)||1));let last=start;for(const st of STEPS){if(st.n<start)continue;if(!st.ready)break;last=st.n;if(!stepDone(st.n))return st.n}return last}
function drawStars(pop){const el=$('#starbox');el.innerHTML=IC.stamp+'<b>'+stamps()+'</b>';if(pop){el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}}
function gain(why,id){S.log.unshift({t:Date.now(),why,id});S.log=S.log.slice(0,40);save();drawStars(true)}
function mark(id,what){const r=rec(id);if(r[what])return;r[what]=true;gain(what==='listen'?'Listening stamp':'Reading stamp',id)}
function skill(s,c){const k=S.skills[s]||(S.skills[s]={c:0,t:0});k.t++;k.c+=c;save()}

/* ---------- 음성 ---------- */
let tok=0;
function stopSpeak(){tok++;try{speechSynthesis.cancel()}catch(e){}}
function speak(text,o={}){
  if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){return false}
  stopSpeak();const my=tok,u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=o.rate||.85;
  const v=speechSynthesis.getVoices().find(v=>/^en[-_]US/i.test(v.lang));if(v)u.voice=v;
  if(o.onword)u.onboundary=e=>{if(my===tok)o.onword(e.charIndex)};
  u.onend=()=>{if(my===tok&&o.onend)o.onend()};
  u.onerror=e=>{if(my===tok&&o.onerror)o.onerror(e.error)};
  speechSynthesis.speak(u);return true}

/* ---------- 화면 전환 ---------- */
const DRAW={};
/* 화면별 주소: #library, #teacher, #parent, #place, #book/책ID, #quiz/책ID */
function setHash(h){if(h==null)return;try{history.replaceState(null,'',h?'#'+h:location.pathname+location.search)}catch(e){}}
function go(v){stopSpeak();stopRec();
  if(R&&R.t0&&v!=='reader'){S.secs=(S.secs||0)+Math.min(600,Math.round((Date.now()-R.t0)/1000));R.t0=null;save()}
  $$('main>section').forEach(s=>s.hidden=s.id!=='v-'+v);
  $$('.nav button').forEach(b=>{const on=b.dataset.go===v||(b.dataset.go==='library'&&(v==='reader'||v==='quiz'||v==='place'||v==='build'||v==='words'));on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});
  if(DRAW[v])DRAW[v]();window.scrollTo(0,0);setHash(v==='home'?'':(v==='library'||v==='teacher'||v==='parent'||v==='words')?v:null)}

/* ---------- 서재 ---------- */
let curStep=null,curLv='',curTopic='';
/* 세부 레벨 이름: "Level 1-3 · Word Spotter" (data/levels.js) */
const lvName=b=>`Level ${b.lv||b.step} · ${STEPS[b.step-1].name}`;
const chip=(on,t)=>`<span class="chip${on?' done':''}">${on?IC.ok:''}${t}</span>`;
function bookCard(b){const r=S.books[b.id]||{},hw=S.assigned.includes(b.id);
  return `<button class="card book" data-book="${b.id}"><span class="cover${b.art?' art':''}">${b.art?`<img src="art/${b.id}-cover.webp" alt="" loading="lazy" decoding="async">`:b.cover.map(svg).join('')}</span><span class="bt" lang="en">${esc(b.title)}</span><span class="meta">Level ${esc(b.lv||String(b.step))} · ${b.type} · ${wc(b)} words</span><span class="chips">${hw?'<span class="chip hw">Homework</span>':''}${chip(r.listen,'Listen')}${chip(r.read,'Read')}${chip(r.build,'Rebuild')}${chip(passed(b),'Check')}</span></button>`}
DRAW.library=function(){const rs=recStep();if(curStep==null)curStep=rs;
  const all=BOOKS.filter(b=>b.step===curStep),done=all.filter(bookDone).length,LVS=(window.RS_DATA.LEVELS||[]).filter(l=>l.step===curStep),tps=[...new Set(all.map(b=>b.topic).filter(Boolean))].sort();
  if(curLv&&!LVS.some(l=>l.id===curLv))curLv='';if(curTopic&&!tps.includes(curTopic))curTopic='';
  const list=all.filter(b=>(!curLv||b.lv===curLv)&&(!curTopic||b.topic===curTopic)).sort((x,y)=>String(x.lv).localeCompare(String(y.lv))),need=needOf(curStep),nTap=Object.keys(S.taps||{}).length;
  const next=BOOKS.filter(b=>b.step===rs).find(b=>!bookDone(b))||BOOKS.find(b=>b.step===rs);
  const weak=Object.entries(S.skills).filter(([,k])=>k.t>=2&&k.c/k.t<.6).map(([s])=>SK[s]);
  const hw=S.assigned.map(byId).filter(Boolean);
  $('#v-library').innerHTML=`<div class="wrap">
  <div class="lhead"><div><p class="eyebrow">Students</p><h1>My Library</h1></div><div class="tools"><button class="btn ghost sm" id="sendRec">Send my record</button><button class="btn ghost sm" data-go="words">My word book${nTap?' ('+nTap+')':''}</button><button class="btn ghost sm" id="getHw">Enter homework code</button>${S.place?'<button class="btn ghost sm" data-place="1">Find my step again</button>':''}</div></div>
  <p class="mut" style="margin-top:6px">Four stamps for each book: Listen, Read, Rebuild, Check</p>
  ${S.place?'':`<div class="card reco" style="border-color:var(--line)"><div><b style="font-size:19px">New here? Find your step first</b><small style="font-size:14px">Read short texts and answer questions. There are up to ${PLACEMENT.length} texts, and it stops when they get hard.</small></div><button class="btn ghost" data-place="1">Find my step</button></div>`}
  <div class="card reco"><div><small>Today's book (picked by a simple rule: the first book in your step that you have not finished)</small><b lang="en" style="font:700 22px var(--read)">${esc(next.title)}</b> <span class="mut">· Step ${STEPS[rs-1].n} ${STEPS[rs-1].name}</span>${weak.length?`<small style="margin-top:4px">Practice more: ${weak.join(', ')}. When you read, tap words to check what they mean.</small>`:''}</div><button class="btn" data-book="${next.id}">Read it</button></div>
  ${hw.length?`<h2 class="sec" style="margin-top:20px">Homework from your teacher</h2><div class="books">${hw.map(bookCard).join('')}</div>`:''}
  <div class="steps" role="group" aria-label="Choose a step">${STEPS.map(st=>`<button data-step="${st.n}" aria-pressed="${st.n===curStep}" ${st.ready?'':'disabled'}><b>Step ${st.n} · ${st.name}${st.n===rs?' (my step)':''}</b><span>${st.desc}</span></button>`).join('')}</div>
  ${LVS.length>1?`<div class="lvbar" role="group" aria-label="Choose a level in this step"><button data-lv="" aria-pressed="${!curLv}">All levels <small>${all.length}</small></button>${LVS.map(l=>{const n=all.filter(b=>b.lv===l.id).length;return `<button data-lv="${l.id}" aria-pressed="${curLv===l.id}" ${n?'':'disabled'}>${l.id} <small>${n}</small></button>`}).join('')}${tps.length>1?`<label class="tpsel">Topic <select id="tpSel"><option value="">All topics</option>${tps.map(t=>`<option ${t===curTopic?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`:''}</div>`:''}
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px"><div class="prog" style="flex:1" role="progressbar" aria-valuemin="0" aria-valuemax="${need}" aria-valuenow="${Math.min(done,need)}" aria-label="Progress in this step"><i style="width:${need?Math.min(100,done/need*100):0}%"></i></div><span class="mut" style="font-size:14px">${done} finished · finish ${need} to move up</span></div>
  <div class="books">${list.length?list.map(bookCard).join(''):'<p class="mut">No books here yet.</p>'}</div>
  <p class="note">Finish ${need} books in a step (read to the end and pass the Check) and the next step becomes your step. You can still read the other books, and books in any step, at any time. These books are drafts written and checked by AI (books fully checked by a person: ${BOOKS.filter(x=>HUMAN.has(x.id)).length}).</p></div>`;
  $('#sendRec').onclick=sendRec;$('#getHw').onclick=getHw;const ts=$('#tpSel');if(ts)ts.onchange=()=>{curTopic=ts.value;DRAW.library();const n=$('#tpSel');if(n)n.focus()}};

/* ---------- 읽기 ---------- */
let R=null;
function openBook(id){const b=byId(id);if(!b)return;R={b,i:0,seen:new Set([0]),heard:new Set(),fx:true,auto:false,t0:Date.now()};go('reader');drawReader();setHash('book/'+id)}
function wordsHtml(text,b,fx,ck){const st=ck&&CH?CH.starts(text):null;let out='',re=/[A-Za-z']+/g,m,last=0;
  while((m=re.exec(text))){let gap=text.slice(last,m.index);
    /* 끊는 표시는 여는 따옴표 앞에 둔다 */
    if(st&&st.has(m.index)){const q=/["\u201C]$/.test(gap)?gap.slice(-1):'';out+=esc(q?gap.slice(0,-1):gap)+'<span class="slash" aria-hidden="true">/</span> '+esc(q)}else out+=esc(gap);
    const w=m[0],lw=w.toLowerCase();let inner=esc(w);
    if(fx&&b.focus&&b.focus.words.includes(lw)){const k=lw.indexOf(b.focus.letter),n=b.focus.letter.length;if(k>=0)inner=esc(w.slice(0,k))+'<span class="fx">'+esc(w.slice(k,k+n))+'</span>'+esc(w.slice(k+n))}
    out+=`<span class="w" role="button" tabindex="0" data-i="${m.index}" data-w="${lw}">${inner}</span>`;last=m.index+w.length}
  return out+esc(text.slice(last))}
function drawReader(keep){const {b,i}=R,[text,pp]=b.pages[i],n=b.pages.length,last=i===n-1;let ch='';for(let k=i;k>=0;k--)if(b.pages[k][2]){ch=b.pages[k][2];break}
  $('#v-reader').innerHTML=`<div class="wrap narrow">
  <div class="rhead"><button class="btn ghost sm" data-go="library">← Library</button><div><h1 class="rt" lang="en">${esc(b.title)}</h1><p class="mut">${lvName(b)}${HUMAN.has(b.id)?'':' · AI-reviewed only'}</p></div><span class="pg" aria-label="Page ${i+1} of ${n}">${i+1} / ${n}</span></div>
  <div class="dots" aria-hidden="true">${b.pages.map((_,k)=>`<i class="${k===i?'on':R.seen.has(k)?'seen':''}"></i>`).join('')}</div>
  ${ch?'<p class="ch" lang="en">'+esc(ch)+'</p>':''}${pics(pp)}
  <p class="rtext${text.length>70?' long':''}" lang="en" id="rtext">${wordsHtml(text,b,R.fx,S.chunk)}</p>
  ${S.chunk&&S.chunkKo&&KO[b.id]?`<div class="dk" role="group" aria-label="Chunk meanings">${CH.lines(text).map(c=>`<span class="dkp"><span lang="en">${esc(c.t)}</span><small>${esc(KO[b.id][c.k]||'')}</small></span>`).join('')}</div><p class="mut" style="font-size:13px;margin:-6px 0 10px">Chunk meanings are an AI draft.</p>`:''}
  <p class="gloss" id="gloss" aria-live="polite">Tap a word to hear it and see what it means.</p>
  <div class="rctl"><button class="btn ghost" id="prev" ${i?'':'disabled'}>◀ Back</button><button class="btn" id="listen">${IC.spk} Listen</button><button class="btn ghost" id="rec">${IC.mic} Record</button>${last?'<button class="btn" id="tobuild">Rebuild ▶</button>':'<button class="btn ghost" id="next">Next ▶</button>'}</div>
  <div id="recout" aria-live="polite"></div>
  <div class="ropt"><label class="tog"><input type="checkbox" id="auto" ${R.auto?'checked':''}> Play all pages</label><label class="tog"><input type="checkbox" id="slow" ${S.slow?'checked':''}> Slow</label><label class="tog"><input type="checkbox" id="ck" ${S.chunk?'checked':''}> Chunk reading <span class="mut">(a / between meaning chunks)</span></label>${S.chunk&&KO[b.id]?`<label class="tog"><input type="checkbox" id="ckko" ${S.chunkKo?'checked':''}> Chunk meanings <span class="mut">(${esc(L1.name)}, pilot)</span></label>`:''}${b.focus?`<label class="tog"><input type="checkbox" id="fx" ${R.fx?'checked':''}> Show sound letters <span class="mut">(${esc(b.focus.label)}: purple underline)</span></label>`:''}</div></div>`;
  $('#prev').onclick=()=>turn(-1);if($('#next'))$('#next').onclick=()=>turn(1);
  $('#listen').onclick=listenPage;$('#rec').onclick=toggleRec;
  if($('#tobuild'))$('#tobuild').onclick=()=>startBuild(b);
  $('#ck').onchange=e=>{S.chunk=e.target.checked;save();drawReader('ck')};
  if($('#ckko'))$('#ckko').onchange=e=>{S.chunkKo=e.target.checked;save();drawReader('ckko')};
  if($('#fx'))$('#fx').onchange=e=>{R.fx=e.target.checked;drawReader('fx')};
  $('#auto').onchange=e=>{R.auto=e.target.checked};$('#slow').onchange=e=>{S.slow=e.target.checked;save()};
  if(keep){const el=$('#'+keep)||$('#tobuild')||$('#listen');if(el)el.focus()}}
function turn(d){const n=R.b.pages.length,j=R.i+d;if(j<0||j>=n)return;stopSpeak();stopRec();R.i=j;R.seen.add(j);if(R.seen.size===n)mark(R.b.id,'read');drawReader(d>0?'next':'prev')}
function heard(i){R.heard.add(i);if(R.heard.size===R.b.pages.length)mark(R.b.id,'listen')}
function listenPage(){const i=R.i,text=R.b.pages[i][0],spans=$$('#rtext .w'),btn=$('#listen'),t0=Date.now();
  const clear=()=>{spans.forEach(s=>s.classList.remove('now'));if(btn.isConnected)btn.removeAttribute('aria-pressed')};
  const ok=speak(text,{onword:ci=>{let cur=null;for(const s of spans)if(+s.dataset.i<=ci)cur=s;spans.forEach(s=>s.classList.toggle('now',s===cur))},rate:S.slow?.62:.85,onerror:()=>{clear();const g=$('#gloss');if(g)g.textContent='The sound did not play. Tap the screen once, then tap "Listen" again.'},onend:()=>{clear();if(Date.now()-t0<250&&text.length>8){const g=$('#gloss');if(g)g.textContent='This device did not play the English voice. Please check the sound settings.';return}heard(i);if(R.auto&&R.i===i&&i<R.b.pages.length-1){turn(1);listenPage()}}});
  if(ok)btn.setAttribute('aria-pressed','true');else{$('#gloss').textContent='This browser cannot read aloud.';heard(i)}}
function tapWord(el){const w=el.dataset.w,k=G[w];speak(w,{rate:.75});if(el.closest('#v-reader')){S.taps=S.taps||{};S.taps[w]=(S.taps[w]||0)+1;save()}const g=$('#gloss');if(g)g.innerHTML=`<b lang="en">${esc(w)}</b>${k?' · '+esc(k):''}${L1&&L1.words&&L1.words[w]?' · <span lang="'+esc(L1.code)+'">'+esc(L1.words[w])+'</span>':''}`}
let mr=null;
function stopRec(){if(mr&&mr.state==='recording')mr.stop()}
async function toggleRec(){const btn=$('#rec'),out=$('#recout');if(mr&&mr.state==='recording'){mr.stop();return}
  try{const st=await navigator.mediaDevices.getUserMedia({audio:true}),chunks=[];mr=new MediaRecorder(st);
    mr.ondataavailable=e=>chunks.push(e.data);
    mr.onstop=()=>{st.getTracks().forEach(t=>t.stop());if(!btn.isConnected)return;out.innerHTML='<p class="mut">Listen to your voice. The recording stays on this device.</p><audio controls src="'+URL.createObjectURL(new Blob(chunks,{type:mr.mimeType}))+'"></audio>';btn.innerHTML=IC.mic+' Record';btn.removeAttribute('aria-pressed')};
    mr.start();btn.innerHTML=IC.stop+' Stop recording';btn.setAttribute('aria-pressed','true')}
  catch(e){out.innerHTML='<p class="mut">The microphone is not available. Please allow the microphone in your browser.</p>'}}

/* ---------- 확인 문제: 선택 전에는 모든 보기가 같은 모양 ---------- */
let Q=null;
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function startQuiz(b){Q={b,i:0,score:0,first:true,pick:null};go('quiz');drawQuiz();setHash('quiz/'+b.id)}
function drawQuiz(){const {b,i}=Q,q=b.quiz[i],n=b.quiz.length,lg='en';Q.first=true;Q.pick=null;
  $('#v-quiz').innerHTML=`<div class="wrap narrow">
  <div class="rhead"><button class="btn ghost sm" data-book="${b.id}">← Book</button><div><h1 class="rt">Check · <span lang="en">${esc(b.title)}</span></h1><p class="mut">${SK[q.s]} question</p></div><span class="pg" aria-label="Question ${i+1} of ${n}">${i+1} / ${n}</span></div>
  <div class="dots" aria-hidden="true">${b.quiz.map((_,k)=>`<i class="${k===i?'on':k<i?'seen':''}"></i>`).join('')}</div>
  <div class="card qcard"><div class="qrow"><p class="qq" lang="${lg}" id="qq">${esc(q.q)}</p><button class="icon" id="qsay" aria-label="Listen to the question">${IC.spk}</button></div>
  <div class="opts" role="radiogroup" aria-labelledby="qq">${shuf(q.o.map((o,k)=>k)).map(k=>`<button class="opt" role="radio" aria-checked="false" data-k="${k}" lang="${lg}"><span class="mk" aria-hidden="true"></span><span>${esc(q.o[k])}</span></button>`).join('')}</div>
  <div class="fb" id="fb" aria-live="polite"></div>
  <div class="rctl" style="justify-content:flex-end"><button class="btn" id="check" disabled>Check</button></div></div></div>`;
  $('#qsay').onclick=()=>speak(q.w||q.q,{rate:.8});$('#check').onclick=check}
function pick(el){if(el.disabled)return;Q.pick=+el.dataset.k;$$('#v-quiz .opt').forEach(o=>o.setAttribute('aria-checked',o===el?'true':'false'));const c=$('#check');if(c)c.disabled=false}
function check(){const {b,i}=Q,q=b.quiz[i],k=Q.pick,opts=$$('#v-quiz .opt').sort((x,y)=>x.dataset.k-y.dataset.k),fb=$('#fb');if(k==null)return;
  const reveal=()=>{opts.forEach(o=>o.disabled=true);opts[q.a].classList.add('ok');opts[q.a].querySelector('.mk').innerHTML=IC.ok;
    const last=i===b.quiz.length-1,c=$('#check');c.disabled=false;c.textContent=last?'See result':'Next question ▶';c.onclick=()=>{if(last)finishQuiz();else{Q.i++;drawQuiz();$('#qsay').focus()}};c.focus()};
  if(k===q.a){if(Q.first){Q.score++;skill(q.s,1)}fb.className='fb ok';fb.innerHTML=IC.ok+' Well done!';reveal()}
  else if(Q.first){Q.first=false;skill(q.s,0);stuck(b.id,q.p,q.s);opts[k].classList.add('no');opts[k].disabled=true;opts[k].setAttribute('aria-checked','false');Q.pick=null;$('#check').disabled=true;
    fb.className='fb no';fb.innerHTML=`${IC.replay} Listen again? <button class="btn ghost sm" id="rehear">${IC.spk} Listen to page ${q.p} again</button>`;
    $('#rehear').onclick=()=>speak(b.pages[q.p-1][0])}
  else{opts[k].classList.add('no');fb.className='fb no';fb.innerHTML=IC.replay+' The green one is the answer. Read page '+q.p+' in the book again.';reveal()}}
function finishQuiz(){const {b,score}=Q,n=b.quiz.length,r=rec(b.id),was=r.best,pass=score/n>=.8,lvWas=stepDone(b.step);r.tries++;if(score>r.best)r.best=score;
  S.log.unshift({t:Date.now(),why:'Check '+score+'/'+n,id:b.id,n:0});save();
  let got=0;if(pass&&was/n<.8){gain('Check stamp',b.id);got=1}
  const lv=stepDone(b.step)&&!lvWas,nx=STEPS[b.step];
  $('#v-quiz').innerHTML=`<div class="wrap narrow"><div class="card result"><h1 class="rt">Check result · <span lang="en">${esc(b.title)}</span></h1>
  <p class="num">${score} / ${n}</p>
  ${pass?`<p class="badge pass">${IC.stamp} Passed!${got?' You got a stamp.':''}</p>`:`<p class="badge again">${IC.replay} Read it once more and try again (4 or more correct to pass)</p>`}
  ${lv?`<p style="font-weight:700;color:var(--ok)">${IC.ok} You finished ${needOf(b.step)} books in Step ${b.step}.${nx&&nx.ready?' Now Step '+nx.n+' is your step.':''}</p>`:''}
  <div class="rctl"><button class="btn ghost" data-book="${b.id}">Read the book again</button><button class="btn ghost" id="again">Try again</button><button class="btn" data-go="library" id="tolib">To the library</button></div></div></div>`;
  $('#again').onclick=()=>startQuiz(b);curStep=null;$('#tolib').focus()}

/* ---------- 다시 세우기: 읽은 문장을 뜻 덩어리로 다시 세운다 ---------- */
let B=null;
function startBuild(b){const list=CH?CH.pick(b):[];if(!list.length){startQuiz(b);return}B={b,list,i:0,firstOk:0};go('build');setHash('build/'+b.id);loadBuild()}
function loadBuild(){const it=B.list[B.i];B.tries=0;B.state='play';B.placed=[];B.pool=shuf(it.units.map(t=>({t})));
  if(B.pool.map(u=>u.t).join('|')===it.units.join('|'))B.pool.reverse();drawBuild()}
function drawBuild(msg,cls,focus){const {b,i,list}=B,it=list[i],end=B.state!=='play',last=i===list.length-1;
  $('#v-build').innerHTML=`<div class="wrap narrow">
  <div class="rhead"><button class="btn ghost sm" data-book="${b.id}">← Book</button><div><h1 class="rt">Rebuild · <span lang="en">${esc(b.title)}</span></h1><p class="mut">Tap the pieces in order to rebuild the sentence from page ${it.page}.</p></div><span class="pg" aria-label="Sentence ${i+1} of ${list.length}">${i+1} / ${list.length}</span></div>
  <div class="dots" aria-hidden="true">${list.map((_,k)=>`<i class="${k===i?'on':k<i?'seen':''}"></i>`).join('')}</div>
  ${pics(it.pics)}
  <div class="card qcard" style="margin-top:14px"><p class="blab" id="bl">My sentence</p>
  <div class="line" role="group" aria-labelledby="bl" lang="en">${B.placed.map((u,k)=>`<button class="unit on" data-out="${k}" ${end?'disabled':''}>${esc(u.t)}</button>`).join('')||'<span class="mut">Choose pieces below</span>'}${B.placed.length===it.units.length?`<span class="endp">${esc(it.end)}</span>`:''}</div>
  <p class="blab" id="bp">Pieces</p>
  <div class="tray" role="group" aria-labelledby="bp" lang="en">${B.pool.map((u,k)=>`<button class="unit" data-in="${k}">${esc(u.t)}</button>`).join('')||'<span class="mut">'+(end?'':'All pieces are up. Tap Check.')+'</span>'}</div>
  <div class="fb ${cls||''}" id="bfb" aria-live="polite">${msg||''}</div>
  <div class="rctl" style="justify-content:flex-end"><button class="btn ghost" id="bsay">${IC.spk} Listen to the sentence</button><button class="btn" id="bcheck" ${!end&&B.pool.length?'disabled':''}>${end?(last?'Finish':'Next sentence ▶'):'Check'}</button></div></div></div>`;
  $('#bsay').onclick=()=>speak(it.units.join(' '),{rate:S.slow?.62:.8});
  const c=$('#bcheck');c.onclick=end?()=>{if(last)finishBuild();else{B.i++;loadBuild();const f=$('#v-build .tray .unit');if(f)f.focus()}}:checkBuild;
  const f=focus==='check'?c:focus==='tray'?($('#v-build .tray .unit')||c):null;if(f)f.focus()}
function moveUnit(k,toLine){if(!B||B.state!=='play')return;if(toLine)B.placed.push(...B.pool.splice(k,1));else B.pool.push(...B.placed.splice(k,1));drawBuild('','',B.pool.length?'tray':'check')}
function checkBuild(){const it=B.list[B.i];if(B.pool.length)return;B.tries++;
  if(B.placed.map(u=>u.t).join('|')===it.units.join('|')){if(B.tries===1)B.firstOk++;B.state='ok';drawBuild(IC.ok+' Well done!','ok','check');return}
  if(B.tries===1)stuck(B.b.id,it.page,'build');
  if(B.tries>=3){B.state='shown';B.placed=it.units.map(t=>({t}));B.pool=[];drawBuild(IC.replay+' This is how the book says it. Read it aloud once.','no','check');return}
  let k=0;while(k<B.placed.length&&B.placed[k].t===it.units[k])k++;B.pool.push(...B.placed.splice(k));
  drawBuild(IC.replay+(k?' The order is not the same as in the book. The pieces that match from the start are still there.':' The order is not the same as in the book. Start again from the first piece.'),'no','tray')}
function finishBuild(){const {b,list,firstOk}=B,r=rec(b.id),first=!r.build;r.build=true;if(first)gain('Rebuild stamp',b.id);else save();
  $('#v-build').innerHTML=`<div class="wrap narrow"><div class="card result"><h1 class="rt">Rebuild · <span lang="en">${esc(b.title)}</span></h1><p class="num">${list.length} sentences</p><p class="badge pass">${IC.stamp} All rebuilt!${first?' You got a stamp.':''}</p><p class="mut">Right on the first try: ${firstOk}</p><div class="rctl"><button class="btn ghost" data-book="${b.id}">Read the book again</button><button class="btn ghost" data-go="library">To the library</button><button class="btn" id="bquiz">Go to the Check ▶</button></div></div></div>`;
  $('#bquiz').onclick=()=>startQuiz(b);$('#bquiz').focus()}

/* ---------- 내 낱말장: 읽다가 눌러 본 낱말이 모인다 ---------- */
const W={hide:false,shown:new Set()};
/* 낱말 뜻: 영어 풀이, 그리고 선택 언어 묶음이 있으면 그 말의 뜻 */
const gl=w=>esc(G[w]||'')+(L1&&L1.words&&L1.words[w]?' · <span lang="'+esc(L1.code)+'">'+esc(L1.words[w])+'</span>':'');
DRAW.words=function(){const list=Object.entries(S.taps||{}).sort((a,b)=>b[1]-a[1]);
  $('#v-words').innerHTML=`<div class="wrap narrow"><div class="rhead"><button class="btn ghost sm" data-go="library">← Library</button><div><h1 class="rt">My word book</h1><p class="mut">Words you tapped while reading are here. The words you tapped most come first.</p></div></div>
  ${list.length?`<label class="tog" style="justify-content:flex-start;margin:0 0 12px"><input type="checkbox" id="hideKo" ${W.hide?'checked':''}> Hide the meanings and guess</label>
  <div class="card tablebox"><table><thead><tr><th scope="col">Word</th><th scope="col">Meaning</th><th scope="col">Taps</th></tr></thead><tbody>${list.map(([w,n])=>`<tr><td><button class="wbtn" data-say="${esc(w)}" lang="en" aria-label="Listen to ${esc(w)}">${esc(w)}</button></td><td>${G[w]?(W.hide&&!W.shown.has(w)?`<button class="btn ghost sm" data-show="${esc(w)}">Show meaning</button>`:gl(w)):'<span class="mut">No meaning yet</span>'}</td><td>${n}</td></tr>`).join('')}</tbody></table></div>`:'<div class="card"><p class="mut">No words yet. While you read, tap a word you do not know.</p></div>'}</div>`;
  if($('#hideKo'))$('#hideKo').onchange=e=>{W.hide=e.target.checked;W.shown.clear();DRAW.words();$('#hideKo').focus()}};
function showKo(el){const w=el.dataset.show;W.shown.add(w);el.parentNode.innerHTML=gl(w)}

/* ---------- 어디서 막히는지: 점수가 아니라 읽는 동안의 행동으로 본다 ---------- */
function evidence(){const tw=Object.entries(S.taps||{}).sort((a,b)=>b[1]-a[1]).slice(0,8),pg={};(S.stuck||[]).forEach(x=>{const k=x.id+'|'+x.p;pg[k]=(pg[k]||0)+1});
  return{tw,tp:Object.entries(pg).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,n])=>{const [id,p]=k.split('|');return{id,p:+p,n}}).filter(x=>byId(x.id))}}
function evHtml(){const e=evidence();
  return `<h2 style="font-size:20px;margin-bottom:6px">Where reading gets hard</h2><p class="mut" style="font-size:14px">This comes from what the learner does while reading, not from scores. It is the record on this device.</p>
  <h3 style="font-size:16px;margin:12px 0 4px">Words tapped most</h3>${e.tw.length?`<p>${e.tw.map(([w,n])=>`<b lang="en" style="font-family:var(--read)">${esc(w)}</b> ×${n}`).join(' · ')}</p>`:'<p class="mut">Nothing yet.</p>'}
  <h3 style="font-size:16px;margin:12px 0 4px">Pages to look at again</h3>${e.tp.length?`<ul class="list">${e.tp.map(x=>`<li><span lang="en">${esc(byId(x.id).title)}</span> · page ${x.p} · stuck ${x.n} time${x.n>1?'s':''}</li>`).join('')}</ul>`:'<p class="mut">Nothing yet.</p>'}`}

/* ---------- 단계 진단: 쉬운 글부터 읽고, 두 문제를 모두 맞히면 다음 단계 글로 넘어간다 ---------- */
let P=null;
function startPlace(){if(!PLACEMENT.length)return;P={s:0,q:0,ok:0,pick:null,n:0};go('place');drawPlace();setHash('place')}
function drawPlace(){const it=PLACEMENT[P.s],q=it.q[P.q];P.pick=null;P.n++;
  $('#v-place').innerHTML=`<div class="wrap narrow">
  <div class="rhead"><button class="btn ghost sm" data-go="library">← Library</button><div><h1 class="rt">Find my step</h1><p class="mut">Read the text and choose the best answer. It is okay to be wrong.</p></div><span class="pg" aria-label="Question ${P.n}">Q${P.n}</span></div>
  <div class="card qcard"><p class="ptext" lang="en">${esc(it.text)}</p></div>
  <div class="card qcard" style="margin-top:14px"><p class="qq" lang="en" id="pq">${esc(q.q)}</p>
  <div class="opts" role="radiogroup" aria-labelledby="pq">${shuf(q.o.map((o,k)=>k)).map(k=>`<button class="opt popt" role="radio" aria-checked="false" data-k="${k}" lang="en"><span class="mk" aria-hidden="true"></span><span>${esc(q.o[k])}</span></button>`).join('')}</div>
  <div class="rctl" style="justify-content:flex-end"><button class="btn" id="pnext" disabled>Next ▶</button></div></div></div>`;
  $('#pnext').onclick=()=>{if(P.pick==null)return;if(P.pick===q.a)P.ok++;
    if(P.q===0){P.q=1;drawPlace();return}
    if(P.ok===2&&P.s<PLACEMENT.length-1){P.s++;P.q=0;P.ok=0;drawPlace()}else endPlace(it.step)}}
function ppick(el){P.pick=+el.dataset.k;$$('#v-place .opt').forEach(o=>o.setAttribute('aria-checked',o===el?'true':'false'));$('#pnext').disabled=false}
function endPlace(step){S.place={step,t:Date.now()};save();curStep=null;const st=STEPS[step-1];
  $('#v-place').innerHTML=`<div class="wrap narrow"><div class="card result"><h1 class="rt">Your suggested step</h1><p class="num">Step ${st.n}</p><p style="font-weight:700;font-size:19px">${st.name}</p><p class="mut" style="margin:6px 0 4px">${st.desc}</p><p class="mut">This is a first guess from a few short texts. If it is too easy or too hard, read books in another step or try again.</p><div class="rctl"><button class="btn ghost" data-place="1">Try again</button><button class="btn" data-go="library" id="pdone">See Step ${st.n} books</button></div></div></div>`;
  $('#pdone').focus()}

/* ---------- 선생님 ---------- */
const DEMO=[['Student A',1,3,87,42],['Student B',2,5,80,58],['Student C',1,2,60,21],['Student D',3,8,93,95],['Student E',2,4,73,40],['Student F',1,1,100,12],['Student G',2,6,67,66],['Student H',3,7,90,81]];
function myStats(){const read=BOOKS.filter(b=>(S.books[b.id]||{}).read),qs=BOOKS.filter(b=>(S.books[b.id]||{}).best>=0);
  const avg=qs.length?Math.round(qs.reduce((n,b)=>n+S.books[b.id].best/b.quiz.length,0)/qs.length*100):null;
  const words=new Set();read.forEach(b=>b.pages.forEach(p=>p[0].toLowerCase().match(/[a-z']+/g).forEach(w=>words.add(w))));
  return{read:read.length,avg,words:words.size}}
DRAW.teacher=function(){const me=myStats(),real=Object.values(S.cls||{}).map(clsRow),demo=!real.length,rows=demo?DEMO.map(d=>({n:d[0],st:d[1],rd:d[2],av:d[3],mn:d[4]})):real;
  const total=rows.reduce((n,r)=>n+r.rd,0)+me.read,avgs=rows.map(r=>r.av).concat(me.avg).filter(x=>x!=null),avg=avgs.length?Math.round(avgs.reduce((a,b)=>a+b,0)/avgs.length):null;
  $('#v-teacher').innerHTML=`<div class="wrap">
  <div class="thead"><p class="eyebrow">Teachers</p><h1>Class reading overview</h1><p class="mut">${demo?'No student records have been imported yet, so sample data (Students A to H) is shown. Only the blue row is the real record on this device.':'These are real records from the record codes that students sent. The blue row is the record on this device.'}</p><div class="tools" style="margin-top:12px"><button class="btn sm" id="addRec">Import student records</button><button class="btn ghost sm" id="mkHw">Make a homework code</button></div></div>
  <div class="tiles"><div class="card"><p class="num">${rows.length+1}</p><small>Students (${demo?'8 samples':rows.length+' imported'} + 1 on this device)</small></div><div class="card"><p class="num">${total}</p><small>Books read in total</small></div><div class="card"><p class="num">${avg==null?'-':avg+'%'}</p><small>Check average</small></div><div class="card"><p class="num">${S.assigned.length}</p><small>Homework set</small></div></div>
  <div class="card tablebox"><table><caption class="skip">Reading by student</caption><thead><tr><th scope="col">Student</th><th scope="col">Step</th><th scope="col">Books read</th><th scope="col">Check average</th><th scope="col">Reading time</th><th scope="col">Notes</th></tr></thead><tbody>
  <tr class="me"><td>Learner on this device</td><td>Step ${recStep()}</td><td>${me.read}</td><td>${me.avg==null?'No record':me.avg+'%'}</td><td>${Math.round((S.secs||0)/60)} min</td><td>${me.avg!=null&&me.avg<70?`<span class="chip help">${IC.replay}Needs help</span>`:''}</td></tr>
  ${rows.map(r=>`<tr><td>${esc(r.n)}${r.t?'<br><span class="mut" style="font-size:12px">Record: '+fmtD(r.t)+'</span>':''}${r.tw&&r.tw.length?'<br><span class="mut" style="font-size:12px">Words tapped most: <span lang="en">'+esc(r.tw.join(', '))+'</span></span>':''}</td><td>Step ${r.st}</td><td>${r.rd}</td><td>${r.av==null?'No record':r.av+'%'}</td><td>${r.mn} min</td><td>${r.real?'<button class="btn ghost sm" data-del="'+esc(r.n)+'">Remove</button> ':''}${r.av!=null&&r.av<70?`<span class="chip help">${IC.replay}Needs help</span>`:''}</td></tr>`).join('')}</tbody></table></div>
  <div class="two" style="margin-top:16px"><div class="card"><h2 style="font-size:20px;margin-bottom:12px">Correct answers by question type (this device)</h2><div class="skills">${Object.entries(SK).map(([s,l])=>{const k=S.skills[s];const p=k&&k.t?Math.round(k.c/k.t*100):0;return `<div><span>${l}</span><span class="prog" role="img" aria-label="${l} ${k&&k.t?p+'%':'No record'}"><i style="width:${p}%"></i></span><span>${k&&k.t?p+'% ('+k.c+'/'+k.t+')':'No record'}</span></div>`}).join('')}</div><p class="note">Only answers that are right on the first try are counted.</p></div>
  <div class="card">${evHtml()}</div>
  <div class="card"><h2 style="font-size:20px;margin-bottom:8px">Good to know</h2><ul class="list"><li>Students with a Check average below 70% get a "Needs help" mark. 70% is a temporary value and can be changed.</li><li>Books you set as homework appear at the top of the student's library.</li><li>The "Review" column in the book table shows whether a person has checked the whole book. Right now it is ${BOOKS.filter(b=>HUMAN.has(b.id)).length} of ${BOOKS.length} books.</li><li>The pass mark (4 of 5 questions), moving up (4 books in a step), the step levels and the step-finder rule are temporary rules that this service set for itself.</li><li>Rebuild sentences and chunk marks are made by a rule. No person has edited them.</li><li>There is no server. A student makes a code with "Send my record", and you paste it into "Import student records". Importing the same name again replaces the old record.</li><li>Reading time is the time a book is open, counted up to 10 minutes at a time (a temporary rule so that time away is not counted).</li></ul></div></div>
  <h2 class="sec">Books</h2>
  <div class="card tablebox"><table><thead><tr><th scope="col">Book</th><th scope="col">Level</th><th scope="col">Words</th><th scope="col">Focus</th><th scope="col">Review</th><th scope="col">Actions</th></tr></thead><tbody>
  ${BOOKS.map(b=>{const on=S.assigned.includes(b.id);return `<tr><td><b lang="en" style="font-family:var(--read)">${esc(b.title)}</b></td><td>${esc(b.lv||String(b.step))}</td><td>${wc(b)}</td><td>${b.focus?esc(b.focus.label):b.type}</td><td>${rvChip(b.id)}</td><td><button class="btn sm ${on?'':'ghost'}" data-assign="${b.id}" aria-pressed="${on}">${on?'Remove homework':'Set as homework'}</button><button class="btn sm ghost" data-plan="${b.id}">Lesson plan</button><button class="btn sm ghost" data-print="${b.id}">Print book</button><button class="btn sm ghost" data-key="${b.id}">Answer key</button></td></tr>`}).join('')}</tbody></table></div></div>`;
  $('#addRec').onclick=addRec;$('#mkHw').onclick=mkHw};
function plan(id){const b=byId(id),words=[...new Set(b.pages.flatMap(p=>p[0].toLowerCase().match(/[a-z']+/g)))].filter(w=>G[w]).slice(0,8);
  $('#dlgBody').innerHTML=`<h2 id="dlgT">Lesson plan · <span lang="en">${esc(b.title)}</span></h2><p class="mut">${lvName(b)} · ${wc(b)} words · Times are suggestions and can be changed. This book ${HUMAN.has(b.id)?'has been checked by a person':'has only been checked by AI, not yet by a person'}.</p>
  <h3>Before reading (about 5 min)</h3><ul class="list"><li>Look at the cover pictures and say what the book may be about.</li><li>Key words: ${words.map(w=>`<b>${w}</b> (${esc(G[w])})`).join('; ')}</li></ul>
  <h3>While reading (about 10 min)</h3><ul class="list"><li>Listen to the whole book once.</li><li>Listen to one page at a time and read after it.</li>${b.focus?`<li>Find the words with the ${esc(b.focus.label)}: <span lang="en">${b.focus.words.join(', ')}</span></li>`:'<li>Tap new words to check what they mean, and make a note of them.</li>'}</ul>
  <h3>After reading (about 10 min)</h3><ul class="list">${b.quiz.filter(q=>q.s!=='vocab').slice(0,3).map(q=>`<li lang="en">${esc(q.q)}</li>`).join('')}<li>Mix up sentence cards and put them back in the order of the book.</li></ul>`;
  $('#dlg').showModal()}
/* 종이 책과 정답표의 보기 순서: 책 id와 문항 번호로 정해지는 순서(정답이 늘 (1)에 오지 않게). 앱 안 퀴즈는 따로 매번 섞음 */
function ord(b,qi){let h=2166136261;for(const c of b.id+'#'+qi){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}const a=b.quiz[qi].o.map((_,k)=>k);for(let i=a.length-1;i>0;i--){h=Math.imul(h^(h>>>15),2246822507)>>>0;const j=h%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function printBook(id){const b=byId(id);
  $('#print').innerHTML=`<h1 lang="en">${esc(b.title)}</h1><p>${lvName(b)} · Name: ____________</p><p style="font-size:12px">ReadStep prototype · ${HUMAN.has(b.id)?'Checked by a person':'Draft, checked by AI only'}</p><div class="pp">${b.pages.map((p,k)=>`<div>${p[2]?'<b lang="en">'+esc(p[2])+'</b>':''}${pics(p[1])}<p lang="en">${esc(p[0])}</p><small>${k+1}</small></div>`).join('')}</div><div class="pq"><h2>Read and answer</h2><ol>${b.quiz.map((q,qi)=>`<li><span lang="en">${esc(q.q)}</span><br>${ord(b,qi).map((o,k)=>'('+(k+1)+') '+esc(q.o[o])).join('&nbsp;&nbsp;&nbsp;')}</li>`).join('')}</ol></div>`;
  window.print()}
/* 정답표: 교사와 학부모용. 서버가 없어 완전히 숨길 수는 없고, 어른 확인(곱셈 문제)을 거쳐 보여 줌. 한 번 통과하면 이 탭을 닫을 때까지 다시 묻지 않음 */
function adult(next){try{if(sessionStorage.getItem('readstep.adult')==='1')return next()}catch(e){}
  const x=6+Math.floor(Math.random()*4),y=6+Math.floor(Math.random()*4);
  dlg(`<h2 id="dlgT">For grown-ups</h2><p class="mut">Answer keys are for teachers and parents. Please answer this question to continue.</p><p><label for="adIn">What is ${x} × ${y}?</label> <input id="adIn" inputmode="numeric" autocomplete="off" style="width:6em"> <button class="btn sm" id="adGo">Continue</button></p><p id="adMsg" class="mut" role="status"></p>`);
  const go2=()=>{if(+$('#adIn').value===x*y){try{sessionStorage.setItem('readstep.adult','1')}catch(e){}next()}else{$('#adMsg').textContent='That is not right. Please try again.';$('#adIn').value='';$('#adIn').focus()}};
  $('#adGo').onclick=go2;$('#adIn').onkeydown=e=>{if(e.key==='Enter')go2()};$('#adIn').focus()}
function keyHtml(b){return `<table><thead><tr><th scope="col">No.</th><th scope="col">Question</th><th scope="col">Answer</th><th scope="col">Page</th><th scope="col">Skill</th></tr></thead><tbody>${b.quiz.map((q,qi)=>{const n=ord(b,qi).indexOf(q.a)+1;return `<tr><td>${qi+1}</td><td lang="en">${esc(q.q)}</td><td lang="en"><b>(${n}) ${esc(q.o[q.a])}</b></td><td>${q.p||''}</td><td>${esc(SK[q.s]||q.s||'')}</td></tr>`}).join('')}</tbody></table>`}
function ansKey(id){const b=byId(id);if(!b)return;adult(()=>{
  dlg(`<h2 id="dlgT">Answer key · <span lang="en">${esc(b.title)}</span></h2><p class="mut">${lvName(b)} · The numbers (1) (2) (3) match the printed book. In the app, the choices are mixed up each time, so check the answer words. "Page" is where the answer is in the book.</p><div class="tablebox">${keyHtml(b)}</div><p style="margin-top:12px"><button class="btn sm ghost" id="akPrint">Print answer key</button></p>`);
  $('#akPrint').onclick=()=>{$('#print').innerHTML=`<h1 lang="en">${esc(b.title)} · Answer key</h1><p>${lvName(b)} · For teachers and parents</p>${keyHtml(b)}`;window.print()}})}

/* ---------- 기록 코드와 숙제 코드: 서버 없이 기기 사이에 전달 ---------- */
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const dec=s=>JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))));
const fmtD=t=>new Date(t).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
function clsRow(p){const bs=Object.entries(p.b||{}).map(([id,r])=>[byId(id),r]).filter(x=>x[0]&&Array.isArray(x[1])),q=bs.filter(x=>x[1][2]>=0);
  return{n:String(p.n),st:Math.min(6,Math.max(1,+p.st||1)),rd:bs.filter(x=>x[1][1]).length,av:q.length?Math.round(q.reduce((n,x)=>n+Math.min(1,x[1][2]/x[0].quiz.length),0)/q.length*100):null,mn:Math.round((+p.sec||0)/60),t:+p.t||0,real:true,tw:(Array.isArray(p.w)?p.w:[]).slice(0,3).map(x=>String(Array.isArray(x)?x[0]:x).slice(0,20))}}
function dlg(html){$('#dlgBody').innerHTML=html;const d=$('#dlg');if(!d.open)d.showModal()}
function copyBtn(){const b=$('#copy');if(!b)return;b.onclick=async()=>{const t=$('#codeOut'),m=$('#cmsg');try{await navigator.clipboard.writeText(t.value);m.textContent='Copied.'}catch(e){t.focus();t.select();m.textContent='The code is selected. Press Ctrl+C to copy.'}}}
function recCode(){return'RS1.'+enc({n:S.name||'No name',st:recStep(),s:stamps(),w:evidence().tw,k:evidence().tp.map(x=>[x.id,x.p,x.n]),sec:S.secs||0,pl:S.place?S.place.step:0,b:Object.fromEntries(Object.entries(S.books).map(([id,r])=>[id,[+!!r.listen,+!!r.read,r.best,r.tries,+!!r.build]])),t:Date.now()})}
function sendRec(){dlg(`<h2 id="dlgT">Send my record</h2><p class="mut">Type your name and a record code is made. Copy the code and send it to your teacher. You can use a nickname.</p><h3><label for="nm">Name or nickname</label></h3><input type="text" id="nm" maxlength="12" value="${esc(S.name||'')}" autocomplete="off"><h3><label for="codeOut">Record code</label></h3><textarea id="codeOut" rows="5" readonly></textarea><p class="tools" style="margin-top:10px"><button class="btn sm" id="copy" type="button">Copy code</button></p><p class="msg ok" id="cmsg" aria-live="polite"></p>`);
  const up=()=>{$('#codeOut').value=recCode()};$('#nm').oninput=e=>{S.name=e.target.value.trim();save();up()};up();copyBtn()}
function getHw(){dlg(`<h2 id="dlgT">Enter homework code</h2><p class="mut">Paste the homework code from your teacher.</p><textarea id="codeIn" rows="4" aria-label="Homework code"></textarea><p class="tools" style="margin-top:10px"><button class="btn sm" id="doIn" type="button">Get homework</button></p><p class="msg" id="cmsg" aria-live="polite"></p>`);
  $('#doIn').onclick=()=>{const m=$('#cmsg');try{const v=$('#codeIn').value.trim();if(!v.startsWith('RSH1.'))throw 0;const h=dec(v.slice(5)).h;if(!Array.isArray(h))throw 0;S.assigned=[...new Set(h.filter(byId))];save();m.className='msg ok';m.textContent='You got '+S.assigned.length+' homework book(s).';DRAW.library()}catch(e){m.className='msg no';m.textContent='The code cannot be read. Check that you copied all of it.'}}}
function addRec(){dlg(`<h2 id="dlgT">Import student records</h2><p class="mut">Paste the record codes your students sent. You can paste several, one on each line.</p><textarea id="codeIn" rows="6" aria-label="Student record codes"></textarea><p class="tools" style="margin-top:10px"><button class="btn sm" id="doIn" type="button">Import</button></p><p class="msg" id="cmsg" aria-live="polite"></p>`);
  $('#doIn').onclick=()=>{const m=$('#cmsg');let ok=0,bad=0;for(const v of $('#codeIn').value.split(/\s+/).filter(Boolean)){try{if(!v.startsWith('RS1.'))throw 0;const p=dec(v.slice(4));if(!p||typeof p.n!=='string'||!p.b||typeof p.b!=='object')throw 0;p.n=p.n.slice(0,12)||'No name';if(p.n==='__proto__')throw 0;S.cls[p.n]=p;ok++}catch(e){bad++}}
    save();m.className='msg '+(ok?'ok':'no');m.textContent=(ok?'Imported '+ok+' record(s). ':'')+(bad?bad+' could not be read.':'')||'Please paste a code.';if(ok)DRAW.teacher()}}
function mkHw(){const n=S.assigned.length;dlg(`<h2 id="dlgT">Make a homework code</h2><p class="mut">${n?'This code holds '+n+' homework book(s). Send it to your students and the homework appears at the top of their library.':'No homework is set yet. Tap "Set as homework" in the book table below first.'}</p><textarea id="codeOut" rows="4" readonly aria-label="Homework code">${n?'RSH1.'+enc({h:S.assigned,t:Date.now()}):''}</textarea><p class="tools" style="margin-top:10px"><button class="btn sm" id="copy" type="button" ${n?'':'disabled'}>Copy code</button></p><p class="msg ok" id="cmsg" aria-live="polite"></p>`);copyBtn()}

/* ---------- 학부모 ---------- */
DRAW.parent=function(){const me=myStats(),fmt=t=>new Date(t).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  $('#v-parent').innerHTML=`<div class="wrap">
  <div class="thead"><p class="eyebrow">Parents</p><h1>My child's reading record</h1><p class="mut">This is the record of reading on this device.</p></div>
  <div class="tiles"><div class="card"><p class="num">${me.read}</p><small>Books read to the end</small></div><div class="card"><p class="num">${stamps()}</p><small>Stamps</small></div><div class="card"><p class="num">${me.words}</p><small>Words met (different words in the books read)</small></div><div class="card"><p class="num">${me.avg==null?'-':me.avg+'%'}</p><small>Check average</small></div></div>
  <div class="two"><div class="card"><h2 style="font-size:20px;margin-bottom:8px">Recent activity</h2>${S.log.length?`<ul class="list">${S.log.slice(0,8).map(l=>{const b=byId(l.id);return `<li>${fmt(l.t)} · <span lang="en">${b?esc(b.title):''}</span> · ${esc(why(l.why))}</li>`}).join('')}</ul>`:'<p class="mut">No record yet. Read a first book in the library.</p>'}</div>
  <div class="card"><h2 style="font-size:20px;margin-bottom:8px">How to help at home</h2><ul class="list"><li>Start with one book and 10 minutes a day. Let your child listen first, then read aloud.</li><li>When a word is said wrong, do not correct it right away. Tap "Listen" once more and let your child compare.</li><li>If the Check is hard, it is fine to go down a step. Reading many easy books comes first.</li></ul></div></div>
  <div class="card" style="margin-top:16px">${evHtml()}</div>
  <div class="card" style="margin-top:16px"><h2 style="font-size:20px;margin-bottom:8px">Answer keys</h2><p class="mut">See the Check answers for a book, for example to talk about a question your child found hard. Books your child has read come first.</p><p><label for="akSel">Book</label> <select id="akSel">${(()=>{const rd=new Set(S.log.map(l=>l.id));const L=[...BOOKS].sort((a,c)=>(rd.has(c.id)-rd.has(a.id)));return L.map(b=>`<option value="${b.id}">${rd.has(b.id)?'(read) ':''}${esc(b.title)} · ${esc(b.lv||String(b.step))}</option>`).join('')})()}</select> <button class="btn sm" id="akBtn">Show answer key</button></p></div>
  <p style="margin-top:24px"><button class="btn ghost sm" id="reset">Erase the record on this device</button></p></div>`;
  $('#akBtn').onclick=()=>ansKey($('#akSel').value);$('#reset').onclick=()=>{if(confirm('Erase all reading records, stamps and the word book on this device? This cannot be undone.')){S=blank();save();curStep=null;drawStars();DRAW.parent()}}};

/* ---------- 이벤트 ---------- */
document.addEventListener('click',e=>{const t=e.target.closest('[data-go],[data-book],[data-step],[data-lv],[data-assign],[data-plan],[data-print],[data-key],[data-del],[data-place],[data-in],[data-out],[data-say],[data-show],.w,.opt');if(!t)return;const d=t.dataset;
  if(d.in!=null)moveUnit(+d.in,true);else if(d.out!=null)moveUnit(+d.out,false);else if(d.say)speak(d.say,{rate:.75});else if(d.show)showKo(t);else if(d.go)go(d.go);else if(d.book)openBook(d.book);else if(d.step){curStep=+d.step;curLv='';curTopic='';DRAW.library()}else if(d.lv!=null&&t.matches('.lvbar button')){curLv=d.lv;DRAW.library();const f=$(`.lvbar [data-lv="${curLv}"]`);if(f)f.focus()}
  else if(d.assign){const k=S.assigned.indexOf(d.assign);k<0?S.assigned.push(d.assign):S.assigned.splice(k,1);save();DRAW.teacher();const b=$(`[data-assign="${d.assign}"]`);if(b)b.focus()}
  else if(d.del){delete S.cls[d.del];save();DRAW.teacher()}else if(d.place)startPlace();else if(d.plan)plan(d.plan);else if(d.print)printBook(d.print);else if(d.key)ansKey(d.key);else if(t.classList.contains('w'))tapWord(t);else if(t.classList.contains('opt'))(t.classList.contains('popt')?ppick:pick)(t)});
document.addEventListener('keydown',e=>{const t=e.target;
  if((e.key==='Enter'||e.key===' ')&&t.classList&&t.classList.contains('w')){e.preventDefault();tapWord(t)}
  if(R&&!$('#v-reader').hidden&&!(t.closest&&t.closest('input,dialog'))){if(e.key==='ArrowRight')turn(1);if(e.key==='ArrowLeft')turn(-1)}});

/* ---------- 시작 ---------- */
/* 낱말 도움 언어 고르기: 고른 값을 이 기기에 적어 두고 주소에 ?l1= 을 붙여 다시 연다 */
{const sel=$('#l1sel');if(sel){sel.value=L1?L1.code:'';sel.onchange=()=>{try{localStorage.setItem('rs_l1',sel.value)}catch(e){}const u=new URL(location.href);u.searchParams.set('l1',sel.value||'en');location.href=u.toString()}}}
const s0=BOOKS[0];
$('#sample').innerHTML=pics(s0.pages[1][1])+`<p class="rtext" lang="en">${wordsHtml(s0.pages[1][0],s0,true)}</p>`;
$('#nBooks').textContent=BOOKS.length+' books';
$('#nDesc').textContent=`${STEPS.filter(s=>s.ready).length} steps, ${BOOKS.reduce((n,b)=>n+b.quiz.length,0)} Check questions. More books are coming.`;
if($('#rvNote'))$('#rvNote').textContent=` All ${BOOKS.length} books are drafts written and checked by AI. Books fully checked by a person: ${BOOKS.filter(b=>HUMAN.has(b.id)).length}.`;
$('.nav button').setAttribute('aria-current','page');
function route(){const [v,id]=decodeURIComponent(location.hash.slice(1)).split('/');
  if(v==='book'&&byId(id))openBook(id);else if(v==='quiz'&&byId(id))startQuiz(byId(id));else if(v==='build'&&byId(id))startBuild(byId(id));else if(v==='place')startPlace();else if(v==='library'||v==='teacher'||v==='parent'||v==='words')go(v);else if(!v&&$('#v-home').hidden)go('home')}
window.addEventListener('hashchange',route);
if(location.hash.length>1)route();
drawStars();
})();
