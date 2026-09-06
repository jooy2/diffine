/**
 * The pairs of documents the demos compare.
 *
 * Written here rather than in the pages because a Markdown page cannot carry a
 * multi-line string into a component without turning into an escaping puzzle,
 * and because every page showing the same pair is what makes the options
 * comparable: a reader turning wrapping on should see the wrapping change and
 * nothing else.
 */

export interface Sample {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
}

const CODE_BEFORE = `export function subtotal(items) {
  let total = 0;

  for (const item of items) {
    total += item.price * item.quantity;
  }

  return total;
}

// Rounding is the caller's problem for now.
export function format(amount) {
  return '$' + amount.toFixed(2);
}
`;

const CODE_AFTER = `export function subtotal(items, currency = 'USD') {
  let total = 0;

  for (const item of items) {
    total += item.price * item.quantity;
  }

  return round(total, currency);
}

function round(amount, currency) {
  return Number(amount.toFixed(DECIMALS[currency] ?? 2));
}

export function format(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}
`;

const PROSE_BEFORE = `The Release Notes

We have shipped a new version of the editor. It fixes a number of bugs and adds
one feature that people have asked for.

The new feature is a keyboard shortcut for saving.

Let us know what you think.
`;

const PROSE_AFTER = `Release notes for 2.4

We have shipped a new version of the editor. It fixes eleven bugs and adds two
features that people have asked for.

The first is a keyboard shortcut for saving. The second is an autosave that runs
every thirty seconds and never gets in the way.

Let us know what you think.
`;

const CONFIG_BEFORE = `name: deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
`;

const CONFIG_AFTER = `name: deploy
on:
  push:
    branches: [main, release/*]
jobs:
  build:
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - run: npm run build
`;

const KOREAN_BEFORE = `공원 이용 안내

여름철 개장 시간은 오전 6시부터 오후 10시까지입니다.
반려동물은 목줄을 채우면 들어올 수 있습니다.
자전거는 동문 주차장에 세워 주세요.
`;

const KOREAN_AFTER = `공원 이용 안내

여름철 개장 시간은 오전 5시부터 오후 11시까지입니다.
반려동물은 목줄을 채우면 들어올 수 있습니다.
자전거는 동문과 서문 주차장에 세워 주세요.
드론은 날릴 수 없습니다.
`;

export const SAMPLES = {
  code: {
    before: CODE_BEFORE,
    after: CODE_AFTER,
    beforeLabel: 'cart.js @ main',
    afterLabel: 'cart.js @ currency'
  },
  prose: {
    before: PROSE_BEFORE,
    after: PROSE_AFTER,
    beforeLabel: 'Draft',
    afterLabel: 'Published'
  },
  config: {
    before: CONFIG_BEFORE,
    after: CONFIG_AFTER,
    beforeLabel: 'deploy.yml @ v1',
    afterLabel: 'deploy.yml @ v2'
  },
  korean: {
    before: KOREAN_BEFORE,
    after: KOREAN_AFTER,
    beforeLabel: '지난해',
    afterLabel: '올해'
  },
  whitespace: {
    before: 'const total = subtotal + tax;   \n  const rounded = round(total);\nreturn rounded;\n',
    after: 'const total = subtotal + tax;\n    const rounded = round(total);\nreturn rounded;\n',
    beforeLabel: 'Before',
    afterLabel: 'After'
  }
} satisfies Record<string, Sample>;

export type SampleName = keyof typeof SAMPLES;
