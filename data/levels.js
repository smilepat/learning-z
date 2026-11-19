/* ReadStep 단계와 세부 레벨 (1,500권 라이브러리 기준, docs/LIBRARY_PLAN.md)
   - 6단계(STEPS) 안에 세부 레벨 20개(LEVELS). 아래 단계일수록 촘촘하다.
   - 수치는 모두 자체 설계값(잠정)이다. 시범 150권을 만든 뒤 실측으로 조정한다.
   - 책은 data/books.js 에서 step(1~6)과 lv('1-3' 같은 세부 레벨)을 함께 적는다.
   - tools/check.html 이 이 값으로 책을 검사한다. 기준을 바꾸면 docs/level-guide.md 1절도 함께 고친다.
   필드: id, step, min/max(책 한 권 낱말 수), pages(쪽 수 범위), sent(한 문장 최대 낱말 수), spp(한 쪽 최대 문장 수),
         vocab(이 레벨까지 누적 어휘 목표), ph(파닉스 해독책 단계), target(1,500권 중 목표 권수), asia(그중 아시아 소재), fic(그중 픽션)
         tracks(1~2단계 갈래별 목표: listen 듣기 먼저 그림책, phonics 파닉스 해독책, pattern 반복 문장책, story 이야기와 정보글) */
window.RS_DATA=window.RS_DATA||{};
(()=>{
const LEVELS=[
{id:'1-1',step:1,min:8,max:20,pages:[5,8],sent:5,spp:1,vocab:60,ph:'P1',target:66,asia:14,fic:40,tracks:{listen:30,phonics:20,pattern:16},
 focus:'Letters and first sounds. One short sentence on a page. Label and pattern books (This is a ___.)'},
{id:'1-2',step:1,min:12,max:30,pages:[5,8],sent:6,spp:1,vocab:90,ph:'P1',target:66,asia:13,fic:40,tracks:{listen:30,phonics:20,pattern:16},
 focus:'All 26 letters and sounds. One pattern with one changing word (I see a ___.)'},
{id:'1-3',step:1,min:20,max:35,pages:[5,8],sent:8,spp:1,vocab:110,ph:'P2',target:66,asia:13,fic:40,tracks:{listen:15,phonics:13,pattern:38},
 focus:'Short a and short i words (cat, pig). One sentence on a page'},
{id:'1-4',step:1,min:20,max:40,pages:[5,8],sent:8,spp:1,vocab:130,ph:'P2',target:66,asia:13,fic:40,tracks:{listen:15,phonics:13,pattern:38},
 focus:'Short o, u, e words (fox, bug, hen). Two patterns in one book'},
{id:'1-5',step:1,min:30,max:60,pages:[5,8],sent:8,spp:2,vocab:150,ph:'P2',target:66,asia:13,fic:38,tracks:{listen:10,phonics:14,pattern:42},
 focus:'All short vowels and common sight words. Up to two sentences on a page. Simple questions (Where is ___?)'},
{id:'2-1',step:2,min:50,max:70,pages:[6,8],sent:10,spp:2,vocab:220,ph:'P3',target:78,asia:16,fic:47,tracks:{phonics:20,story:58},
 focus:'Long vowels with silent e (cake, home). Present tense, can, like, have'},
{id:'2-2',step:2,min:55,max:90,pages:[6,8],sent:11,spp:2,vocab:290,ph:'P3',target:78,asia:16,fic:47,tracks:{phonics:20,story:58},
 focus:'Questions and answers. Easy fact books in the present tense'},
{id:'2-3',step:2,min:80,max:110,pages:[6,8],sent:12,spp:3,vocab:360,ph:'P4',target:78,asia:16,fic:47,tracks:{phonics:20,story:58},
 focus:'Blends and digraphs (frog, ship, lunch). Stories in the past tense begin. and, but, then'},
{id:'2-4',step:2,min:100,max:130,pages:[7,8],sent:14,spp:4,vocab:430,ph:'P4',target:78,asia:15,fic:47,tracks:{phonics:20,story:58},
 focus:'Talking in stories (said, asked). Common irregular past forms. when, because'},
{id:'2-5',step:2,min:120,max:150,pages:[7,8],sent:15,spp:4,vocab:500,ph:'P5',target:78,asia:15,fic:46,tracks:{phonics:40,story:38},
 focus:'Vowel teams and r-controlled vowels (rain, star, bird). Fact books with numbers and steps'},
{id:'3-1',step:3,min:140,max:200,pages:[8,10],sent:15,spp:4,vocab:600,target:80,asia:16,fic:44,
 focus:'Short stories with a beginning, middle, and end. Two chapters possible'},
{id:'3-2',step:3,min:200,max:260,pages:[8,12],sent:16,spp:5,vocab:700,target:80,asia:16,fic:44,
 focus:'Characters with feelings and reasons. Fact books with headings'},
{id:'3-3',step:3,min:260,max:330,pages:[10,12],sent:17,spp:5,vocab:800,target:80,asia:16,fic:44,
 focus:'Problem and solution. Compare two things'},
{id:'3-4',step:3,min:330,max:400,pages:[10,14],sent:18,spp:6,vocab:900,target:80,asia:16,fic:44,
 focus:'Longer dialogue. Simple instructions and how-to texts'},
{id:'4-1',step:4,min:400,max:550,pages:[12,16],sent:18,spp:6,vocab:1100,target:80,asia:16,fic:40,
 focus:'Two or three short chapters. Past and future'},
{id:'4-2',step:4,min:550,max:700,pages:[12,16],sent:20,spp:7,vocab:1250,target:80,asia:16,fic:40,
 focus:'Chapters with a turning point. Fact books with diagrams'},
{id:'4-3',step:4,min:700,max:900,pages:[14,18],sent:20,spp:8,vocab:1400,target:80,asia:16,fic:40,
 focus:'Three chapters. Cause and effect, sequence words'},
{id:'5-1',step:5,min:900,max:1300,pages:[16,20],sent:22,spp:8,vocab:1700,target:70,asia:14,fic:32,
 focus:'Information texts with facts and opinions. Maps, charts, glossary'},
{id:'5-2',step:5,min:1300,max:1800,pages:[16,24],sent:24,spp:9,vocab:2000,target:70,asia:14,fic:31,
 focus:'Biographies, history, science explanations. Main idea and details'},
{id:'6-1',step:6,min:1800,max:3000,pages:[20,32],sent:26,spp:10,vocab:3000,target:80,asia:16,fic:32,
 focus:'Readers choose genres and read longer books on their own'}];

/* 6단계 이름: 그 단계에서 아이가 하는 일을 이름으로 붙였다(2026-11-20). 참고 서비스의 알파벳 레벨, 미국 학년과 다르게 짓는다. */
const STEP_INFO=[
{n:1,name:'Word Spotter',desc:'Find letter sounds and read words in short patterns'},
{n:2,name:'Sentence Builder',desc:'Read one sentence at a time and build its meaning'},
{n:3,name:'Story Walker',desc:'Follow short stories with a beginning, middle, and end'},
{n:4,name:'Chapter Climber',desc:'Climb through longer texts in chapters'},
{n:5,name:'Idea Explorer',desc:'Find facts and ideas in information texts'},
{n:6,name:'Book Navigator',desc:'Choose books of many kinds and read on your own'}];

/* 주제 12개(자체 분류). 참고 서비스의 주제 24개와 다르게 묶었다. */
const TOPICS=['Me & My Family','School & Friends','Animals','Nature & Weather','Food','Body & Health','Science & How Things Work','Places & Travel','Jobs & Community','Tales from Around the World','Arts & Sports','Feelings & Choices'];

/* 책 종류. fic 은 이야기(픽션) 여부의 기본값. 책에 fic 을 직접 적으면 그 값이 우선한다. */
const TYPES={'Picture book':{fic:true},'Pattern book':{fic:true},'Phonics book':{fic:true},'Story':{fic:true},'Fact book':{fic:false},'Chapter story':{fic:true}};

/* 단계 요약값(서재, 현황판에서 씀): 그 단계 레벨들의 범위를 합친 값 */
const STEPS=STEP_INFO.map(s=>{const ls=LEVELS.filter(l=>l.step===s.n);
  return Object.assign({},s,{levels:ls.map(l=>l.id),min:Math.min(...ls.map(l=>l.min)),max:Math.max(...ls.map(l=>l.max)),
    pages:[Math.min(...ls.map(l=>l.pages[0])),Math.max(...ls.map(l=>l.pages[1]))],target:ls.reduce((n,l)=>n+l.target,0),ready:false})});
const LV=Object.fromEntries(LEVELS.map(l=>[l.id,l]));
Object.assign(window.RS_DATA,{LEVELS,LV,STEPS,TOPICS,TYPES,LIBRARY_TARGET:LEVELS.reduce((n,l)=>n+l.target,0)});
})();
