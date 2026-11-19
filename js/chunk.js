/* 끊어 읽기 단위 만들기. 앱(읽기 화면의 끊어 읽기, 다시 세우기)과 개발 현황판, 검사 도구가 함께 쓴다.
   규칙 기반이라 같은 글에는 늘 같은 결과가 나온다. AI를 쓰지 않는다.
   규칙(자체 기준, 잠정. 근거와 예외는 docs/level-guide.md 8절과 docs/chunk-review-2026-11-19.md):
   1) 낱말이 두 개 이상 모인 뒤 BREAK 낱말(전치사, 접속사)이나 쉼표를 만나면 끊는다.
   2) and, or, but 은 뒤에 낱말이 두 개 이상 이어질 때만 끊는다(big and red, food and oxygen to ... 는 끊지 않음).
      문장의 첫 덩어리에서는 앞에 낱말이 세 개 이상 있어야 끊는다(The cat and the rat ... 같은 주어를 가르지 않으려는 것).
   3) that 은 뒤에 절이 이어질 때만, next 는 next to 일 때만, to 는 수 사이(nine to eleven)가 아닐 때만 끊는다.
      as ... as 의 두 번째 as, 어림을 뜻하는 about(about ninety, about as big) 앞에서는 끊지 않는다.
      when, suddenly, 처럼 접속사 바로 뒤에 끼어든 말의 쉼표에서는 끊지 않는다.
   4) "to + 낱말 하나"(to play, to her)는 앞 덩어리에 붙인다(합쳐서 일곱 낱말까지).
   5) KEEP 에 적은 두 낱말 사이는 끊지 않는다. 규칙으로 못 잡는 문장을 사람이 여기에 적는다.
   6) 끊을 곳이 없으면 억지로 끊지 않는다. 어색한 덩어리를 만드는 것보다 표시하지 않는 편이 낫기 때문이다. */
window.RS_CHUNK=(()=>{
const BREAK=new Set('in on at to for with from into under over behind around after before and but or because when that than about through toward as until while if inside next across during near by'.split(' '));
const JOIN=new Set(['and','or','but']);
const NUM=new Set('one two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty sixty seventy eighty ninety hundred'.split(' '));
const ABBR=new Set(['mr','ms','mrs','dr']);
/* 끊지 않을 자리(앞 낱말 + 뒤 낱말). 2026-11-19 훑어보기에서 나온 것 */
const KEEP=new Set(['came in','spin around','body and','hat and','get on','gets on','got on']);
/* 접속사로 시작한 덩어리는 낱말 두 개 이하일 때 쉼표에서 끊지 않는다 */
const SUB=new Set(['when','because','while','if','that','until']);
/* 자리를 바꿔도 말이 되는 덩어리(전치사구)를 찾을 때 쓰는 낱말 */
const PREP=new Set('in on at for with from into under over behind around after before about through toward inside across during near by like'.split(' '));
/* 글을 문장으로 나눈다. 마침표, 물음표, 느낌표 뒤에 대문자로 시작하는 낱말이 오면 새 문장이다.
   ("Oh no!" said Sora. 의 said 는 소문자라 같은 문장이고, Ms. Lee 의 Lee 는 호칭 뒤라 같은 문장이다.) */
function sentences(text){const out=[];let cur=null,prev=null,re=/[A-Za-z0-9']+/g,m;
  while((m=re.exec(text))){const gap=prev?text.slice(prev.end,m.index):'',abbr=!!prev&&ABBR.has(prev.w.toLowerCase());
    if(!cur||(!abbr&&/[.!?]/.test(gap)&&/^[A-Z]/.test(m[0]))){cur={words:[]};out.push(cur)}
    const x={i:m.index,end:m.index+m[0].length,w:m[0],comma:cur.words.length>0&&!abbr&&/[,;:.!?]/.test(gap)};cur.words.push(x);prev=x}
  out.forEach(s=>{s.end=s.words[s.words.length-1].end;s.talk=/["\u201C\u201D]/.test(text.slice(Math.max(0,s.words[0].i-1),s.end+3))});return out}
/* k번째 낱말 앞에서 끊을지 */
function cut(W,k,n,first,c0){const x=W[k],w=x.w.toLowerCase(),p=W[k-1].w.toLowerCase(),nx=W[k+1]?W[k+1].w.toLowerCase():'';
  if(n<2)return false;if(x.comma)return!(n<=2&&SUB.has(c0));if(!BREAK.has(w)||KEEP.has(p+' '+w))return false;
  const endAt=j=>j>=W.length-1||W[j+1].comma;
  if(JOIN.has(w)){if(first&&n<3)return false;let c=0;for(let j=k+1;j<W.length;j++){if(BREAK.has(W[j].w.toLowerCase()))break;c++;if(endAt(j))break}return c>=2}
  if(w==='that')return!!nx&&!endAt(k+1)&&!BREAK.has(W[k+2].w.toLowerCase());
  if(w==='next')return nx==='to';
  if(w==='to'&&NUM.has(p))return false;
  if(w==='as'&&(p==='about'||(k>=2&&W[k-2].w.toLowerCase()==='as')))return false;
  if(w==='about'&&(NUM.has(nx)||nx==='as'))return false;
  return true}
/* 한 문장을 뜻 덩어리(낱말 묶음)로 나눈다. */
function chunks(s){const W=s.words,out=[];let cur=[];
  W.forEach((x,k)=>{if(k>0&&cut(W,k,cur.length,!out.length,cur.length?cur[0].w.toLowerCase():'')){out.push(cur);cur=[]}cur.push(x)});
  if(cur.length)out.push(cur);
  for(let k=1;k<out.length;k++){const c=out[k];if(c.length===2&&c[0].w.toLowerCase()==='to'&&!c[0].comma&&out[k-1].length+2<=7){out[k-1].push(...c);out.splice(k,1);k--}}
  if(out.length>1&&out[out.length-1].length===1){const l=out.pop();out[out.length-1].push(...l)}
  return out}
/* 조각의 글자. 바로 뒤의 쉼표와 호칭의 마침표는 함께 둔다. */
function slice(text,a){const l=a[a.length-1];let e=l.end;if(/[,;]/.test(text[e]||'')||(text[e]==='.'&&ABBR.has(l.w.toLowerCase())))e++;return text.slice(a[0].i,e)}
/* 다시 세우기에 쓸 조각. 낱말이 여섯 개 이하인 문장은 낱말 하나씩, 더 긴 문장은 뜻 덩어리로. */
function units(text,s){const g=s.words.length<=6?s.words.map(x=>[x]):chunks(s);return g.map(a=>slice(text,a))}
/* 읽기 화면에서 끊는 표시(/)를 넣을 낱말의 시작 위치 */
function starts(text){const set=new Set();sentences(text).forEach(s=>chunks(s).slice(1).forEach(a=>set.add(a[0].i)));return set}
/* 한 쪽의 모든 덩어리. t 는 보여 줄 글자, k 는 덩어리별 우리말 풀이를 찾는 열쇠(낱말만 이은 것) */
function lines(text){const out=[];sentences(text).forEach(s=>chunks(s).forEach(a=>out.push({t:slice(text,a),k:a.map(x=>x.w).join(' ')})));return out}
/* 덩어리 순서를 바꿔도 말이 되기 쉬운 문장인지. 전치사구 뒤에 전치사구나 and 덩어리가 바로 오면 그렇게 본다
   (in gardens and parks / in spring and summer). 이런 문장은 다시 세우기에서 뒤로 미룬다. */
function loose(s){const g=chunks(s),f=a=>a[0].w.toLowerCase();
  for(let i=1;i+1<g.length;i++)if(PREP.has(f(g[i]))&&!g[i+1][0].comma&&(PREP.has(f(g[i+1]))||JOIN.has(f(g[i+1]))))return true;return false}
/* 책에서 다시 세우기 문장을 고른다(최대 3개). 대화문이 아니고 조각이 3~7개인 문장이 후보다.
   4단계부터: 뜻 덩어리로 세우는 긴 문장(순서가 하나로 정해지는 것) > 낱말 다섯 개 이상인 짧은 문장 > 나머지.
   3단계까지: 낱말 네 개 이상인 문장 > 나머지. 같은 묶음 안에서는 책의 앞, 가운데, 끝에서 고른다. */
function pick(book){const c=[];
  book.pages.forEach((p,pi)=>sentences(p[0]).forEach(s=>{if(s.talk)return;const u=units(p[0],s),ck=s.words.length>6;if(u.length>=3&&u.length<=7&&new Set(u).size>1)c.push({n:c.length,page:pi+1,chunked:ck,loose:ck&&loose(s),units:u,end:(p[0].slice(s.end).match(/^[.!?]+/)||['.'])[0],pics:p[1]})}));
  const tier=x=>book.step>=4?(x.chunked&&!x.loose?0:!x.chunked&&x.units.length>=5?1:x.chunked?2:3):(x.units.length>=4&&!x.loose?0:1);
  const out=[];for(let t=0;t<4&&out.length<3;t++){const g=c.filter(x=>tier(x)===t),need=3-out.length;
    if(g.length<=need)out.push(...g);else if(need===1)out.push(g[Math.floor(g.length/2)]);else if(need===2)out.push(g[0],g[g.length-1]);else out.push(g[0],g[Math.floor(g.length/2)],g[g.length-1])}
  return out.sort((a,b)=>a.n-b.n)}
return{sentences,chunks,units,starts,lines,pick}})();
