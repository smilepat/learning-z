/* 개발 현황판의 사람 검수 도구와 기기 점검. dev/index.html 이 화면을 그린 뒤에 실행된다.
   판정은 이 기기의 브라우저에만 저장되고, "결과 복사"나 "GitHub 이슈로 열기"로 전달한다.
   본문이 바뀌면 그 줄의 예전 판정은 무효가 되어 다시 보게 된다. */
(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
if(!window.__dev||window.__dev.fatal)return;
const PJ=window.RS_PROJECT||{},RV=window.RS_REVIEW||{items:[]},KEY='readstep.devreview.v1';
let S={name:'',on:false,v:{},ai:{},dev:{}};
try{const raw=localStorage.getItem(KEY);if(raw){const o=JSON.parse(raw);if(o&&typeof o==='object')S=Object.assign(S,o)}}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const hash=t=>{let h=0;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return String(h)};
const rows=()=>$$('[data-rk]');
const valid=el=>{const v=S.v[el.dataset.rk];return v&&v.h===hash(el.dataset.rt)?v:null};
const VS=[['ok','통과'],['fix','고침'],['cut','빼기']],AS=[['accept','제안대로 고침'],['keep','그대로 둠'],['other','다른 의견']];
const VL=Object.fromEntries(VS),AL=Object.fromEntries(AS);
const seg=(list,cur,label)=>`<span class="rvb" role="group" aria-label="${esc(label)}">${list.map(([s,l])=>`<button type="button" data-s="${s}" aria-pressed="${cur===s}">${cur===s?'✓ ':''}${l}</button>`).join('')}</span>`;

/* ---------- 줄마다 판정 ---------- */
function ctl(el){const cur=S.v[el.dataset.rk],v=valid(el),st=v?v.s:'';
  let c=$(':scope > .rvc',el);if(!c){c=document.createElement('div');c.className='rvc';el.appendChild(c)}
  c.innerHTML=seg(VS,st,el.dataset.rl+' 판정')+(cur&&!v?'<span class="chip help">내용이 바뀜, 다시 확인</span>':'')+(st==='fix'||st==='cut'?`<input type="text" class="rvn" value="${esc(v.n||'')}" placeholder="${st==='fix'?'어떻게 고칠지 적어 주세요':'빼는 이유'}" aria-label="${esc(el.dataset.rl)} ${st==='fix'?'고칠 내용':'빼는 이유'}">`:'')}
const aiRows=()=>$$('#rvbody tr').map((tr,i)=>({tr,x:RV.items[i]})).filter(o=>o.x&&o.x.status==='human');
function actl(tr,x){const k=x.where+'|'+x.item,cur=S.ai[k],st=cur?cur.s:'';tr.dataset.ak=k;
  const td=tr.lastElementChild;let c=$(':scope > .rvc',td);if(!c){c=document.createElement('div');c.className='rvc always';td.appendChild(c)}
  c.innerHTML=seg(AS,st,x.where+' '+x.item+' 결정')+(st?`<input type="text" class="rvn" value="${esc(cur.n||'')}" placeholder="${st==='other'?'의견을 적어 주세요':'덧붙일 말 (선택)'}" aria-label="${esc(x.where+' '+x.item)} 의견">`:'')}
function drawAll(){rows().forEach(ctl);$$('.bk[data-step]').forEach(a=>{if(!$('.rvall',a)){const b=document.createElement('button');b.type='button';b.className='btn ghost sm rvall';b.textContent='이 책의 남은 줄 모두 통과';a.appendChild(b)}})}
function setMode(on){S.on=on;save();document.body.classList.toggle('rvon',on);if(on)drawAll();$$('.rvmode').forEach(b=>{b.setAttribute('aria-pressed',on);b.textContent=on?'검수 모드 끄기':'검수 모드 켜기'})}

/* ---------- 결과 ---------- */
function devLine(){const d=S.dev||{},so=d.sound,mi=d.mic;
  const s=!so?'시험 안 함':so.heard==='yes'?'들림':so.heard==='no'?'재생은 끝났지만 안 들림':so.r==='played'?'재생됨 (들렸는지 미응답)':'재생 안 됨 ('+so.r+')';
  const m=!mi?'시험 안 함':mi.r==='recorded'?'됨':'안 됨 ('+(mi.why||'')+')';
  return `소리: ${s} · 녹음: ${m} · 기록 저장: ${d.store===true?'됨':d.store===false?'안 됨':'시험 안 함'}`}
function report(){const R=rows(),c={ok:0,fix:0,cut:0},fix=[],cut=[];
  R.forEach(el=>{const v=valid(el);if(!v)return;c[v.s]++;const line=`- [${el.dataset.rl}] ${el.dataset.rt}\n  → ${v.n||'(내용 없음)'}`;if(v.s==='fix')fix.push(line);if(v.s==='cut')cut.push(line)});
  const done=c.ok+c.fix+c.cut,full=$$('.bk[data-step]').filter(a=>{const r=$$('[data-rk]',a);return r.length&&r.every(el=>{const v=valid(el);return v&&v.s==='ok'})}).map(a=>a.id.slice(2));
  const ai=aiRows().map(o=>{const d=S.ai[o.x.where+'|'+o.x.item];return d?`- [${o.x.where} ${o.x.item}] ${AL[d.s]}${d.n?': '+d.n:''}`:null}).filter(Boolean);
  const text=[`ReadStep 검수 결과`,`검수자: ${S.name||'이름 없음'} · ${new Date().toLocaleDateString('ko-KR')} · ${PJ.version||''}`,`판정: ${R.length}줄 중 ${done}줄 (통과 ${c.ok}, 고침 ${c.fix}, 빼기 ${c.cut})`,'',
    ...(aiRows().length?[`## AI 검수 의견에 대한 결정 (${ai.length}/${aiRows().length})`,ai.join('\n')||'- 없음','']:[]),`## 고침 (${c.fix})`,fix.join('\n')||'- 없음','',`## 빼기 (${c.cut})`,cut.join('\n')||'- 없음','',`## 모든 줄이 통과인 책 (${full.length})`,full.join(', ')||'- 없음','',`## 기기 점검`,devLine(),(navigator.userAgent||'').slice(0,150)].join('\n');
  return{text,total:R.length,done,c,ai:ai.length,aiTotal:aiRows().length,full}}
function update(){const r=report(),p=$('#rvprog');if(!p)return r;
  p.textContent=`${r.total}줄 중 ${r.done}줄 판정 (통과 ${r.c.ok}, 고침 ${r.c.fix}, 빼기 ${r.c.cut})`+(r.aiTotal?` · AI 의견 ${r.aiTotal}건 중 ${r.ai}건 결정`:'');
  $('#rvbar').style.width=(r.total?r.done/r.total*100:0)+'%';$('#rvbar').parentNode.setAttribute('aria-valuenow',r.done);$('#rvbar').parentNode.setAttribute('aria-valuemax',r.total);
  $('#rvout').value=r.text;
  const base=(PJ.links&&PJ.links.issues)||'';if(base){let body=encodeURIComponent(r.text);if(body.length>5500)body=encodeURIComponent(`(내용이 길어 여기에 다 담지 못했습니다. 현황판에서 "결과 복사"를 누른 뒤 이 칸에 붙여 넣어 주세요.)\n\n판정: ${r.total}줄 중 ${r.done}줄 (통과 ${r.c.ok}, 고침 ${r.c.fix}, 빼기 ${r.c.cut})`);
    $('#rvissue').href=base+'/new?title='+encodeURIComponent('검수 결과: '+(S.name||'이름 없음'))+'&body='+body}
  window.__devreview={rows:r.total,done:r.done,counts:r.c,ai:r.ai,aiTotal:r.aiTotal,full:r.full,on:S.on};return r}

/* ---------- 화면에 넣기 ---------- */
const rvWrap=$('#review .wrap'),tool=document.createElement('div');tool.className='card';tool.id='rvtool';
tool.innerHTML=`<h3 style="margin-top:0">사람 검수 하기</h3>
<ol class="plain"><li>이름을 적고 검수 모드를 켭니다.</li><li>"책 전체"와 "단계 진단"에서 줄마다 통과, 고침, 빼기를 누릅니다. 책 한 권을 다 봤으면 "이 책의 남은 줄 모두 통과"를 누릅니다.</li>${aiRows().length?'<li>아래 표의 "사람이 판단할 것"에서 결정을 고릅니다.</li>':''}<li>결과를 복사해 보내거나 GitHub 이슈로 올립니다.</li></ol>
<p class="mut" style="font-size:14px;margin-top:6px">판정은 이 기기에만 저장됩니다. 다른 사람의 판정은 보이지 않으니 각자 결과를 보내 주세요. 책 내용이 바뀌면 그 줄은 다시 확인하도록 표시됩니다.</p>
<div class="rvrow"><label for="rvname" style="font-weight:700">검수자 이름</label><input type="text" id="rvname" maxlength="20" autocomplete="off" value="${esc(S.name||'')}"><button type="button" class="btn sm rvmode" aria-pressed="false">검수 모드 켜기</button><a class="btn ghost sm" href="#books" style="text-decoration:none">책 전체로 가기</a></div>
<div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" aria-label="검수 진행"><i id="rvbar" style="width:0"></i></div>
<p id="rvprog" style="font-weight:700;margin:8px 0 12px"></p>
<label for="rvout" class="mut" style="font-size:14px">검수 결과 (자동으로 만들어집니다)</label>
<textarea id="rvout" rows="9" readonly></textarea>
<div class="tools" style="margin-top:10px"><button type="button" class="btn sm" id="rvcopy">결과 복사</button><a class="btn ghost sm" id="rvissue" target="_blank" rel="noopener" style="text-decoration:none">GitHub 이슈로 열기</a><button type="button" class="btn ghost sm" id="rvclear">판정 모두 지우기</button></div>
<p class="msg ok" id="rvmsg" aria-live="polite"></p>`;
rvWrap.insertBefore(tool,rvWrap.children[1]||null);
const bf=$('#books .filters');if(bf){const b=document.createElement('button');b.type='button';b.className='btn sm rvmode';b.setAttribute('aria-pressed','false');b.textContent='검수 모드 켜기';bf.appendChild(b)}
aiRows().forEach(o=>actl(o.tr,o.x));

const dev=document.createElement('section');dev.id='device';
dev.innerHTML=`<div class="wrap"><h2>기기 점검</h2>
<p class="lead">지금 쓰는 기기에서 소리, 녹음, 기록 저장이 되는지 확인합니다. 결과는 위 검수 결과에 함께 들어갑니다.</p>
<div class="cols3" style="margin-top:12px">
<div class="card"><h3 style="margin-top:0">소리</h3><p class="mut" id="dvvoices" style="font-size:14px"></p><button type="button" class="btn sm" id="dvplay" style="margin-top:10px">소리 시험</button><p class="msg" id="dvsmsg" aria-live="polite"></p><div class="rvrow" id="dvheard" hidden><span style="font-weight:700">영어 문장이 들렸나요?</span><button type="button" class="btn ghost sm" data-h="yes">들렸어요</button><button type="button" class="btn ghost sm" data-h="no">안 들렸어요</button></div></div>
<div class="card"><h3 style="margin-top:0">녹음</h3><p class="mut" style="font-size:14px">마이크 허용을 물으면 허용을 눌러 주세요. 3초 동안 녹음합니다. 녹음은 이 기기 밖으로 나가지 않습니다.</p><button type="button" class="btn sm" id="dvmic" style="margin-top:10px">마이크 시험 (3초)</button><p class="msg" id="dvmmsg" aria-live="polite"></p><div id="dvaudio"></div></div>
<div class="card"><h3 style="margin-top:0">기록 저장</h3><p id="dvstore"></p><p class="mut" id="dvapp" style="font-size:14px;margin-top:6px"></p></div>
</div></div>`;
const plan=$('#plan');plan.parentNode.insertBefore(dev,plan);
if(location.hash==='#device')dev.scrollIntoView();

/* ---------- 기기 점검 동작 ---------- */
const hasTTS='speechSynthesis' in window&&typeof SpeechSynthesisUtterance!=='undefined';
function voices(){const el=$('#dvvoices');if(!hasTTS){el.textContent='이 브라우저는 음성 읽기를 지원하지 않습니다.';return}
  const en=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));el.textContent=en.length?`영어 음성 ${en.length}종: ${en.slice(0,4).map(v=>v.name.replace(/Microsoft |Google /,'').split(' - ')[0]).join(', ')}${en.length>4?' 등':''}`:'영어 음성을 찾지 못했습니다. 기본 음성으로 읽습니다.'}
voices();if(hasTTS&&speechSynthesis.addEventListener)speechSynthesis.addEventListener('voiceschanged',voices);
$('#dvplay').onclick=()=>{const m=$('#dvsmsg'),hd=$('#dvheard');hd.hidden=true;
  if(!hasTTS){S.dev.sound={r:'지원 안 함'};save();m.className='msg no';m.textContent='이 브라우저는 음성 읽기를 지원하지 않습니다.';update();return}
  const u=new SpeechSynthesisUtterance('A cat sat on a mat.');u.lang='en-US';u.rate=.85;const v=speechSynthesis.getVoices().find(x=>/^en[-_]US/i.test(x.lang));if(v)u.voice=v;
  const t0=Date.now();let started=false;m.className='msg';m.textContent='재생 중...';
  u.onstart=()=>{started=true};
  u.onerror=e=>{S.dev.sound={r:'오류 '+e.error};save();m.className='msg no';m.textContent='소리를 재생하지 못했습니다 ('+e.error+'). 화면을 한 번 누른 뒤 다시 시험해 주세요.';update()};
  u.onend=()=>{const ms=Date.now()-t0;if(!started&&ms<250){S.dev.sound={r:'바로 끝남'};save();m.className='msg no';m.textContent='재생이 시작되지 않고 바로 끝났습니다. 이 브라우저에서는 소리가 나지 않았습니다.';update();return}
    S.dev.sound={r:'played',ms,heard:null};save();m.className='msg';m.textContent='재생이 끝났습니다 ('+(ms/1000).toFixed(1)+'초).';hd.hidden=false;update()};
  speechSynthesis.cancel();speechSynthesis.speak(u)};
$('#dvheard').onclick=e=>{const b=e.target.closest('[data-h]');if(!b||!S.dev.sound)return;S.dev.sound.heard=b.dataset.h;save();const m=$('#dvsmsg');m.className='msg '+(b.dataset.h==='yes'?'ok':'no');m.textContent=b.dataset.h==='yes'?'소리가 정상입니다.':'재생은 됐지만 들리지 않았습니다. 기기 음량과 음소거를 확인해 주세요.';$('#dvheard').hidden=true;update()};
$('#dvmic').onclick=async()=>{const m=$('#dvmmsg'),out=$('#dvaudio'),btn=$('#dvmic');out.innerHTML='';
  try{if(!navigator.mediaDevices||typeof MediaRecorder==='undefined')throw{name:'지원 안 함'};
    const st=await navigator.mediaDevices.getUserMedia({audio:true}),chunks=[],mr=new MediaRecorder(st);btn.disabled=true;m.className='msg';m.textContent='녹음 중... 아무 말이나 해 보세요.';
    mr.ondataavailable=e=>chunks.push(e.data);
    mr.onstop=()=>{st.getTracks().forEach(t=>t.stop());btn.disabled=false;out.innerHTML='<audio controls src="'+URL.createObjectURL(new Blob(chunks,{type:mr.mimeType}))+'" style="max-width:100%;margin-top:8px"></audio>';S.dev.mic={r:'recorded'};save();m.className='msg ok';m.textContent='녹음됐습니다. 아래에서 들어 보세요.';update()};
    mr.start();setTimeout(()=>{if(mr.state==='recording')mr.stop()},3000)}
  catch(e){btn.disabled=false;S.dev.mic={r:'failed',why:e&&e.name||'알 수 없음'};save();m.className='msg no';m.textContent='마이크를 쓸 수 없습니다 ('+S.dev.mic.why+'). 브라우저의 마이크 허용을 확인해 주세요.';update()}};
(()=>{let ok=false;try{localStorage.setItem('readstep.test','1');ok=localStorage.getItem('readstep.test')==='1';localStorage.removeItem('readstep.test')}catch(e){}
  S.dev.store=ok;const el=$('#dvstore');el.className='msg '+(ok?'ok':'no');el.textContent=ok?'이 브라우저에 기록을 저장할 수 있습니다.':'이 브라우저에는 기록을 저장할 수 없습니다. 사생활 보호 모드인지 확인해 주세요.';
  let has=false;try{has=!!localStorage.getItem('readstep.v1')}catch(e){}$('#dvapp').textContent=has?'이 기기에 학습 기록이 있습니다.':'이 기기에는 아직 학습 기록이 없습니다.'})();

/* ---------- 이벤트 ---------- */
document.addEventListener('click',e=>{const t=e.target;
  const m=t.closest('.rvmode');if(m){setMode(!S.on);update();return}
  const all=t.closest('.rvall');if(all){$$('[data-rk]',all.closest('.bk')).forEach(el=>{if(!valid(el)){S.v[el.dataset.rk]={s:'ok',n:'',h:hash(el.dataset.rt)};ctl(el)}});save();update();return}
  const b=t.closest('.rvb button');if(!b)return;const s=b.dataset.s,tr=b.closest('tr[data-ak]'),row=tr?null:b.closest('[data-rk]');
  if(tr){const k=tr.dataset.ak,cur=S.ai[k];if(cur&&cur.s===s)delete S.ai[k];else S.ai[k]={s,n:cur?cur.n||'':''};save();const o=aiRows().find(x=>x.tr===tr);actl(tr,o.x);const f=(S.ai[k]&&s==='other'&&$('.rvn',tr))||$(`.rvb button[data-s="${s}"]`,tr);if(f)f.focus()}
  else if(row){const k=row.dataset.rk,cur=valid(row);if(cur&&cur.s===s)delete S.v[k];else S.v[k]={s,n:cur?cur.n||'':'',h:hash(row.dataset.rt)};save();ctl(row);const c=$(':scope > .rvc',row),f=(S.v[k]&&s!=='ok'&&$('.rvn',c))||$(`.rvb button[data-s="${s}"]`,c);if(f)f.focus()}
  update()});
document.addEventListener('input',e=>{const t=e.target;if(!t.classList)return;
  if(t.id==='rvname'){S.name=t.value.trim();save();update();return}
  if(!t.classList.contains('rvn'))return;const tr=t.closest('tr[data-ak]'),row=tr?null:t.closest('[data-rk]');
  if(tr&&S.ai[tr.dataset.ak])S.ai[tr.dataset.ak].n=t.value;else if(row&&S.v[row.dataset.rk])S.v[row.dataset.rk].n=t.value;save();update()});
$('#rvcopy').onclick=async()=>{const t=$('#rvout'),m=$('#rvmsg');try{await navigator.clipboard.writeText(t.value);m.textContent='복사했습니다. 메신저나 메일에 붙여 넣어 보내 주세요.'}catch(e){t.focus();t.select();m.textContent='결과를 선택했습니다. Ctrl+C로 복사해 주세요.'}};
$('#rvclear').onclick=()=>{if(!confirm('이 기기에 저장된 판정과 결정을 모두 지울까요? 되돌릴 수 없습니다.'))return;S.v={};S.ai={};save();if(S.on)drawAll();aiRows().forEach(o=>actl(o.tr,o.x));update();$('#rvmsg').textContent='모두 지웠습니다.'};
setMode(!!S.on);update();
})();
