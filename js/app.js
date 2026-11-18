(()=>{
const {SP,STEPS,BOOKS,G,PLACEMENT}=window.RS_DATA;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- 아이콘 ---------- */
const IC={
spk:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
mic:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 11a6 6 0 0 0 12 0M12 17v4"/></svg>',
stop:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>',
ok:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
replay:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5"/></svg>',
star:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#FACC15" stroke="#172554" stroke-width="1.5" stroke-linejoin="round" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3L2.8 9.5l6.4-.8z"/></svg>'
};

/* ---------- 단어 그림: 투명 배경, 같은 선 굵기, 글자 없음 ---------- */
const svg=n=>`<svg class="sp" viewBox="0 0 100 100" role="img" aria-label="${n}"><g stroke="#334155" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${SP[n]}</g></svg>`;
const pics=a=>`<div class="pics">${a.map(svg).join('')}</div>`;

/* ---------- 단계와 책 ---------- */
const SK={detail:'세부 내용',vocab:'낱말',main:'중심 생각',seq:'순서',infer:'미루어 알기'};
const wc=b=>b.pages.reduce((n,p)=>n+p[0].match(/[A-Za-z']+/g).length,0);
const byId=id=>BOOKS.find(b=>b.id===id);

/* ---------- 기록 (이 기기에만 저장) ---------- */
const KEY='readstep.v1',blank=()=>({books:{},stars:0,log:[],assigned:[],skills:{},name:'',secs:0,cls:{},slow:false,place:null});
let S=blank();
try{const raw=localStorage.getItem(KEY);if(raw)S=Object.assign(blank(),JSON.parse(raw))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const rec=id=>S.books[id]||(S.books[id]={listen:false,read:false,best:-1,tries:0});
const passed=b=>{const r=S.books[b.id];return!!r&&r.best/b.quiz.length>=.8};
const stepDone=n=>BOOKS.filter(b=>b.step===n).every(b=>{const r=S.books[b.id];return r&&r.read&&passed(b)});
function recStep(){const start=Math.min(STEPS.length,Math.max(1,(S.place&&+S.place.step)||1));let last=start;for(const st of STEPS){if(st.n<start)continue;if(!st.ready)break;last=st.n;if(!stepDone(st.n))return st.n}return last}
function drawStars(pop){const el=$('#starbox');el.innerHTML=IC.star+'<b>'+S.stars+'</b>';if(pop){el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}}
function gain(n,why,id){S.stars+=n;S.log.unshift({t:Date.now(),why,id,n});S.log=S.log.slice(0,40);save();drawStars(n>0)}
function mark(id,what){const r=rec(id);if(r[what])return;r[what]=true;gain(10,what==='listen'?'듣기 완료':'읽기 완료',id)}
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
  $$('.nav button').forEach(b=>{const on=b.dataset.go===v||(b.dataset.go==='library'&&(v==='reader'||v==='quiz'||v==='place'));on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});
  if(DRAW[v])DRAW[v]();window.scrollTo(0,0);setHash(v==='home'?'':(v==='library'||v==='teacher'||v==='parent')?v:null)}

/* ---------- 서재 ---------- */
let curStep=null;
const chip=(on,t)=>`<span class="chip${on?' done':''}">${on?IC.ok:''}${t}</span>`;
function bookCard(b){const r=S.books[b.id]||{},hw=S.assigned.includes(b.id);
  return `<button class="card book" data-book="${b.id}"><span class="cover">${b.cover.map(svg).join('')}</span><span class="bt" lang="en">${esc(b.title)}</span><span class="meta">${esc(b.ko)} · ${b.type} · ${wc(b)}낱말</span><span class="chips">${hw?'<span class="chip hw">숙제</span>':''}${chip(r.listen,'듣기')}${chip(r.read,'읽기')}${chip(passed(b),'퀴즈')}</span></button>`}
DRAW.library=function(){const rs=recStep();if(curStep==null)curStep=rs;
  const list=BOOKS.filter(b=>b.step===curStep),done=list.filter(b=>{const r=S.books[b.id];return r&&r.read&&passed(b)}).length;
  const next=BOOKS.filter(b=>b.step===rs).find(b=>{const r=S.books[b.id];return!(r&&r.read&&passed(b))})||BOOKS.find(b=>b.step===rs);
  const weak=Object.entries(S.skills).filter(([,k])=>k.t>=2&&k.c/k.t<.6).map(([s])=>SK[s]);
  const hw=S.assigned.map(byId).filter(Boolean);
  $('#v-library').innerHTML=`<div class="wrap">
  <div class="lhead"><div><p class="eyebrow">학생</p><h1>내 서재</h1></div><div class="tools"><button class="btn ghost sm" id="sendRec">선생님께 기록 보내기</button><button class="btn ghost sm" id="getHw">숙제 코드 넣기</button>${S.place?'<button class="btn ghost sm" data-place="1">단계 다시 찾기</button>':''}</div></div>
  <p class="mut" style="margin-top:6px">책 한 권: 듣기 10 · 읽기 10 · 퀴즈 통과 30 · 만점 10</p>
  ${S.place?'':`<div class="card reco" style="border-color:var(--line)"><div><b style="font-size:19px">처음이라면 내 단계부터 찾아요</b><small style="font-size:14px">짧은 글을 읽고 문제를 풀어요. 글은 최대 ${PLACEMENT.length}개이고, 어려워지면 거기서 끝나요.</small></div><button class="btn ghost" data-place="1">내 단계 찾기</button></div>`}
  <div class="card reco"><div><small>오늘의 추천 (규칙으로 고른 데모: 내 단계에서 아직 안 끝낸 첫 책)</small><b lang="en" style="font:700 22px var(--read)">${esc(next.title)}</b> <span class="mut">· ${STEPS[rs-1].n}단계 ${STEPS[rs-1].name}</span>${weak.length?`<small style="margin-top:4px">${weak.join(', ')} 문제를 조금 더 연습해요. 읽을 때 낱말을 눌러 뜻을 확인해 보세요.</small>`:''}</div><button class="btn" data-book="${next.id}">읽으러 가기</button></div>
  ${hw.length?`<h2 class="sec" style="margin-top:20px">선생님이 낸 숙제</h2><div class="books">${hw.map(bookCard).join('')}</div>`:''}
  <div class="steps" role="group" aria-label="단계 고르기">${STEPS.map(st=>`<button data-step="${st.n}" aria-pressed="${st.n===curStep}" ${st.ready?'':'disabled'}><b>${st.n}단계 · ${st.name}${st.n===rs?' (내 단계)':''}</b><span>${st.desc}</span></button>`).join('')}</div>
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px"><div class="prog" style="flex:1" role="progressbar" aria-valuemin="0" aria-valuemax="${list.length}" aria-valuenow="${done}" aria-label="이 단계 진행"><i style="width:${list.length?done/list.length*100:0}%"></i></div><span class="mut" style="font-size:14px">${done} / ${list.length}권 완료</span></div>
  <div class="books">${list.map(bookCard).join('')}</div>
  <p class="note">한 단계의 책을 모두 읽고 퀴즈를 80% 이상으로 통과하면 다음 단계가 내 단계가 됩니다. 다른 단계의 책도 언제든 읽을 수 있습니다.</p></div>`;
  $('#sendRec').onclick=sendRec;$('#getHw').onclick=getHw};

/* ---------- 읽기 ---------- */
let R=null;
function openBook(id){const b=byId(id);if(!b)return;R={b,i:0,seen:new Set([0]),heard:new Set(),fx:true,auto:false,t0:Date.now()};go('reader');drawReader();setHash('book/'+id)}
function wordsHtml(text,b,fx){let out='',re=/[A-Za-z']+/g,m,last=0;
  while((m=re.exec(text))){out+=esc(text.slice(last,m.index));const w=m[0],lw=w.toLowerCase();let inner=esc(w);
    if(fx&&b.focus&&b.focus.words.includes(lw)){const k=lw.indexOf(b.focus.letter),n=b.focus.letter.length;if(k>=0)inner=esc(w.slice(0,k))+'<span class="fx">'+esc(w.slice(k,k+n))+'</span>'+esc(w.slice(k+n))}
    out+=`<span class="w" role="button" tabindex="0" data-i="${m.index}" data-w="${lw}">${inner}</span>`;last=m.index+w.length}
  return out+esc(text.slice(last))}
function drawReader(keep){const {b,i}=R,[text,pp]=b.pages[i],n=b.pages.length,last=i===n-1;let ch='';for(let k=i;k>=0;k--)if(b.pages[k][2]){ch=b.pages[k][2];break}
  $('#v-reader').innerHTML=`<div class="wrap narrow">
  <div class="rhead"><button class="btn ghost sm" data-go="library">← 서재</button><div><h1 class="rt" lang="en">${esc(b.title)}</h1><p class="mut">${esc(b.ko)} · ${b.step}단계 ${STEPS[b.step-1].name}</p></div><span class="pg" aria-label="${n}쪽 중 ${i+1}쪽">${i+1} / ${n}</span></div>
  <div class="dots" aria-hidden="true">${b.pages.map((_,k)=>`<i class="${k===i?'on':R.seen.has(k)?'seen':''}"></i>`).join('')}</div>
  ${ch?'<p class="ch" lang="en">'+esc(ch)+'</p>':''}${pics(pp)}
  <p class="rtext${text.length>70?' long':''}" lang="en" id="rtext">${wordsHtml(text,b,R.fx)}</p>
  <p class="gloss" id="gloss" aria-live="polite">낱말을 누르면 소리와 뜻이 나와요.</p>
  <div class="rctl"><button class="btn ghost" id="prev" ${i?'':'disabled'}>◀ 이전</button><button class="btn" id="listen">${IC.spk} 듣기</button><button class="btn ghost" id="rec">${IC.mic} 녹음</button>${last?'<button class="btn" id="toquiz">퀴즈 풀기 ▶</button>':'<button class="btn ghost" id="next">다음 ▶</button>'}</div>
  <div id="recout" aria-live="polite"></div>
  <div class="ropt"><label class="tog"><input type="checkbox" id="auto" ${R.auto?'checked':''}> 끝까지 이어 듣기</label><label class="tog"><input type="checkbox" id="slow" ${S.slow?'checked':''}> 천천히 듣기</label>${b.focus?`<label class="tog"><input type="checkbox" id="fx" ${R.fx?'checked':''}> 소리 글자 보기 <span class="mut">(${esc(b.focus.label)}: 보라색 밑줄)</span></label>`:''}</div></div>`;
  $('#prev').onclick=()=>turn(-1);if($('#next'))$('#next').onclick=()=>turn(1);
  $('#listen').onclick=listenPage;$('#rec').onclick=toggleRec;
  if($('#toquiz'))$('#toquiz').onclick=()=>startQuiz(b);
  if($('#fx'))$('#fx').onchange=e=>{R.fx=e.target.checked;drawReader('fx')};
  $('#auto').onchange=e=>{R.auto=e.target.checked};$('#slow').onchange=e=>{S.slow=e.target.checked;save()};
  if(keep){const el=$('#'+keep)||$('#toquiz')||$('#listen');if(el)el.focus()}}
function turn(d){const n=R.b.pages.length,j=R.i+d;if(j<0||j>=n)return;stopSpeak();stopRec();R.i=j;R.seen.add(j);if(R.seen.size===n)mark(R.b.id,'read');drawReader(d>0?'next':'prev')}
function heard(i){R.heard.add(i);if(R.heard.size===R.b.pages.length)mark(R.b.id,'listen')}
function listenPage(){const i=R.i,text=R.b.pages[i][0],spans=$$('#rtext .w'),btn=$('#listen'),t0=Date.now();
  const clear=()=>{spans.forEach(s=>s.classList.remove('now'));if(btn.isConnected)btn.removeAttribute('aria-pressed')};
  const ok=speak(text,{onword:ci=>{let cur=null;for(const s of spans)if(+s.dataset.i<=ci)cur=s;spans.forEach(s=>s.classList.toggle('now',s===cur))},rate:S.slow?.62:.85,onerror:()=>{clear();const g=$('#gloss');if(g)g.textContent='소리를 재생하지 못했어요. 화면을 한 번 누른 뒤 다시 "듣기"를 눌러 주세요.'},onend:()=>{clear();if(Date.now()-t0<250&&text.length>8){const g=$('#gloss');if(g)g.textContent='이 기기에서 영어 음성이 재생되지 않았어요. 소리 설정을 확인해 주세요.';return}heard(i);if(R.auto&&R.i===i&&i<R.b.pages.length-1){turn(1);listenPage()}}});
  if(ok)btn.setAttribute('aria-pressed','true');else{$('#gloss').textContent='이 브라우저에서는 음성 듣기를 쓸 수 없어요.';heard(i)}}
function tapWord(el){const w=el.dataset.w,k=G[w];speak(w,{rate:.75});const g=$('#gloss');if(g)g.innerHTML=`<b lang="en">${esc(w)}</b>${k?' · '+esc(k):''}`}
let mr=null;
function stopRec(){if(mr&&mr.state==='recording')mr.stop()}
async function toggleRec(){const btn=$('#rec'),out=$('#recout');if(mr&&mr.state==='recording'){mr.stop();return}
  try{const st=await navigator.mediaDevices.getUserMedia({audio:true}),chunks=[];mr=new MediaRecorder(st);
    mr.ondataavailable=e=>chunks.push(e.data);
    mr.onstop=()=>{st.getTracks().forEach(t=>t.stop());if(!btn.isConnected)return;out.innerHTML='<p class="mut">내 목소리를 들어 보세요. 녹음은 이 기기 밖으로 나가지 않아요.</p><audio controls src="'+URL.createObjectURL(new Blob(chunks,{type:mr.mimeType}))+'"></audio>';btn.innerHTML=IC.mic+' 녹음';btn.removeAttribute('aria-pressed')};
    mr.start();btn.innerHTML=IC.stop+' 녹음 끝내기';btn.setAttribute('aria-pressed','true')}
  catch(e){out.innerHTML='<p class="mut">마이크를 쓸 수 없어요. 브라우저의 마이크 허용을 확인해 주세요.</p>'}}

/* ---------- 퀴즈: 선택 전에는 모든 보기가 같은 모양 ---------- */
let Q=null;
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function startQuiz(b){Q={b,i:0,score:0,first:true,pick:null};go('quiz');drawQuiz();setHash('quiz/'+b.id)}
function drawQuiz(){const {b,i}=Q,q=b.quiz[i],n=b.quiz.length,lg=q.s==='vocab'?'ko':'en';Q.first=true;Q.pick=null;
  $('#v-quiz').innerHTML=`<div class="wrap narrow">
  <div class="rhead"><button class="btn ghost sm" data-book="${b.id}">← 책으로</button><div><h1 class="rt">퀴즈 · <span lang="en">${esc(b.title)}</span></h1><p class="mut">${SK[q.s]} 문제</p></div><span class="pg" aria-label="${n}문제 중 ${i+1}번">${i+1} / ${n}</span></div>
  <div class="dots" aria-hidden="true">${b.quiz.map((_,k)=>`<i class="${k===i?'on':k<i?'seen':''}"></i>`).join('')}</div>
  <div class="card qcard"><div class="qrow"><p class="qq" lang="${lg}" id="qq">${esc(q.q)}</p><button class="icon" id="qsay" aria-label="문제 듣기">${IC.spk}</button></div>
  <div class="opts" role="radiogroup" aria-labelledby="qq">${shuf(q.o.map((o,k)=>k)).map(k=>`<button class="opt" role="radio" aria-checked="false" data-k="${k}" lang="${lg}"><span class="mk" aria-hidden="true"></span><span>${esc(q.o[k])}</span></button>`).join('')}</div>
  <div class="fb" id="fb" aria-live="polite"></div>
  <div class="rctl" style="justify-content:flex-end"><button class="btn" id="check" disabled>확인</button></div></div></div>`;
  $('#qsay').onclick=()=>speak(q.w||q.q,{rate:.8});$('#check').onclick=check}
function pick(el){if(el.disabled)return;Q.pick=+el.dataset.k;$$('#v-quiz .opt').forEach(o=>o.setAttribute('aria-checked',o===el?'true':'false'));const c=$('#check');if(c)c.disabled=false}
function check(){const {b,i}=Q,q=b.quiz[i],k=Q.pick,opts=$$('#v-quiz .opt').sort((x,y)=>x.dataset.k-y.dataset.k),fb=$('#fb');if(k==null)return;
  const reveal=()=>{opts.forEach(o=>o.disabled=true);opts[q.a].classList.add('ok');opts[q.a].querySelector('.mk').innerHTML=IC.ok;
    const last=i===b.quiz.length-1,c=$('#check');c.disabled=false;c.textContent=last?'결과 보기':'다음 문제 ▶';c.onclick=()=>{if(last)finishQuiz();else{Q.i++;drawQuiz();$('#qsay').focus()}};c.focus()};
  if(k===q.a){if(Q.first){Q.score++;skill(q.s,1)}fb.className='fb ok';fb.innerHTML=IC.ok+' 잘했어요!';reveal()}
  else if(Q.first){Q.first=false;skill(q.s,0);opts[k].classList.add('no');opts[k].disabled=true;opts[k].setAttribute('aria-checked','false');Q.pick=null;$('#check').disabled=true;
    fb.className='fb no';fb.innerHTML=`${IC.replay} 다시 들어볼까요? <button class="btn ghost sm" id="rehear">${IC.spk} ${q.p}쪽 다시 듣기</button>`;
    $('#rehear').onclick=()=>speak(b.pages[q.p-1][0])}
  else{opts[k].classList.add('no');fb.className='fb no';fb.innerHTML=IC.replay+' 초록색 표시가 답이에요. 책에서 '+q.p+'쪽을 다시 읽어 봐요.';reveal()}}
function finishQuiz(){const {b,score}=Q,n=b.quiz.length,r=rec(b.id),was=r.best,pass=score/n>=.8;r.tries++;if(score>r.best)r.best=score;
  S.log.unshift({t:Date.now(),why:'퀴즈 '+score+'/'+n,id:b.id,n:0});save();
  let got=0;if(pass&&was/n<.8){gain(30,'퀴즈 통과',b.id);got+=30}if(score===n&&was<n){gain(10,'퀴즈 만점',b.id);got+=10}
  const lv=stepDone(b.step),nx=STEPS[b.step];
  $('#v-quiz').innerHTML=`<div class="wrap narrow"><div class="card result"><h1 class="rt">퀴즈 결과 · <span lang="en">${esc(b.title)}</span></h1>
  <p class="num">${score} / ${n}</p>
  ${pass?`<p class="badge pass">${IC.star} 통과!${got?' 별 '+got+'개를 받았어요':''}</p>`:`<p class="badge again">${IC.replay} 한 번 더 읽고 다시 풀어 봐요 (4문제 이상 맞으면 통과)</p>`}
  ${lv?`<p style="font-weight:700;color:var(--ok)">${IC.ok} ${b.step}단계의 책을 모두 마쳤어요.${nx&&nx.ready?' 이제 '+nx.n+'단계가 내 단계예요.':''}</p>`:''}
  <div class="rctl"><button class="btn ghost" data-book="${b.id}">책 다시 읽기</button><button class="btn ghost" id="again">다시 풀기</button><button class="btn" data-go="library" id="tolib">서재로</button></div></div></div>`;
  $('#again').onclick=()=>startQuiz(b);curStep=null;$('#tolib').focus()}

/* ---------- 단계 진단: 쉬운 글부터 읽고, 두 문제를 모두 맞히면 다음 단계 글로 넘어간다 ---------- */
let P=null;
function startPlace(){if(!PLACEMENT.length)return;P={s:0,q:0,ok:0,pick:null,n:0};go('place');drawPlace();setHash('place')}
function drawPlace(){const it=PLACEMENT[P.s],q=it.q[P.q];P.pick=null;P.n++;
  $('#v-place').innerHTML=`<div class="wrap narrow">
  <div class="rhead"><button class="btn ghost sm" data-go="library">← 서재</button><div><h1 class="rt">내 단계 찾기</h1><p class="mut">글을 읽고 알맞은 답을 골라요. 틀려도 괜찮아요.</p></div><span class="pg" aria-label="${P.n}번째 문제">${P.n}번</span></div>
  <div class="card qcard"><p class="ptext" lang="en">${esc(it.text)}</p></div>
  <div class="card qcard" style="margin-top:14px"><p class="qq" lang="en" id="pq">${esc(q.q)}</p>
  <div class="opts" role="radiogroup" aria-labelledby="pq">${shuf(q.o.map((o,k)=>k)).map(k=>`<button class="opt popt" role="radio" aria-checked="false" data-k="${k}" lang="en"><span class="mk" aria-hidden="true"></span><span>${esc(q.o[k])}</span></button>`).join('')}</div>
  <div class="rctl" style="justify-content:flex-end"><button class="btn" id="pnext" disabled>다음 ▶</button></div></div></div>`;
  $('#pnext').onclick=()=>{if(P.pick==null)return;if(P.pick===q.a)P.ok++;
    if(P.q===0){P.q=1;drawPlace();return}
    if(P.ok===2&&P.s<PLACEMENT.length-1){P.s++;P.q=0;P.ok=0;drawPlace()}else endPlace(it.step)}}
function ppick(el){P.pick=+el.dataset.k;$$('#v-place .opt').forEach(o=>o.setAttribute('aria-checked',o===el?'true':'false'));$('#pnext').disabled=false}
function endPlace(step){S.place={step,t:Date.now()};save();curStep=null;const st=STEPS[step-1];
  $('#v-place').innerHTML=`<div class="wrap narrow"><div class="card result"><h1 class="rt">내 단계를 찾았어요</h1><p class="num">${st.n}단계</p><p style="font-weight:700;font-size:19px">${st.name}</p><p class="mut" style="margin:6px 0 4px">${st.desc}</p><p class="mut">너무 쉽거나 어렵다면 언제든 다시 찾을 수 있어요.</p><div class="rctl"><button class="btn ghost" data-place="1">다시 하기</button><button class="btn" data-go="library" id="pdone">${st.n}단계 책 보러 가기</button></div></div></div>`;
  $('#pdone').focus()}

/* ---------- 선생님 ---------- */
const DEMO=[['학생 A',1,3,87,42],['학생 B',2,5,80,58],['학생 C',1,2,60,21],['학생 D',3,8,93,95],['학생 E',2,4,73,40],['학생 F',1,1,100,12],['학생 G',2,6,67,66],['학생 H',3,7,90,81]];
function myStats(){const read=BOOKS.filter(b=>(S.books[b.id]||{}).read),qs=BOOKS.filter(b=>(S.books[b.id]||{}).best>=0);
  const avg=qs.length?Math.round(qs.reduce((n,b)=>n+S.books[b.id].best/b.quiz.length,0)/qs.length*100):null;
  const words=new Set();read.forEach(b=>b.pages.forEach(p=>p[0].toLowerCase().match(/[a-z']+/g).forEach(w=>words.add(w))));
  return{read:read.length,avg,words:words.size}}
DRAW.teacher=function(){const me=myStats(),real=Object.values(S.cls||{}).map(clsRow),demo=!real.length,rows=demo?DEMO.map(d=>({n:d[0],st:d[1],rd:d[2],av:d[3],mn:d[4]})):real;
  const total=rows.reduce((n,r)=>n+r.rd,0)+me.read,avgs=rows.map(r=>r.av).concat(me.avg).filter(x=>x!=null),avg=avgs.length?Math.round(avgs.reduce((a,b)=>a+b,0)/avgs.length):null;
  $('#v-teacher').innerHTML=`<div class="wrap">
  <div class="thead"><p class="eyebrow">선생님</p><h1>우리 반 읽기 현황</h1><p class="mut">${demo?'아직 가져온 학생 기록이 없어 예시 데이터(학생 A~H)를 보여 줍니다. 파란 줄만 이 기기의 실제 기록입니다.':'학생이 보낸 기록 코드로 채운 실제 기록입니다. 파란 줄은 이 기기의 기록입니다.'}</p><div class="tools" style="margin-top:12px"><button class="btn sm" id="addRec">학생 기록 가져오기</button><button class="btn ghost sm" id="mkHw">숙제 코드 만들기</button></div></div>
  <div class="tiles"><div class="card"><p class="num">${rows.length+1}</p><small>학생 수 (${demo?'예시 8':'가져온 기록 '+rows.length} + 이 기기 1)</small></div><div class="card"><p class="num">${total}</p><small>읽은 책 합계</small></div><div class="card"><p class="num">${avg==null?'-':avg+'%'}</p><small>퀴즈 평균</small></div><div class="card"><p class="num">${S.assigned.length}</p><small>낸 숙제</small></div></div>
  <div class="card tablebox"><table><caption class="skip">학생별 읽기 현황</caption><thead><tr><th scope="col">학생</th><th scope="col">단계</th><th scope="col">읽은 책</th><th scope="col">퀴즈 평균</th><th scope="col">읽은 시간</th><th scope="col">살펴보기</th></tr></thead><tbody>
  <tr class="me"><td>이 기기 학습자</td><td>${recStep()}단계</td><td>${me.read}권</td><td>${me.avg==null?'기록 없음':me.avg+'%'}</td><td>${Math.round((S.secs||0)/60)}분</td><td>${me.avg!=null&&me.avg<70?`<span class="chip help">${IC.replay}도움 필요</span>`:''}</td></tr>
  ${rows.map(r=>`<tr><td>${esc(r.n)}${r.t?'<br><span class="mut" style="font-size:12px">'+fmtD(r.t)+' 기록</span>':''}</td><td>${r.st}단계</td><td>${r.rd}권</td><td>${r.av==null?'기록 없음':r.av+'%'}</td><td>${r.mn}분</td><td>${r.real?'<button class="btn ghost sm" data-del="'+esc(r.n)+'">빼기</button> ':''}${r.av!=null&&r.av<70?`<span class="chip help">${IC.replay}도움 필요</span>`:''}</td></tr>`).join('')}</tbody></table></div>
  <div class="two" style="margin-top:16px"><div class="card"><h2 style="font-size:20px;margin-bottom:12px">문제 유형별 정답률 (이 기기)</h2><div class="skills">${Object.entries(SK).map(([s,l])=>{const k=S.skills[s];const p=k&&k.t?Math.round(k.c/k.t*100):0;return `<div><span>${l}</span><span class="prog" role="img" aria-label="${l} ${k&&k.t?p+'%':'기록 없음'}"><i style="width:${p}%"></i></span><span>${k&&k.t?p+'% ('+k.c+'/'+k.t+')':'기록 없음'}</span></div>`}).join('')}</div><p class="note">첫 번째 시도에서 맞힌 것만 정답으로 셉니다.</p></div>
  <div class="card"><h2 style="font-size:20px;margin-bottom:8px">살펴볼 점</h2><ul class="list"><li>퀴즈 평균이 70% 아래인 학생에게 "도움 필요" 표시가 붙습니다. 70%는 임시 기준이며 바꿀 수 있습니다.</li><li>숙제로 지정한 책은 학생의 서재 맨 위에 나옵니다.</li><li>서버가 없어서, 학생이 "선생님께 기록 보내기"로 만든 코드를 받아 "학생 기록 가져오기"에 붙여 넣는 방식입니다. 같은 이름으로 다시 가져오면 새 기록으로 바뀝니다.</li><li>읽은 시간은 책을 연 동안의 시간이며, 한 번에 최대 10분까지만 셉니다(자리를 비운 시간을 줄이기 위한 임시 기준).</li></ul></div></div>
  <h2 class="sec">책 관리</h2>
  <div class="card tablebox"><table><thead><tr><th scope="col">책</th><th scope="col">단계</th><th scope="col">낱말 수</th><th scope="col">배울 것</th><th scope="col">할 일</th></tr></thead><tbody>
  ${BOOKS.map(b=>{const on=S.assigned.includes(b.id);return `<tr><td><b lang="en" style="font-family:var(--read)">${esc(b.title)}</b><br><span class="mut" style="font-size:13px">${esc(b.ko)}</span></td><td>${b.step}단계</td><td>${wc(b)}</td><td>${b.focus?esc(b.focus.label):b.type}</td><td><button class="btn sm ${on?'':'ghost'}" data-assign="${b.id}" aria-pressed="${on}">${on?'숙제 취소':'숙제 지정'}</button><button class="btn sm ghost" data-plan="${b.id}">수업안</button><button class="btn sm ghost" data-print="${b.id}">인쇄용 책</button></td></tr>`}).join('')}</tbody></table></div></div>`;
  $('#addRec').onclick=addRec;$('#mkHw').onclick=mkHw};
function plan(id){const b=byId(id),words=[...new Set(b.pages.flatMap(p=>p[0].toLowerCase().match(/[a-z']+/g)))].filter(w=>G[w]).slice(0,8);
  $('#dlgBody').innerHTML=`<h2 id="dlgT">수업안 · <span lang="en">${esc(b.title)}</span></h2><p class="mut">${b.step}단계 ${STEPS[b.step-1].name} · ${wc(b)}낱말 · 시간은 권장값이며 조정할 수 있습니다.</p>
  <h3>읽기 전 (약 5분)</h3><ul class="list"><li>표지 그림을 보고 무엇이 나올지 말해 봅니다.</li><li>핵심 낱말: ${words.map(w=>`<b lang="en">${w}</b>(${esc(G[w])})`).join(', ')}</li></ul>
  <h3>읽는 중 (약 10분)</h3><ul class="list"><li>처음부터 끝까지 한 번 듣습니다.</li><li>한 쪽씩 듣고 따라 읽습니다.</li>${b.focus?`<li>${esc(b.focus.label)}가 들어간 낱말을 찾습니다: <span lang="en">${b.focus.words.join(', ')}</span></li>`:'<li>모르는 낱말을 눌러 뜻을 확인하고 표시해 둡니다.</li>'}</ul>
  <h3>읽은 후 (약 10분)</h3><ul class="list">${b.quiz.filter(q=>q.s!=='vocab').slice(0,3).map(q=>`<li lang="en">${esc(q.q)}</li>`).join('')}<li>문장 카드를 섞어 놓고 이야기 순서대로 다시 놓습니다.</li></ul>`;
  $('#dlg').showModal()}
function printBook(id){const b=byId(id);
  $('#print').innerHTML=`<h1 lang="en">${esc(b.title)}</h1><p>${esc(b.ko)} · ${b.step}단계 ${STEPS[b.step-1].name} · 이름: ____________</p><div class="pp">${b.pages.map((p,k)=>`<div>${p[2]?'<b lang="en">'+esc(p[2])+'</b>':''}${pics(p[1])}<p lang="en">${esc(p[0])}</p><small>${k+1}</small></div>`).join('')}</div><div class="pq"><h2>읽고 답해요</h2><ol>${b.quiz.map(q=>`<li><span lang="${q.s==='vocab'?'ko':'en'}">${esc(q.q)}</span><br>${q.o.map((o,k)=>'('+(k+1)+') '+esc(o)).join('&nbsp;&nbsp;&nbsp;')}</li>`).join('')}</ol></div>`;
  window.print()}

/* ---------- 기록 코드와 숙제 코드: 서버 없이 기기 사이에 전달 ---------- */
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const dec=s=>JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))));
const fmtD=t=>new Date(t).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
function clsRow(p){const bs=Object.entries(p.b||{}).map(([id,r])=>[byId(id),r]).filter(x=>x[0]&&Array.isArray(x[1])),q=bs.filter(x=>x[1][2]>=0);
  return{n:String(p.n),st:Math.min(6,Math.max(1,+p.st||1)),rd:bs.filter(x=>x[1][1]).length,av:q.length?Math.round(q.reduce((n,x)=>n+Math.min(1,x[1][2]/x[0].quiz.length),0)/q.length*100):null,mn:Math.round((+p.sec||0)/60),t:+p.t||0,real:true}}
function dlg(html){$('#dlgBody').innerHTML=html;const d=$('#dlg');if(!d.open)d.showModal()}
function copyBtn(){const b=$('#copy');if(!b)return;b.onclick=async()=>{const t=$('#codeOut'),m=$('#cmsg');try{await navigator.clipboard.writeText(t.value);m.textContent='복사했어요.'}catch(e){t.focus();t.select();m.textContent='코드를 선택했어요. Ctrl+C로 복사하세요.'}}}
function recCode(){return'RS1.'+enc({n:S.name||'이름 없음',st:recStep(),s:S.stars,sec:S.secs||0,pl:S.place?S.place.step:0,b:Object.fromEntries(Object.entries(S.books).map(([id,r])=>[id,[+r.listen,+r.read,r.best,r.tries]])),t:Date.now()})}
function sendRec(){dlg(`<h2 id="dlgT">선생님께 기록 보내기</h2><p class="mut">이름을 적으면 기록 코드가 만들어집니다. 코드를 복사해 선생님께 보내세요. 별명을 써도 됩니다.</p><h3><label for="nm">내 이름</label></h3><input type="text" id="nm" maxlength="12" value="${esc(S.name||'')}" autocomplete="off"><h3><label for="codeOut">기록 코드</label></h3><textarea id="codeOut" rows="5" readonly></textarea><p class="tools" style="margin-top:10px"><button class="btn sm" id="copy" type="button">코드 복사</button></p><p class="msg ok" id="cmsg" aria-live="polite"></p>`);
  const up=()=>{$('#codeOut').value=recCode()};$('#nm').oninput=e=>{S.name=e.target.value.trim();save();up()};up();copyBtn()}
function getHw(){dlg(`<h2 id="dlgT">숙제 코드 넣기</h2><p class="mut">선생님께 받은 숙제 코드를 붙여 넣으세요.</p><textarea id="codeIn" rows="4" aria-label="숙제 코드"></textarea><p class="tools" style="margin-top:10px"><button class="btn sm" id="doIn" type="button">숙제 받기</button></p><p class="msg" id="cmsg" aria-live="polite"></p>`);
  $('#doIn').onclick=()=>{const m=$('#cmsg');try{const v=$('#codeIn').value.trim();if(!v.startsWith('RSH1.'))throw 0;const h=dec(v.slice(5)).h;if(!Array.isArray(h))throw 0;S.assigned=[...new Set(h.filter(byId))];save();m.className='msg ok';m.textContent='숙제 '+S.assigned.length+'권을 받았어요.';DRAW.library()}catch(e){m.className='msg no';m.textContent='코드를 읽을 수 없어요. 처음부터 끝까지 복사했는지 확인해 주세요.'}}}
function addRec(){dlg(`<h2 id="dlgT">학생 기록 가져오기</h2><p class="mut">학생이 보낸 기록 코드를 붙여 넣으세요. 여러 개는 줄을 바꿔 한 번에 넣을 수 있습니다.</p><textarea id="codeIn" rows="6" aria-label="학생 기록 코드"></textarea><p class="tools" style="margin-top:10px"><button class="btn sm" id="doIn" type="button">가져오기</button></p><p class="msg" id="cmsg" aria-live="polite"></p>`);
  $('#doIn').onclick=()=>{const m=$('#cmsg');let ok=0,bad=0;for(const v of $('#codeIn').value.split(/\s+/).filter(Boolean)){try{if(!v.startsWith('RS1.'))throw 0;const p=dec(v.slice(4));if(!p||typeof p.n!=='string'||!p.b||typeof p.b!=='object')throw 0;p.n=p.n.slice(0,12)||'이름 없음';if(p.n==='__proto__')throw 0;S.cls[p.n]=p;ok++}catch(e){bad++}}
    save();m.className='msg '+(ok?'ok':'no');m.textContent=(ok?ok+'명의 기록을 가져왔어요. ':'')+(bad?bad+'개는 읽을 수 없었어요.':'')||'코드를 붙여 넣어 주세요.';if(ok)DRAW.teacher()}}
function mkHw(){const n=S.assigned.length;dlg(`<h2 id="dlgT">숙제 코드 만들기</h2><p class="mut">${n?'지정한 숙제 '+n+'권이 들어 있습니다. 학생에게 이 코드를 보내면 학생 서재 맨 위에 숙제가 나옵니다.':'아직 지정한 숙제가 없습니다. 아래 책 관리에서 "숙제 지정"을 먼저 눌러 주세요.'}</p><textarea id="codeOut" rows="4" readonly aria-label="숙제 코드">${n?'RSH1.'+enc({h:S.assigned,t:Date.now()}):''}</textarea><p class="tools" style="margin-top:10px"><button class="btn sm" id="copy" type="button" ${n?'':'disabled'}>코드 복사</button></p><p class="msg ok" id="cmsg" aria-live="polite"></p>`);copyBtn()}

/* ---------- 학부모 ---------- */
DRAW.parent=function(){const me=myStats(),fmt=t=>new Date(t).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  $('#v-parent').innerHTML=`<div class="wrap">
  <div class="thead"><p class="eyebrow">학부모</p><h1>우리 아이 읽기 기록</h1><p class="mut">이 기기에서 읽은 기록입니다.</p></div>
  <div class="tiles"><div class="card"><p class="num">${me.read}</p><small>끝까지 읽은 책</small></div><div class="card"><p class="num">${S.stars}</p><small>모은 별</small></div><div class="card"><p class="num">${me.words}</p><small>만난 낱말 (읽은 책의 서로 다른 낱말)</small></div><div class="card"><p class="num">${me.avg==null?'-':me.avg+'%'}</p><small>퀴즈 평균</small></div></div>
  <div class="two"><div class="card"><h2 style="font-size:20px;margin-bottom:8px">최근 활동</h2>${S.log.length?`<ul class="list">${S.log.slice(0,8).map(l=>{const b=byId(l.id);return `<li>${fmt(l.t)} · <span lang="en">${b?esc(b.title):''}</span> · ${esc(l.why)}${l.n?' (별 '+l.n+')':''}</li>`}).join('')}</ul>`:'<p class="mut">아직 기록이 없습니다. 서재에서 첫 책을 읽어 보세요.</p>'}</div>
  <div class="card"><h2 style="font-size:20px;margin-bottom:8px">집에서 이렇게 도와주세요</h2><ul class="list"><li>하루 한 권, 10분이면 충분합니다. 먼저 듣고, 그다음 소리 내어 읽게 해 주세요.</li><li>틀린 발음을 바로 고치기보다 "듣기"를 한 번 더 눌러 스스로 비교하게 해 주세요.</li><li>퀴즈가 어렵다면 단계를 내려도 괜찮습니다. 쉽게 읽히는 책을 많이 읽는 것이 먼저입니다.</li></ul></div></div>
  <p style="margin-top:24px"><button class="btn ghost sm" id="reset">이 기기의 기록 지우기</button></p></div>`;
  $('#reset').onclick=()=>{if(confirm('이 기기의 읽기 기록과 별을 모두 지울까요? 되돌릴 수 없습니다.')){S=blank();save();curStep=null;drawStars();DRAW.parent()}}};

/* ---------- 이벤트 ---------- */
document.addEventListener('click',e=>{const t=e.target.closest('[data-go],[data-book],[data-step],[data-assign],[data-plan],[data-print],[data-del],[data-place],.w,.opt');if(!t)return;const d=t.dataset;
  if(d.go)go(d.go);else if(d.book)openBook(d.book);else if(d.step){curStep=+d.step;DRAW.library()}
  else if(d.assign){const k=S.assigned.indexOf(d.assign);k<0?S.assigned.push(d.assign):S.assigned.splice(k,1);save();DRAW.teacher();const b=$(`[data-assign="${d.assign}"]`);if(b)b.focus()}
  else if(d.del){delete S.cls[d.del];save();DRAW.teacher()}else if(d.place)startPlace();else if(d.plan)plan(d.plan);else if(d.print)printBook(d.print);else if(t.classList.contains('w'))tapWord(t);else if(t.classList.contains('opt'))(t.classList.contains('popt')?ppick:pick)(t)});
document.addEventListener('keydown',e=>{const t=e.target;
  if((e.key==='Enter'||e.key===' ')&&t.classList&&t.classList.contains('w')){e.preventDefault();tapWord(t)}
  if(R&&!$('#v-reader').hidden&&!(t.closest&&t.closest('input,dialog'))){if(e.key==='ArrowRight')turn(1);if(e.key==='ArrowLeft')turn(-1)}});

/* ---------- 시작 ---------- */
const s0=BOOKS[0];
$('#sample').innerHTML=pics(s0.pages[1][1])+`<p class="rtext" lang="en">${wordsHtml(s0.pages[1][0],s0,true)}</p>`;
$('#nBooks').textContent=BOOKS.length+'권';
$('#nDesc').textContent=`${STEPS.filter(s=>s.ready).length}개 단계, 퀴즈 ${BOOKS.reduce((n,b)=>n+b.quiz.length,0)}문항. 책은 계속 늘어납니다.`;
$('.nav button').setAttribute('aria-current','page');
function route(){const [v,id]=decodeURIComponent(location.hash.slice(1)).split('/');
  if(v==='book'&&byId(id))openBook(id);else if(v==='quiz'&&byId(id))startQuiz(byId(id));else if(v==='place')startPlace();else if(v==='library'||v==='teacher'||v==='parent')go(v);else if(!v&&$('#v-home').hidden)go('home')}
window.addEventListener('hashchange',route);
if(location.hash.length>1)route();
drawStars();
})();
