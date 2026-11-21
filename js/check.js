/* ReadStep 책 데이터 검사. tools/check.html 과 dev/index.html 이 함께 쓴다.
   RS_CHECK(데이터) 는 {errors, warnings, rows, pos, byStep, byLevel, byTopic, totals, books, quiz, pictures, glossary} 를 돌려준다.
   v0.9(2026-11-20): 세부 레벨 기준(data/levels.js), 낱말 목록 범위(data/wordlist.js), 파닉스 해독 가능 비율,
   참고 서비스 제목 중복(tools/ref-titles.js), 1,500권 배분 현황을 함께 본다. 기준과 근거는 docs/LIBRARY_PLAN.md. */
/* 낱말 원형 후보: 불규칙형 표, 복수형, -ed, -ing, 비교급, -ly */
window.RS_LEMMA=function(w,FORMS){w=w.toLowerCase().replace(/^'+|'+$/g,'');const c=[w],F=FORMS||{};if(F[w])c.push(F[w].toLowerCase());
  if(/'s$/.test(w))c.push(w.slice(0,-2));if(/ies$/.test(w))c.push(w.slice(0,-3)+'y');if(/es$/.test(w))c.push(w.slice(0,-2));if(/s$/.test(w))c.push(w.slice(0,-1));
  if(/ied$/.test(w))c.push(w.slice(0,-3)+'y');if(/ed$/.test(w)){c.push(w.slice(0,-2),w.slice(0,-1));if(/(.)\1ed$/.test(w))c.push(w.slice(0,-3))}
  if(/ing$/.test(w)){c.push(w.slice(0,-3),w.slice(0,-3)+'e');if(/(.)\1ing$/.test(w))c.push(w.slice(0,-4))}
  if(/er$/.test(w)){c.push(w.slice(0,-2),w.slice(0,-1));if(/ier$/.test(w))c.push(w.slice(0,-3)+'y');if(/(.)\1er$/.test(w))c.push(w.slice(0,-3))}
  if(/est$/.test(w)){c.push(w.slice(0,-3),w.slice(0,-2));if(/iest$/.test(w))c.push(w.slice(0,-4)+'y');if(/(.)\1est$/.test(w))c.push(w.slice(0,-4))}
  if(/ly$/.test(w))c.push(w.slice(0,-2));return c};
/* 파닉스 단계별 해독 가능 낱말 모양(누적). P1 은 글자와 첫소리 단계라 해독 비율을 재지 않는다.
   P2 단모음 CVC(+ck, ll, ss, ff, zz, -s), P3 silent e, P4 연속자음과 이중자음(+ -es, -ed, -ing), P5 모음 조합, r 통제 모음, 끝소리 y */
window.RS_DECODE=(()=>{const C='[bcdfghjklmnpqrstvwxz]',ON4='(?:spl|spr|str|scr|shr|thr|squ|bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr|tw|sh|ch|th|wh|qu|'+C+')',
  CO2='(?:'+C+'|ck|ll|ss|ff|zz)',CO4='(?:tch|nch|sh|ch|th|ng|nk|nd|nt|mp|st|sk|sp|lt|lk|ld|ft|pt|ct|xt|ck|ll|ss|ff|zz|'+C+')',VT='(?:igh|ai|ay|ee|ea|oa|ow|oe|oo|ou|oi|oy|ar|or|er|ir|ur|aw|au|ew|ue|ie)';
  const R={P2:[new RegExp('^'+C+'?[aeiou]'+CO2+'s?$')],P3:[new RegExp('^'+C+'?[aeiou]'+C+'es?$')],
    P4:[new RegExp('^'+ON4+'?[aeiou]'+CO4+'?(?:s|es|ed|ing)?$'),new RegExp('^'+ON4+'?[aeiou]'+C+'e(?:s|d)?$')],
    P5:[new RegExp('^'+ON4+'?'+VT+CO4+'?e?(?:s|es|ed|ing|er)?$'),new RegExp('^'+ON4+'y$')]};
  const ORDER=['P1','P2','P3','P4','P5'];
  return function(w,ph){w=w.toLowerCase();const k=ORDER.indexOf(ph);if(k<1)return false;for(let i=1;i<=k;i++)if(R[ORDER[i]].some(r=>r.test(w)))return true;return false}})();
window.RS_TITLEKEY=t=>{const s=String(t).toLowerCase().replace(/\(part \d+\)/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim().replace(/^(the|a|an) /,'');let h=0x811c9dc5;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,0x01000193)>>>0}return{s,h:h.toString(36)}};
window.RS_CHECK=function(D){
D=D||window.RS_DATA||{};
if(!D.BOOKS||!D.SP||!D.STEPS||!D.G)return{fatal:true,errors:['데이터 파일을 읽지 못했습니다. data/books.js 의 문법 오류(따옴표, 쉼표, 괄호)를 확인하세요.'],warnings:[],rows:[],pos:[0,0,0],byStep:[],books:0,quiz:0,pictures:0,glossary:0};
const {BOOKS,SP,STEPS,G}=D,PL=D.PLACEMENT||[],errors=[],warnings=[],rows=[];
const LV=D.LV||{},LEVELS=D.LEVELS||[],TOPICS=D.TOPICS||[],TYPES=D.TYPES||{},WL=D.WORDLIST,TRACKS=['listen','phonics','pattern','story'];
const REF=window.RS_REF_TITLES?new Set(window.RS_REF_TITLES.h.split(' ')):null,seenT={};
const NAMES=new Set(((WL&&WL.NAMES)||[]).map(n=>n.toLowerCase()));
const sightTo=ph=>{const o=['P1','P2','P3','P4','P5'],k=o.indexOf(ph),s=new Set();if(WL)for(let i=0;i<=k;i++)(WL.SIGHT[o[i]]||[]).forEach(w=>s.add(w.toLowerCase()));return s};
const isFic=b=>b.fic!=null?!!b.fic:!!(TYPES[b.type]||{}).fic;
const sents=t=>t.split(/(?<=[.!?]["\u201d]?)\s+/).filter(Boolean);
const words=t=>t.toLowerCase().match(/[a-z']+/g)||[];
const SKILLS=['detail','vocab','main','seq','infer'];
const ids=new Set();
for(const b of BOOKS){
  const E=m=>errors.push(`[${b.id}] ${m}`),W=m=>warnings.push(`[${b.id}] ${m}`);
  if(!b.id||ids.has(b.id))E('id가 없거나 다른 책과 겹칩니다.');ids.add(b.id);
  const st=STEPS[b.step-1];if(!st){E('단계 번호가 잘못되었습니다: '+b.step);continue}
  const lv=LV[b.lv];if(LEVELS.length){if(!lv)E('세부 레벨(lv)이 없거나 잘못되었습니다: '+b.lv);else if(lv.step!==b.step)E(`세부 레벨 ${b.lv}은 ${lv.step}단계인데 step 값이 ${b.step}입니다.`)}
  if(LEVELS.length){if(!TRACKS.includes(b.track))E('갈래(track)가 잘못되었습니다: '+b.track+' (listen, phonics, pattern, story)');
    if(!TOPICS.includes(b.topic))E('주제(topic)가 12개 주제에 없습니다: '+b.topic);
    if(!['asia','global'].includes(b.region))E('소재 지역(region)은 asia 또는 global 이어야 합니다: '+b.region);
    if(b.track==='phonics'&&!b.ph)E('파닉스 해독책인데 파닉스 단계(ph)가 없습니다.');
    if(b.type&&!TYPES[b.type])E('책 종류(type)가 목록에 없습니다: '+b.type);}
  if(b.title){const k=window.RS_TITLEKEY(b.title);if(REF&&REF.has(k.h))E(`제목 "${b.title}"이 참고 서비스 공개 목록의 제목과 같습니다. 제목을 바꾸세요.`);
    if(seenT[k.s])E(`제목 "${b.title}"이 다른 책(${seenT[k.s]})과 같습니다.`);seenT[k.s]=b.id}
  for(const k of ['title','type'])if(!b[k])E(k+' 값이 없습니다.');
  if(/[\uAC00-\uD7A3]/.test(JSON.stringify(b)))E('책 데이터에 한글이 있습니다. 책에 딸린 글은 모두 영어로 적습니다.');
  if(!Array.isArray(b.pages)||!b.pages.length){E('본문(pages)이 없습니다.');continue}
  const all=b.pages.flatMap(p=>words(p[0])),uniq=[...new Set(all)];
  b.pages.forEach((p,i)=>{if(!p[0]||!p[0].trim())E(`${i+1}쪽 본문이 비었습니다.`);if(!Array.isArray(p[1])||!p[1].length)E(`${i+1}쪽에 그림이 없습니다.`);else{if(p[1].length>3)W(`${i+1}쪽 그림이 3개를 넘습니다(모바일에서 작아짐).`);p[1].forEach(s=>{if(!SP[s])E(`${i+1}쪽 그림 "${s}"가 pictures.js 에 없습니다.`)})}});
  (b.cover||[]).forEach(s=>{if(!SP[s])E(`표지 그림 "${s}"가 없습니다.`)});if(!b.cover||!b.cover.length)E('표지 그림(cover)이 없습니다.');
  if(!Array.isArray(b.quiz)||b.quiz.length!==5)E('퀴즈는 5문항이어야 합니다. 현재 '+(b.quiz?b.quiz.length:0)+'문항.');
  (b.quiz||[]).forEach((q,i)=>{const n=i+1;
    if(!q.q)E(`퀴즈 ${n}: 질문이 없습니다.`);
    if(!Array.isArray(q.o)||q.o.length!==3)E(`퀴즈 ${n}: 보기는 3개여야 합니다.`);else if(new Set(q.o).size!==3)E(`퀴즈 ${n}: 같은 보기가 있습니다.`);
    if(!(q.a>=0&&q.o&&q.a<q.o.length))E(`퀴즈 ${n}: 정답 번호(a)가 범위를 벗어났습니다.`);
    if(!SKILLS.includes(q.s))E(`퀴즈 ${n}: 유형(s)이 잘못되었습니다: ${q.s}`);
    if(!(q.p>=1&&q.p<=b.pages.length))E(`퀴즈 ${n}: 근거 쪽(p)이 책에 없습니다.`);
    else if(q.s==='vocab'){if(!q.w)E(`퀴즈 ${n}: 낱말 문제에 w 값이 없습니다.`);else{if(!words(b.pages[q.p-1][0]).includes(q.w))E(`퀴즈 ${n}: 낱말 "${q.w}"가 ${q.p}쪽에 없습니다.`);if(!G[q.w])E(`퀴즈 ${n}: 낱말 "${q.w}"의 뜻이 낱말 풀이(G)에 없습니다.`)}}});
  if(b.quiz&&!b.quiz.some(q=>q.s==='vocab'))W('낱말 문제가 없습니다.');
  if(b.focus){for(const w of b.focus.words){if(!all.includes(w))E(`소리 글자 낱말 "${w}"가 본문에 없습니다.`);if(!w.includes(b.focus.letter))E(`소리 글자 "${b.focus.letter}"가 "${w}"에 없습니다.`)}}
  else if(b.track==='phonics'&&b.ph!=='P1')W('파닉스 해독책인데 소리 글자(focus)가 없습니다.');
  if(window.RS_CHUNK){const nb=window.RS_CHUNK.pick(b).length;if(nb<2)W(`다시 세우기에 쓸 문장이 ${nb}개뿐입니다(조각이 3~7개인 문장이 필요).`);
    const PKS=window.RS_PACKS||{};
    for(const pc in PKS){const pk=PKS[pc],ko=(pk.chunks||{})[b.id];
      if(ko){const used=new Set();b.pages.forEach((p,pi)=>window.RS_CHUNK.lines(p[0]).forEach(c=>{used.add(c.k);if(!ko[c.k])W(`${pi+1}쪽 덩어리 "${c.k}"의 ${pk.name} 풀이가 없습니다(data/chunks-${pc}.js).`)}));
        Object.keys(ko).forEach(k=>{if(!used.has(k))W(`쓰이지 않는 ${pk.name} 덩어리 풀이 "${k}" (끊어 읽기 규칙이나 본문이 바뀌었을 수 있음).`)})}
      if(b===BOOKS[0]){const miss=Object.keys(G).filter(w=>!(pk.words||{})[w]),extra=Object.keys(pk.words||{}).filter(w=>!(w in G));
        if(miss.length)warnings.push(`[${pk.name} 묶음] 뜻이 없는 낱말 ${miss.length}개: ${miss.slice(0,12).join(', ')}${miss.length>12?' ...':''}`);
        if(extra.length)warnings.push(`[${pk.name} 묶음] 낱말 풀이(G)에 없는 낱말 ${extra.length}개: ${extra.slice(0,12).join(', ')}`);
        const nt=BOOKS.filter(x=>!(pk.titles||{})[x.id]).map(x=>x.id);if(nt.length)warnings.push(`[${pk.name} 묶음] 제목이 없는 책: ${nt.join(', ')}`)}}}
  const R=lv||st,RL=lv?'레벨 '+b.lv:b.step+'단계';
  const inRange=all.length>=R.min&&all.length<=R.max,pgOk=!R.pages||(b.pages.length>=R.pages[0]&&b.pages.length<=R.pages[1]);
  if(!inRange)W(`낱말 수 ${all.length}개가 ${RL} 기준(${R.min}~${R.max})을 벗어났습니다.`);
  if(!pgOk)W(`쪽 수 ${b.pages.length}쪽이 ${RL} 기준(${R.pages[0]}~${R.pages[1]})을 벗어났습니다.`);
  const longest=Math.max(...b.pages.map(p=>words(p[0]).length));
  const ss=b.pages.map(p=>sents(p[0])),maxS=Math.max(...ss.flat().map(s=>words(s).length)),maxSpp=Math.max(...ss.map(x=>x.length));
  if(lv&&maxS>lv.sent)W(`가장 긴 문장이 ${maxS}낱말로 레벨 ${b.lv} 기준(${lv.sent}낱말 이하)보다 깁니다.`);
  if(lv&&maxSpp>lv.spp)W(`한 쪽에 문장이 ${maxSpp}개로 레벨 ${b.lv} 기준(${lv.spp}개 이하)보다 많습니다.`);
  /* 낱말 목록 범위: 1단계는 Word Spotter 목록, 2단계는 누적 목록. 3단계 이상은 목록 준비 전이라 재지 않는다. 이름은 세지 않는다. */
  let cov=null,outW=[];const set=WL&&WL.sets[b.step];
  /* 그림으로 뜻을 아는 새 낱말(newWords): 낱말 목록 밖이어도 세지 않는다. 1단계 4개, 2단계 6개까지 */
  const NW=(b.newWords||[]).map(w=>w.toLowerCase()),nwMax=b.step===1?4:6;if(NW.length>nwMax)W(`새 낱말(newWords)이 ${NW.length}개로 ${b.step}단계 기준(${nwMax}개 이하)보다 많습니다.`);
  NW.forEach(w=>{if(!all.some(t=>window.RS_LEMMA(t,WL&&WL.FORMS).includes(w)))E(`새 낱말 "${w}"이 본문에 없습니다.`)});
  if(set){const toks=b.pages.flatMap(p=>p[0].match(/[A-Za-z']+/g)||[]).map(t=>t.toLowerCase()).filter(t=>!NAMES.has(t)&&!window.RS_LEMMA(t,WL.FORMS).some(c=>NW.includes(c))),fw=new Set(((b.focus||{}).words)||[]);
    outW=toks.filter(t=>!fw.has(t)&&!window.RS_LEMMA(t,WL.FORMS).some(c=>set.has(c)));cov=toks.length?Math.round((1-outW.length/toks.length)*100):100;
    const need=b.step===1?95:90;if(cov<need)W(`낱말 목록 안의 낱말이 ${cov}%입니다(${b.step}단계 기준 ${need}% 이상). 목록 밖: ${[...new Set(outW)].slice(0,10).join(', ')}`)}
  /* 파닉스 해독책: 배운 소리 규칙 + 배운 사이트 워드 + 이름 + 소리 글자 낱말로 읽을 수 있는 비율 */
  let dec=null;if(b.track==='phonics'&&b.ph&&b.ph!=='P1'){const sg=sightTo(b.ph),fw=new Set(((b.focus||{}).words)||[]),toks=b.pages.flatMap(p=>p[0].match(/[A-Za-z']+/g)||[]);
    const bad=toks.filter(t=>{const l=t.toLowerCase();return!(NAMES.has(l)||sg.has(l)||fw.has(l)||window.RS_DECODE(l,b.ph))});dec=toks.length?Math.round((1-bad.length/toks.length)*100):100;
    if(dec<85)W(`해독 가능 비율이 ${dec}%입니다(${b.ph} 기준 85% 이상). 읽기 어려운 낱말: ${[...new Set(bad.map(x=>x.toLowerCase()))].slice(0,10).join(', ')}`)}
  rows.push({id:b.id,title:b.title,step:b.step,lv:b.lv||'',track:b.track||'',ph:b.ph||'',topic:b.topic||'',region:b.region||'',fic:isFic(b),pages:b.pages.length,words:all.length,range:R.min+'~'+R.max,inRange,pgOk,longest,maxS,cov,dec,gloss:Math.round(uniq.filter(w=>G[w]).length/uniq.length*100)});
}
for(const st of STEPS){const n=BOOKS.filter(b=>b.step===st.n).length;if(st.ready&&!n)errors.push(`[${st.n}단계] 열려 있는 단계인데 책이 없습니다.`);else if(st.ready&&n<3)warnings.push(`[${st.n}단계] 책이 ${n}권뿐입니다.`)}
for(const st of STEPS){if(st.ready===false)continue;const it=PL.find(p=>p.step===st.n);if(!it){warnings.push(`[단계 진단] ${st.n}단계 글이 없습니다.`);continue}
  if(!it.text)errors.push(`[단계 진단 ${st.n}] 글이 비었습니다.`);
  if(!Array.isArray(it.q)||it.q.length!==2)errors.push(`[단계 진단 ${st.n}] 문제는 2개여야 합니다.`);
  (it.q||[]).forEach((q,i)=>{if(!Array.isArray(q.o)||q.o.length!==3||new Set(q.o).size!==3)errors.push(`[단계 진단 ${st.n}] 문제 ${i+1}: 보기 3개가 서로 달라야 합니다.`);if(!(q.a>=0&&q.a<3))errors.push(`[단계 진단 ${st.n}] 문제 ${i+1}: 정답 번호가 잘못되었습니다.`)})}
const pos=[0,0,0];BOOKS.forEach(b=>(b.quiz||[]).forEach(q=>{if(q.a>=0&&q.a<3)pos[q.a]++}));
const byStep=STEPS.map(st=>({n:st.n,name:st.name,books:BOOKS.filter(b=>b.step===st.n).length,target:st.target||0}));
/* 1,500권 배분 현황(data/levels.js 의 목표값과 비교) */
const byLevel=LEVELS.map(l=>{const bs=BOOKS.filter(b=>b.lv===l.id),tr={};TRACKS.forEach(t=>{tr[t]=bs.filter(b=>b.track===t).length});
  return{id:l.id,step:l.step,name:(STEPS[l.step-1]||{}).name,books:bs.length,target:l.target,asia:bs.filter(b=>b.region==='asia').length,asiaT:l.asia,fic:bs.filter(isFic).length,ficT:l.fic,tracks:tr,tracksT:l.tracks||null}});
const byTopic=TOPICS.map(t=>({topic:t,books:BOOKS.filter(b=>b.topic===t).length,bySteps:STEPS.map(s=>BOOKS.filter(b=>b.topic===t&&b.step===s.n).length)}));
const totals={books:BOOKS.length,target:D.LIBRARY_TARGET||0,asia:BOOKS.filter(b=>b.region==='asia').length,fic:BOOKS.filter(isFic).length,refTitles:window.RS_REF_TITLES?window.RS_REF_TITLES.n:0,wordlist:WL?WL.sets[2].size:0};
return{errors,warnings,rows,pos,byStep,byLevel,byTopic,totals,books:BOOKS.length,quiz:BOOKS.reduce((n,b)=>n+(b.quiz?b.quiz.length:0),0),pictures:Object.keys(SP).length,glossary:Object.keys(G).length};
};
