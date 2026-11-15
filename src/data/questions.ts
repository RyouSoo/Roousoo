export type MathToken =
  | { type: 'text'; value: string }
  | { type: 'frac'; whole?: number; num: number; den: number; unit?: string };

export interface QuizChoice {
  id: string;
  tokens: MathToken[];
}

export interface QuizQuestion {
  id: number;
  topic: string;
  prompt: MathToken[];
  choices: QuizChoice[];
  correctChoiceId: string;
  explanation: MathToken[];
}

export type NpcHatStyle =
  | 'chef'
  | 'straw'
  | 'cap'
  | 'beret'
  | 'ribbon'
  | 'glasses'
  | 'mail'
  | 'bucket'
  | 'bandana'
  | 'crown';

export interface NpcProfile {
  id: number;
  name: string;
  role: string;
  greeting: string;
  position: [number, number, number];
  rotationY: number;
  shirtColor: number;
  pantsColor: number;
  hairColor: number;
  skinColor: number;
  hatStyle: NpcHatStyle;
  hatColor: number;
  question: QuizQuestion;
}

export const VILLAGE_NPCS: NpcProfile[] = [
  {
    id: 1,
    name: '모모',
    role: '달콤한 빵집 제빵사',
    greeting: '안녕! 갓 구운 피자빵 냄새가 좋지? 조각 수를 분수로 나타내 볼래?',
    position: [-8.5, 0, 4.2],
    rotationY: Math.PI / 2,
    shirtColor: 0xffffff,
    pantsColor: 0xb45309,
    hairColor: 0x7c2d12,
    skinColor: 0xfcd5b5,
    hatStyle: 'chef',
    hatColor: 0xfffbeb,
    question: {
      id: 1,
      topic: '분수의 기초',
      prompt: [
        { type: 'text', value: '피자 한 판을 똑같이 8조각으로 나누었습니다. 그중 3조각을 먹었다면, 먹은 피자는 전체의 얼마일까요?' },
      ],
      choices: [
        { id: 'A', tokens: [{ type: 'frac', num: 3, den: 5 }] },
        { id: 'B', tokens: [{ type: 'frac', num: 3, den: 8 }] },
        { id: 'C', tokens: [{ type: 'frac', num: 5, den: 8 }] },
        { id: 'D', tokens: [{ type: 'frac', num: 8, den: 3 }] },
      ],
      correctChoiceId: 'B',
      explanation: [
        { type: 'text', value: '전체를 똑같이 8조각으로 나눈 것 중의 3조각이므로 분모는 8, 분자는 3인 ' },
        { type: 'frac', num: 3, den: 8 },
        { type: 'text', value: '입니다.' },
      ],
    },
  },
  {
    id: 2,
    name: '해나',
    role: '햇살 꽃밭 정원사',
    greeting: '꽃들이 알록달록 예쁘지? 꽃밭에 핀 튤립 수를 함께 세어 보자!',
    position: [7.5, 0, 7.2],
    rotationY: -Math.PI * 0.75,
    shirtColor: 0x22c55e,
    pantsColor: 0x1e40af,
    hairColor: 0x451a03,
    skinColor: 0xfde2c8,
    hatStyle: 'straw',
    hatColor: 0xfde047,
    question: {
      id: 2,
      topic: '두 자리 수 × 한 자리 수',
      prompt: [
        { type: 'text', value: '꽃밭 한 줄에 튤립이 14송이씩 심어져 있습니다. 모두 3줄이 있다면 튤립은 모두 몇 송이일까요?' },
      ],
      choices: [
        { id: 'A', tokens: [{ type: 'text', value: '32송이' }] },
        { id: 'B', tokens: [{ type: 'text', value: '37송이' }] },
        { id: 'C', tokens: [{ type: 'text', value: '42송이' }] },
        { id: 'D', tokens: [{ type: 'text', value: '48송이' }] },
      ],
      correctChoiceId: 'C',
      explanation: [
        { type: 'text', value: '14 × 3은 10 × 3 = 30과 4 × 3 = 12를 더하여 30 + 12 = 42송이입니다.' },
      ],
    },
  },
  {
    id: 3,
    name: '도훈',
    role: '튼튼 목공소 목수',
    greeting: '탁탁! 나무 블록을 정리하고 있는데 상자에 나누어 담는 걸 도와줄래?',
    position: [-14.2, 0, -6.5],
    rotationY: Math.PI * 0.35,
    shirtColor: 0xf97316,
    pantsColor: 0x334155,
    hairColor: 0x1e293b,
    skinColor: 0xf5cba7,
    hatStyle: 'cap',
    hatColor: 0xd97706,
    question: {
      id: 3,
      topic: '나눗셈 기초',
      prompt: [
        { type: 'text', value: '나무 블록 24개를 상자 4개에 똑같이 나누어 담으려고 합니다. 한 상자에 블록이 몇 개씩 들어갈까요?' },
      ],
      choices: [
        { id: 'A', tokens: [{ type: 'text', value: '5개' }] },
        { id: 'B', tokens: [{ type: 'text', value: '6개' }] },
        { id: 'C', tokens: [{ type: 'text', value: '7개' }] },
        { id: 'D', tokens: [{ type: 'text', value: '8개' }] },
      ],
      correctChoiceId: 'B',
      explanation: [
        { type: 'text', value: '4 × 6 = 24이므로 24 ÷ 4 = 6개씩 들어갑니다.' },
      ],
    },
  },
  {
    id: 4,
    name: '다솜',
    role: '알록달록 리본 상인',
    greeting: '어머, 반가워! 선물 포장을 하고 남은 리본이 얼마나 될지 맞혀 보자.',
    position: [4.3, 0, -4.2],
    rotationY: -Math.PI * 0.25,
    shirtColor: 0xec4899,
    pantsColor: 0x7c3aed,
    hairColor: 0x581c87,
    skinColor: 0xfde2c8,
    hatStyle: 'ribbon',
    hatColor: 0xf43f5e,
    question: {
      id: 4,
      topic: '전체와 남은 분수',
      prompt: [
        { type: 'text', value: '전체 길이가 1인 리본 중에서 ' },
        { type: 'frac', num: 2, den: 5 },
        { type: 'text', value: '만큼을 선물 포장에 썼습니다. 남은 리본은 전체의 얼마일까요?' },
      ],
      choices: [
        { id: 'A', tokens: [{ type: 'frac', num: 1, den: 5 }] },
        { id: 'B', tokens: [{ type: 'frac', num: 2, den: 5 }] },
        { id: 'C', tokens: [{ type: 'frac', num: 3, den: 5 }] },
        { id: 'D', tokens: [{ type: 'frac', num: 4, den: 5 }] },
      ],
      correctChoiceId: 'C',
      explanation: [
        { type: 'text', value: '전체 1은 ' },
        { type: 'frac', num: 5, den: 5 },
        { type: 'text', value: '와 같습니다. 5조각 중 2조각을 썼으므로 남은 리본은 ' },
        { type: 'frac', num: 3, den: 5 },
        { type: 'text', value: '입니다.' },
      ],
    },
  },
  {
    id: 5,
    name: '지우',
    role: '마을 도서관 사서',
    greeting: '조용하고 포근한 도서관에 잘 왔어요. 책 수를 함께 더해 볼까요?',
    position: [-1.5, 0, -13.2],
    rotationY: 0,
    shirtColor: 0x0ea5e9,
    pantsColor: 0x1e293b,
    hairColor: 0x3b2f2f,
    skinColor: 0xfcd5b5,
    hatStyle: 'glasses',
    hatColor: 0x475569,
    question: {
      id: 5,
      topic: '세 자리 수의 덧셈',
      prompt: [
        { type: 'text', value: '도서관 책장에 동화책이 135권, 과학책이 128권 꽂혀 있습니다. 두 종류의 책은 모두 몇 권일까요?' },
      ],
      choices: [
        { id: 'A', tokens: [{ type: 'text', value: '253권' }] },
        { id: 'B', tokens: [{ type: 'text', value: '263권' }] },
        { id: 'C', tokens: [{ type: 'text', value: '265권' }] },
        { id: 'D', tokens: [{ type: 'text', value: '273권' }] },
      ],
      correctChoiceId: 'B',
      explanation: [
        { type: 'text', value: '일의 자리 5 + 8 = 13에서 10을 십의 자리로 받아올림하여 계산하면 135 + 128 = 263권입니다.' },
      ],
    },
  },
  {
    id: 6,
    name: '민재',
    role: '씩씩한 마을 우체부',
    greeting: '편지 배달 완료! 내가 몇 시 몇 분에 배달을 마쳤는지 구해 줄래?',
    position: [-8.8, 0, 13.6],
    rotationY: Math.PI * 0.75,
    shirtColor: 0xef4444,
    pantsColor: 0x1e3a8a,
    hairColor: 0x27272a,
    skinColor: 0xf5cba7,
    hatStyle: 'mail',
    hatColor: 0xdc2626,
    question: {
      id: 6,
      topic: '시각과 시간',
      prompt: [
        { type: 'text', value: '우체부 아저씨가 오전 9시 20분에 출발해서 35분 동안 편지를 배달했습니다. 배달을 마친 시각은 언제일까요?' },
      ],
      choices: [
        { id: 'A', tokens: [{ type: 'text', value: '오전 9시 45분' }] },
        { id: 'B', tokens: [{ type: 'text', value: '오전 9시 50분' }] },
        { id: 'C', tokens: [{ type: 'text', value: '오전 9시 55분' }] },
        { id: 'D', tokens: [{ type: 'text', value: '오전 10시 5분' }] },
      ],
      correctChoiceId: 'C',
      explanation: [
        { type: 'text', value: '분끼리 더하면 20분 + 35분 = 55분이므로 배달을 마친 시각은 오전 9시 55분입니다.' },
      ],
    },
  },
  {
    id: 7,
    name: '소라',
    role: '마을 화실 화가',
    greeting: '예쁜 그림을 그리며 분수를 배워 보자! 대분수가 어떤 분수인지 기억나니?',
    position: [12.5, 0, -10.5],
    rotationY: -Math.PI * 0.4,
    shirtColor: 0xa855f7,
    pantsColor: 0x3f3f46,
    hairColor: 0x713f12,
    skinColor: 0xfde2c8,
    hatStyle: 'beret',
    hatColor: 0xbe123c,
    question: {
      id: 7,
      topic: '진분수·가분수·대분수',
      prompt: [
        { type: 'text', value: '다음 중 자연수와 진분수로 이루어진 대분수는 어느 것일까요?' },
      ],
      choices: [
        { id: 'A', tokens: [{ type: 'frac', num: 3, den: 4 }] },
        { id: 'B', tokens: [{ type: 'frac', num: 7, den: 5 }] },
        { id: 'C', tokens: [{ type: 'frac', whole: 1, num: 2, den: 3 }] },
        { id: 'D', tokens: [{ type: 'frac', num: 4, den: 4 }] },
      ],
      correctChoiceId: 'C',
      explanation: [
        { type: 'text', value: '자연수 1과 진분수 ' },
        { type: 'frac', num: 2, den: 3 },
        { type: 'text', value: '가 함께 쓰인 ' },
        { type: 'frac', whole: 1, num: 2, den: 3 },
        { type: 'text', value: '이 대분수입니다. (' },
        { type: 'frac', num: 3, den: 4 },
        { type: 'text', value: '은 진분수, ' },
        { type: 'frac', num: 7, den: 5 },
        { type: 'text', value: '와 ' },
        { type: 'frac', num: 4, den: 4 },
        { type: 'text', value: '는 가분수예요!)' },
      ],
    },
  },
  {
    id: 8,
    name: '태오',
    role: '시냇가 낚시꾼',
    greeting: '반짝이는 시냇물 소리가 참 시원하지? 남은 물고기 수를 구해 보자!',
    position: [15.5, 0, 2.2],
    rotationY: -Math.PI / 2,
    shirtColor: 0x14b8a6,
    pantsColor: 0x475569,
    hairColor: 0x1f2937,
    skinColor: 0xfcd5b5,
    hatStyle: 'bucket',
    hatColor: 0x0f766e,
    question: {
      id: 8,
      topic: '세 자리 수의 뺄셈',
      prompt: [
        { type: 'text', value: '양동이에 작은 물고기가 240마리 있었습니다. 그중 115마리를 시냇물에 놓아주었다면 남은 물고기는 몇 마리일까요?' },
      ],
      choices: [
        { id: 'A', tokens: [{ type: 'text', value: '115마리' }] },
        { id: 'B', tokens: [{ type: 'text', value: '125마리' }] },
        { id: 'C', tokens: [{ type: 'text', value: '135마리' }] },
        { id: 'D', tokens: [{ type: 'text', value: '145마리' }] },
      ],
      correctChoiceId: 'B',
      explanation: [
        { type: 'text', value: '십의 자리에서 10을 받아내림하여 계산하면 240 - 115 = 125마리입니다.' },
      ],
    },
  },
  {
    id: 9,
    name: '하준',
    role: '언덕 풍차 농부',
    greeting: '풍차 아래 과수원에서 맛있는 사과를 땄어! 친구에게 줄 사과를 세어 볼까?',
    position: [-18.5, 0, 2.8],
    rotationY: Math.PI * 0.5,
    shirtColor: 0xeab308,
    pantsColor: 0x78350f,
    hairColor: 0x451a03,
    skinColor: 0xf5cba7,
    hatStyle: 'bandana',
    hatColor: 0xb91c1c,
    question: {
      id: 9,
      topic: '전체의 분수만큼 구하기',
      prompt: [
        { type: 'text', value: '바구니에 사과가 12개 들어 있습니다. 사과의 ' },
        { type: 'frac', num: 1, den: 3 },
        { type: 'text', value: '만큼을 친구에게 주었다면 몇 개를 주었을까요?' },
      ],
      choices: [
        { id: 'A', tokens: [{ type: 'text', value: '2개' }] },
        { id: 'B', tokens: [{ type: 'text', value: '3개' }] },
        { id: 'C', tokens: [{ type: 'text', value: '4개' }] },
        { id: 'D', tokens: [{ type: 'text', value: '6개' }] },
      ],
      correctChoiceId: 'C',
      explanation: [
        { type: 'text', value: '12개의 ' },
        { type: 'frac', num: 1, den: 3 },
        { type: 'text', value: '은 전체 12개를 똑같이 3묶음으로 나눈 것 중 1묶음이므로 12 ÷ 3 = 4개입니다.' },
      ],
    },
  },
  {
    id: 10,
    name: '별이',
    role: '분수 광장 이장님',
    greeting: '우리 마을 축제를 준비하고 있어! 마지막 문제도 자신 있게 풀어 보자!',
    position: [-3.8, 0, -2.0],
    rotationY: Math.PI * 0.15,
    shirtColor: 0x2563eb,
    pantsColor: 0x1e293b,
    hairColor: 0xd97706,
    skinColor: 0xfde2c8,
    hatStyle: 'crown',
    hatColor: 0xfacc15,
    question: {
      id: 10,
      topic: '곱셈과 나눗셈 응용',
      prompt: [
        { type: 'text', value: '마을 잔치에서 떡 36개를 한 접시에 6개씩 담으려고 합니다. 접시는 모두 몇 개 필요할까요?' },
      ],
      choices: [
        { id: 'A', tokens: [{ type: 'text', value: '4개' }] },
        { id: 'B', tokens: [{ type: 'text', value: '5개' }] },
        { id: 'C', tokens: [{ type: 'text', value: '6개' }] },
        { id: 'D', tokens: [{ type: 'text', value: '7개' }] },
      ],
      correctChoiceId: 'C',
      explanation: [
        { type: 'text', value: '6 × 6 = 36이므로 36 ÷ 6 = 6개의 접시가 필요합니다.' },
      ],
    },
  },
];
