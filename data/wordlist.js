/* ReadStep Core Words (자체 낱말 목록) v0.1 · 2026-11-20
   - Word Spotter(1단계) 163단어, Sentence Builder(2단계)까지 누적 585단어(v0.1 실측). 기획 기준선(150, 500)보다 조금 많고, 시범 제작 뒤 줄이거나 늘린다. 3단계 이상 목록은 해당 단계를 시작하기 전에 만든다.
   - 공개 어휘 목록(중국 초등 기본 어휘 505단어, 케임브리지 아동 시험 어휘)은 규모를 맞추는 참고로만 썼고, 목록을 옮겨 적지 않았다.
     낱말은 아이 생활 주제와 지금 책 30권에서 실제로 쓴 낱말을 기준으로 골랐다. 출처와 판단은 docs/DATA_SOURCES.md.
   - 원형만 적는다. 복수형, 3인칭 -s, -ed, -ing, 비교급은 검사기가 원형으로 바꿔 찾는다. 불규칙형은 FORMS 에 적는다.
   - 사람 이름은 NAMES 에 둔다. 이름은 목록 밖 낱말로 세지 않는다.
   - SIGHT 는 파닉스 해독책의 사이트 워드(소리 규칙으로 읽기 어려운 자주 쓰는 낱말)이고, 파닉스 단계마다 누적된다. */
window.RS_DATA=window.RS_DATA||{};
(()=>{
const S=s=>s.trim().split(/\s+/);
/* Word Spotter: 약 150단어 */
const BAND1=S(`
a an the I you he she it we they me my your his her this that
is am are be can do have has go see look like want get put make play run sit eat jump help
come say find give take let stop
here there where what who not no yes and but in on at to up down of for with off out
big little small hot red blue green yellow black white pink brown
one two three four five six seven eight nine ten
mom dad baby boy girl friend man
cat dog pig hen fox bug fish bird bee duck cow rat ant frog egg
sun moon star sky tree rain snow box bag hat cup bed bus car ball book pen mat
apple cake milk home park school door
day night good fun sad happy
nap dig sat hop hug pot pan lid jam
under back thank too fast wet water yum table sleep hungry feed
`);
/* Sentence Builder: BAND1 에 더해 약 350단어 (누적 약 500) */
const BAND2=S(`
all some many every much more very again now then when why how because or so if
was were did had will would could should must may
each other another always often never sometimes maybe really even than enough while during less lot important deep
our us them their its him
about after before into over near next by from around inside outside behind between
first last new old young long short tall slow hard soft dry clean dirty full empty high tiny strong easy alone ready real sweet brave excited secret
cold warm nice kind funny busy tired thirsty scared sorry glad sick well
bright dark heavy light loud quiet round same different right wrong
open close live love need know think feel hear smell taste touch read write draw sing dance
swim walk climb fly ride drive cook wash brush wear wake bring count clap vote drink buy pay share
try plant grow pick carry hold pull push throw catch kick hide fall cut fix build move leave stay care happen remember win
start finish work learn ask answer call tell talk show turn keep wait meet visit
laugh cry shout smile listen watch began
mother father brother sister grandma grandpa family teacher class
child people woman person neighbor doctor farmer
morning afternoon evening today tomorrow yesterday week year time minute hour
monday tuesday wednesday thursday friday saturday sunday
spring summer fall winter weather wind cloud snowman ice
food lunch breakfast dinner bread rice noodle soup fruit banana orange grape
carrot potato tea juice cookie candy honey bowl
head face eye ear nose mouth hand arm leg foot tooth hair body heart brain
room kitchen house window floor wall chair sofa lamp clock phone
toy kite doll game picture paper pencil desk map note
street road town city shop market zoo farm garden hill river lake sea beach pond
forest field island mountain
bike train boat plane ship
flower leaf seed grass rock sand soil drop
horse sheep goat rabbit mouse bear lion tiger monkey elephant snake turtle owl
whale shark dolphin penguin kitten puppy pet animal insect
name thing place way side end top bottom part piece line plan idea job sound
color shape number letter word story song circle
twenty thirty hundred thousand million
country language english
birthday party present gift card candle lantern festival
please thanks hello goodbye okay oh
something nothing everyone everything someone nobody
also only just still yet soon later together away across toward
earth world planet sunlight air
hole nest web wing tail shell
`);
/* 불규칙형 → 원형 */
const FORMS={went:'go',goes:'go',gone:'go',saw:'see',seen:'see',ran:'run',ate:'eat',eaten:'eat',got:'get',came:'come',made:'make',said:'say',
  found:'find',gave:'give',took:'take',taken:'take',did:'do',does:'do',done:'do',had:'have',has:'have',was:'be',were:'be',is:'be',am:'be',are:'be',been:'be',
  sat:'sit',felt:'feel',knew:'know',thought:'think',heard:'hear',told:'tell',held:'hold',kept:'keep',met:'meet',wore:'wear',slept:'sleep',woke:'wake',
  drank:'drink',bought:'buy',paid:'pay',grew:'grow',threw:'throw',caught:'catch',hid:'hide',fell:'fall',built:'build',flew:'fly',rode:'ride',drove:'drive',
  swam:'swim',sang:'sing',wrote:'write',drew:'draw',began:'begin',brought:'bring',left:'leave',lost:'lose',won:'win',put:'put',cut:'cut',let:'let',
  children:'child',men:'man',women:'woman',feet:'foot',teeth:'tooth',mice:'mouse',people:'person',
  "isn't":'be',"aren't":'be',"wasn't":'be',"don't":'do',"doesn't":'do',"didn't":'do',"can't":'can',"won't":'will',"i'm":'I',"it's":'it',"let's":'let',
  "i'll":'I',"we're":'we',"you're":'you',"they're":'they',"that's":'that',"what's":'what',"there's":'there',"he's":'he',"she's":'she',
  cannot:'can',leaves:'leaf',lit:'light',taught:'teach',meant:'mean',stood:'stand',shook:'shake',fed:'feed',became:'become',left:'leave',
  better:'good',best:'good',worse:'bad',worst:'bad'};
/* 등장인물 이름(영어 이름 확정, 2026-11-19)과 시리즈 인물(docs/series-bible.md) */
const NAMES=S(`Lily Ben Anna Sam Emma Kate Tim Leo Amy Dan Jack Ella Alex Coco Mike Lee Bell Tom Dana Lina Tuk Mo Max Mia Nina Ray Zoe Pam Ted Mr Ms Mrs`);
/* 파닉스 해독책 사이트 워드(누적). P1 10, P2 +20, P3 +20, P4 +20, P5 +20 = 약 90 */
const SIGHT={
P1:S(`a I the is my see look to go no`),
P2:S(`he she we me be you are was of said do they what where here there have like come one`),
P3:S(`two three four who why all some any many again says does put want very your our from were their`),
P4:S(`could would should people water friend school because eye once laugh buy done gone love move other mother father brother`),
P5:S(`talk walk know write great eight door floor only both every everyone pretty busy early learn nothing sure though through`)};
const L1=new Set(BAND1.map(w=>w.toLowerCase())),L2=new Set([...L1,...BAND2.map(w=>w.toLowerCase())]);
Object.assign(window.RS_DATA,{WORDLIST:{BAND1,BAND2,FORMS,NAMES,SIGHT,sets:{1:L1,2:L2}}});
})();
