/* 덩어리별 우리말 풀이(직독직해). 시범으로 세 권만 넣었다.
   모두 AI가 쓴 초안이며 사람 검수 전이다. 사람이 고치면 reviewed 에 책 id 를 넣는다.
   열쇠는 js/chunk.js 가 만든 덩어리의 낱말(쉼표와 마침표 제외)이다. 끊어 읽기 규칙이 바뀌어 덩어리가 달라지면
   검사 도구(tools/check.html)가 "풀이가 없는 덩어리"와 "쓰이지 않는 풀이"를 알려 준다. */
window.RS_KO={
reviewed:[],
books:{
 'red-bus': {
 'I see a red bus': '빨간 버스가 보여요',
 'The bus is big and red': '버스는 크고 빨개요',
 'I get on the bus': '나는 버스에 타요',
 'with my mom': '엄마와 함께',
 'We sit': '우리는 앉아요',
 'at the back': '뒤쪽에',
 'The bus goes': '버스가 가요',
 'to the park': '공원으로',
 'I like my red bus': '나는 내 빨간 버스가 좋아요'
 },
 'lost-ball': {
 'Mina had a new blue ball': '미나에게는 새 파란 공이 있었어요',
 'She took it': '미나는 그것을 가져갔어요',
 'to the park': '공원으로',
 'She kicked the ball hard': '미나는 공을 세게 찼어요',
 'It went': '공은 날아갔어요',
 'over the tree': '나무 너머로',
 'Mina looked and looked': '미나는 찾고 또 찾았어요',
 'She could not find her ball': '미나는 공을 찾을 수 없었어요',
 'A dog ran to her': '개 한 마리가 미나에게 달려왔어요',
 'It had something': '개는 무언가를 가지고 있었어요',
 'in its mouth': '입에',
 'It was the blue ball': '그것은 파란 공이었어요',
 'The dog wanted to play': '개는 놀고 싶었어요',
 'Mina threw the ball': '미나는 공을 던졌어요',
 'for the dog': '개를 위해',
 'Now she had a ball': '이제 미나에게는 공이 있었어요',
 'and a new friend': '그리고 새 친구도요'
 },
 'rain-trip': {
 'Water is always moving': '물은 늘 움직여요',
 'It goes up': '물은 올라가요',
 'to the sky': '하늘로',
 'and comes back down again': '그리고 다시 내려와요',
 'The sun warms the water': '해가 물을 데워요',
 'in seas': '바다에 있는',
 'lakes and rivers': '호수와 강에 있는',
 'Some of the warm water turns': '따뜻해진 물의 일부는 변해요',
 'into a gas': '기체로',
 'You cannot see it': '그것은 눈에 보이지 않아요',
 'It rises': '그것은 올라가요',
 'into the air': '공기 속으로',
 'High in the sky': '하늘 높은 곳에서는',
 'the air is cold': '공기가 차가워요',
 'The gas turns back': '기체는 다시 변해요',
 'into tiny drops of water': '아주 작은 물방울로',
 'Millions of tiny drops come together': '수백만 개의 작은 물방울이 모여요',
 'and make a cloud': '그리고 구름을 만들어요',
 'When the drops get big and heavy': '물방울이 크고 무거워지면',
 'they fall': '떨어져요',
 'as rain': '비가 되어',
 'In very cold clouds': '아주 차가운 구름 속에서는',
 'tiny bits of ice grow and fall': '작은 얼음 알갱이가 자라서 떨어져요',
 'as snow': '눈이 되어',
 'The rain runs': '빗물은 흘러가요',
 'into rivers': '강으로',
 'and flows back': '그리고 다시 흘러가요',
 'to the sea': '바다로',
 'Then the trip starts again': '그러면 여행이 다시 시작돼요',
 'So the water you drink today may be the same water a dinosaur drank long ago': '그러니까 오늘 여러분이 마시는 물은 아주 오래전 공룡이 마셨던 바로 그 물일지도 몰라요'
 }
}
};
