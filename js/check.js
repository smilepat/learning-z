/* ReadStep 책 데이터 검사. tools/check.html 과 dev/index.html 이 함께 쓴다.
   RS_CHECK(데이터) 는 {errors, warnings, rows, pos, byStep, books, quiz, pictures, glossary} 를 돌려준다. */
window.RS_CHECK=function(D){
D=D||window.RS_DATA||{};
if(!D.BOOKS||!D.SP||!D.STEPS||!D.G)return{fatal:true,errors:['데이터 파일을 읽지 못했습니다. data/books.js 의 문법 오류(따옴표, 쉼표, 괄호)를 확인하세요.'],warnings:[],rows:[],pos:[0,0,0],byStep:[],books:0,quiz:0,pictures:0,glossary:0};
const {BOOKS,SP,STEPS,G}=D,PL=D.PLACEMENT||[],errors=[],warnings=[],rows=[];
const words=t=>t.toLowerCase().match(/[a-z']+/g)||[];
const SKILLS=['detail','vocab','main','seq','infer'];
const ids=new Set();
for(const b of BOOKS){
  const E=m=>errors.push(`[${b.id}] ${m}`),W=m=>warnings.push(`[${b.id}] ${m}`);
  if(!b.id||ids.has(b.id))E('id가 없거나 다른 책과 겹칩니다.');ids.add(b.id);
  const st=STEPS[b.step-1];if(!st){E('단계 번호가 잘못되었습니다: '+b.step);continue}
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
  else if(b.step===1)W('1단계 책인데 소리 글자(focus)가 없습니다.');
  if(window.RS_CHUNK){const nb=window.RS_CHUNK.pick(b).length;if(nb<2)W(`다시 세우기에 쓸 문장이 ${nb}개뿐입니다(조각이 3~7개인 문장이 필요).`);
    const ko=((window.RS_L1||{}).chunks||{})[b.id];
    if(ko){const used=new Set();b.pages.forEach((p,pi)=>window.RS_CHUNK.lines(p[0]).forEach(c=>{used.add(c.k);if(!ko[c.k])W(`${pi+1}쪽 덩어리 "${c.k}"의 우리말 풀이가 없습니다(data/chunks-ko.js).`)}));
      Object.keys(ko).forEach(k=>{if(!used.has(k))W(`쓰이지 않는 덩어리 풀이 "${k}" (끊어 읽기 규칙이나 본문이 바뀌었을 수 있음).`)})}}
  const inRange=all.length>=st.min&&all.length<=st.max,pgOk=!st.pages||(b.pages.length>=st.pages[0]&&b.pages.length<=st.pages[1]);
  if(!inRange)W(`낱말 수 ${all.length}개가 ${b.step}단계 기준(${st.min}~${st.max})을 벗어났습니다.`);
  if(!pgOk)W(`쪽 수 ${b.pages.length}쪽이 ${b.step}단계 기준(${st.pages[0]}~${st.pages[1]})을 벗어났습니다.`);
  const longest=Math.max(...b.pages.map(p=>words(p[0]).length));
  rows.push({id:b.id,title:b.title,step:b.step,pages:b.pages.length,words:all.length,range:st.min+'~'+st.max,inRange,pgOk,longest,gloss:Math.round(uniq.filter(w=>G[w]).length/uniq.length*100)});
}
for(const st of STEPS){const n=BOOKS.filter(b=>b.step===st.n).length;if(st.ready&&!n)errors.push(`[${st.n}단계] 열려 있는 단계인데 책이 없습니다.`);else if(st.ready&&n<3)warnings.push(`[${st.n}단계] 책이 ${n}권뿐입니다.`)}
for(const st of STEPS){const it=PL.find(p=>p.step===st.n);if(!it){warnings.push(`[단계 진단] ${st.n}단계 글이 없습니다.`);continue}
  if(!it.text)errors.push(`[단계 진단 ${st.n}] 글이 비었습니다.`);
  if(!Array.isArray(it.q)||it.q.length!==2)errors.push(`[단계 진단 ${st.n}] 문제는 2개여야 합니다.`);
  (it.q||[]).forEach((q,i)=>{if(!Array.isArray(q.o)||q.o.length!==3||new Set(q.o).size!==3)errors.push(`[단계 진단 ${st.n}] 문제 ${i+1}: 보기 3개가 서로 달라야 합니다.`);if(!(q.a>=0&&q.a<3))errors.push(`[단계 진단 ${st.n}] 문제 ${i+1}: 정답 번호가 잘못되었습니다.`)})}
const pos=[0,0,0];BOOKS.forEach(b=>(b.quiz||[]).forEach(q=>{if(q.a>=0&&q.a<3)pos[q.a]++}));
const byStep=STEPS.map(st=>({n:st.n,name:st.name,books:BOOKS.filter(b=>b.step===st.n).length}));
return{errors,warnings,rows,pos,byStep,books:BOOKS.length,quiz:BOOKS.reduce((n,b)=>n+(b.quiz?b.quiz.length:0),0),pictures:Object.keys(SP).length,glossary:Object.keys(G).length};
};
