# 끊어 읽기 훑어보기 기록 (2026-11-19)

끊어 읽기 표시와 다시 세우기 문장은 `js/chunk.js`의 규칙이 자동으로 만든다. 이 문서는 그 결과를 한 번 훑어보고 규칙을 고친 기록이다.
**사람이 본 것이 아니다.** 에이전트(Claude)가 30권 전체를 읽고 고쳤고, 다른 AI 모델(GPT-6.1 Sol)이 고친 결과를 읽기 전용으로 따로 검수했다.

전체 결과는 `docs/chunk-list.txt`(이 날짜의 사본)와 개발 현황판 "책 전체"(항상 최신)에 있다.

## 1. 수치 (세는 법: 현황판과 같은 규칙을 돌려서 셈)

| 항목 | 값 |
|---|---|
| 본문 문장 | 380개 (30권 203쪽) |
| 끊는 표시가 하나 이상 있는 문장 | 204개 |
| 끊는 자리 | 273곳 (처음 규칙 347곳에서 줄어듦) |
| 다시 세우기 문장 | 90개 (책마다 3개). 뜻 덩어리로 세우는 것 33개, 낱말로 세우는 것 57개 |
| 덩어리별 우리말 풀이 | 3권 56개 (시범) |

끊는 자리가 줄어든 것은 "어색하게 끊느니 표시하지 않는다"는 쪽으로 규칙을 고쳤기 때문이다.

## 2. 고친 규칙

| 처음 결과 | 문제 | 고친 규칙 | 지금 |
|---|---|---|---|
| The cat / and the rat had a nap. | 주어를 가름 | 문장의 첫 덩어리에서는 and 앞에 낱말이 셋 이상 있어야 끊음 | 끊지 않음 |
| big / and red, fruit / and vegetables | 낱말 둘을 잇는 and | and, or, but 뒤에 낱말이 둘 이상 이어질 때만 끊음 | 끊지 않음 |
| a piece / of apple, tiny drops / of water | of 는 앞 낱말에 붙는 말 | of 를 끊는 낱말에서 뺌 | 끊지 않음 |
| It smelled / so good! | so 는 꾸미는 말 | so 를 뺌(접속사 so 는 쉼표에서 끊김) | 끊지 않음 |
| at the / next stop | next 가 꾸미는 말 | next to 일 때만 끊음 | at the next stop |
| It only looks / that way | that 이 꾸미는 말 | that 뒤에 절이 이어질 때만 끊음 | It only looks that way / because ... |
| about nine / to eleven hours | 수의 범위 | 수 뒤의 to 는 끊지 않음 | 끊지 않음 |
| The dog wanted / to play. | 두 낱말짜리 조각 | "to + 낱말 하나"는 앞 덩어리에 붙임 | The dog wanted to play. |
| said, "/ Open with care." | 표시가 따옴표 안에 들어감 | 표시를 여는 따옴표 앞에 둠 | said, / "Open with care." |
| I get / on the bus | get on 은 한 덩어리 (다른 모델 지적) | 끊지 않을 자리에 get on, got on 추가 | I get on the bus / with my mom. |
| as big / as a plate | as ... as 를 가름 (다른 모델 지적) | 두 번째 as 앞에서 끊지 않음 | Each flower was / as big as a plate. |
| It is / about as big / as your fist. | 조각이 빈약함 (다른 모델 지적) | 어림을 뜻하는 about 앞에서 끊지 않음 | 끊지 않음 |
| when, suddenly, / all the lights went out. | 뜻이 없는 조각 (다른 모델 지적) | 접속사 바로 뒤에 끼어든 말의 쉼표에서는 끊지 않음 | ... / when, suddenly, all the lights went out. |

규칙으로 못 잡아 **끊지 않을 자리 목록(KEEP)**에 직접 적은 것: came in, spin around, body and, hat and, get on, gets on, got on.
새 책을 넣어 어색한 곳이 나오면 이 목록에 두 낱말을 적으면 된다.

## 3. 다른 모델의 검수 결과 (GPT-6.1 Sol, 읽기 전용)

| 구역 | 지적 | 처리 |
|---|---|---|
| 끊는 자리 | 4건 (심각 3, 가벼움 1) | 4건 모두 규칙에 반영 (위 표의 아래 네 줄) |
| 다시 세우기 문장 | 13건 | 아래 4절 |
| 우리말 풀이 | 4건 | 4건 모두 반영 |

우리말 풀이에서 고친 것: get 만으로는 "타다"가 아님(덩어리를 합침) / "물고"는 옆 덩어리의 뜻(가지고 있었어요로) / for the dog 는 "개에게"가 아니라 "개를 위해" / millions 의 뜻이 빠짐(수백만 개의).

## 4. 다시 세우기 문장: 남은 문제

다른 모델이 지적한 13건은 두 종류였다.

1. **순서가 하나로 정해지지 않는 문장** (8건). 예: You can see them / in gardens and parks / in spring and summer. 는 뒤의 두 조각을 바꿔도 맞다.
2. **그 단계에는 너무 쉬운 문장** (5건). 예: 4단계 책의 The class was quiet.

한 일:

- 문장을 고르는 규칙을 바꿨다. 전치사구 뒤에 전치사구나 and 덩어리가 바로 오는 문장(순서를 바꿔도 말이 되기 쉬움)은 뒤로 미루고, 4단계부터는 뜻 덩어리로 세우는 문장을 먼저 고른다.
- 순서가 다를 때의 안내를 "책의 문장과 순서가 달라요"로 바꿨다. 아이가 만든 문장이 틀렸다는 뜻이 아니라 책과 다르다는 뜻이다.
- 13건 중 9건은 더 이상 고르지 않는다.

**남은 4건** (그 책에 더 나은 문장이 모자라서 그대로 고름): kite-wind 1쪽, why-sleep 3쪽의 두 문장, fish-name 6쪽.

**확인되지 않은 것**: 규칙을 바꾸면서 새로 고르게 된 문장은 다른 모델이 보지 않았다. 순서가 느슨한지를 가리는 규칙은 어림이라, 느슨한 문장이 남아 있거나 괜찮은 문장을 뺐을 수 있다. 결국 책마다 사람이 세 문장을 골라 주는 것이 맞고, 그 방법(책 데이터에 문장을 직접 지정)은 아직 만들지 않았다.

## 5. 사람이 봐 주면 좋은 곳

규칙으로는 판단하기 어려워 그대로 둔 것이다.

- They sailed / across the room and laughed. (and laughed 가 앞에 붙음)
- At lunch she sat alone and looked / at her food.
- Get off / at the next stop and wait / for number seven.
- People went / to the moon a long time ago. (to the moon 뒤에서 한 번 더 끊는 편이 자연스러움)
- The sun warms the water / in seas, / lakes, and rivers.
- Is it / on the bed? 같은 아주 짧은 문장을 끊을지
- 끊는 표시가 없는 긴 문장: So the water you drink today may be the same water a dinosaur drank long ago! (16낱말)
