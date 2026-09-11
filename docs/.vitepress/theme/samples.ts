/**
 * The pairs of documents the demos compare.
 *
 * Written here rather than in the pages because a Markdown page cannot carry a
 * multi-line string into a component without turning into an escaping puzzle,
 * and because every page showing the same pair is what makes the options
 * comparable: a reader turning wrapping on should see the wrapping change and
 * nothing else.
 *
 * Each pair is longer than it has to be to show one change, and deliberately:
 * the playground is somewhere to scroll a comparison, fold it, search it and
 * step between changes, and a pair that fits on one screen answers none of
 * those. So the changes are spread from the top of each document to the bottom
 * rather than gathered where they would all be visible at once.
 */

export interface Sample {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  /** What the pair is written in, for `language`. Left out where it is prose. */
  language?: string;
}

const CODE_BEFORE = `const TAX_RATE = 0.08;

export function subtotal(items) {
  let total = 0;

  for (const item of items) {
    total += item.price * item.quantity;
  }

  return total;
}

export function tax(items) {
  return subtotal(items) * TAX_RATE;
}

export function total(items) {
  return subtotal(items) + tax(items);
}

// Rounding is the caller's problem for now.
export function format(amount) {
  return '$' + amount.toFixed(2);
}

export function addItem(cart, product, quantity = 1) {
  const line = cart.lines.find((entry) => entry.sku === product.sku);

  if (line) {
    line.quantity += quantity;

    return cart;
  }

  cart.lines.push({
    sku: product.sku,
    name: product.name,
    price: product.price,
    quantity
  });

  return cart;
}

export function removeItem(cart, sku) {
  cart.lines = cart.lines.filter((line) => line.sku !== sku);

  return cart;
}

export function setQuantity(cart, sku, quantity) {
  const line = cart.lines.find((entry) => entry.sku === sku);

  if (!line) {
    return cart;
  }

  if (quantity < 1) {
    return removeItem(cart, sku);
  }

  line.quantity = quantity;

  return cart;
}

export function itemCount(cart) {
  return cart.lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function isEmpty(cart) {
  return cart.lines.length === 0;
}

export function summarise(cart) {
  return {
    lines: cart.lines.length,
    items: itemCount(cart),
    total: format(total(cart.lines))
  };
}
`;

const CODE_AFTER = `const DECIMALS = { USD: 2, EUR: 2, JPY: 0, KRW: 0 };
const TAX_RATES = { US: 0.08, DE: 0.19, JP: 0.1, KR: 0.1 };

export function subtotal(items, currency = 'USD') {
  let total = 0;

  for (const item of items) {
    total += item.price * item.quantity;
  }

  return round(total, currency);
}

function round(amount, currency) {
  return Number(amount.toFixed(DECIMALS[currency] ?? 2));
}

export function tax(items, region = 'US', currency = 'USD') {
  return round(subtotal(items, currency) * (TAX_RATES[region] ?? 0), currency);
}

export function total(items, region = 'US', currency = 'USD') {
  return round(subtotal(items, currency) + tax(items, region, currency), currency);
}

export function format(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function addItem(cart, product, quantity = 1) {
  const line = cart.lines.find((entry) => entry.sku === product.sku);

  if (line) {
    line.quantity += quantity;

    return cart;
  }

  cart.lines.push({
    sku: product.sku,
    name: product.name,
    price: product.price,
    currency: product.currency ?? cart.currency,
    quantity
  });

  return cart;
}

export function removeItem(cart, sku) {
  cart.lines = cart.lines.filter((line) => line.sku !== sku);

  return cart;
}

export function setQuantity(cart, sku, quantity) {
  const line = cart.lines.find((entry) => entry.sku === sku);

  if (!line) {
    return cart;
  }

  if (quantity < 1) {
    return removeItem(cart, sku);
  }

  line.quantity = quantity;

  return cart;
}

export function applyDiscount(cart, code) {
  const rule = cart.discounts?.[code];

  if (!rule) {
    return cart;
  }

  cart.discount = { code, off: rule.off };

  return cart;
}

export function itemCount(cart) {
  return cart.lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function summarise(cart) {
  return {
    lines: cart.lines.length,
    items: itemCount(cart),
    currency: cart.currency,
    total: format(total(cart.lines, cart.region, cart.currency), cart.currency)
  };
}
`;

const PROSE_BEFORE = `The Release Notes

We have shipped a new version of the editor. It fixes a number of bugs and adds
one feature that people have asked for.

What is new

The new feature is a keyboard shortcut for saving. Press it and the document is
written to disk. There is nothing to set up first.

We made the sidebar narrower, which gives the text more room on a small screen.

The status bar counts words as well as lines.

What we fixed

Opening a file with no final newline no longer adds one.

Search stops at the end of the document instead of wrapping around without
saying so.

The window remembers its size between sessions.

Pasting a wide table no longer takes several seconds.

A document left open overnight no longer loses its undo history.

What is still wrong

Printing comes out wrong on a page that has been zoomed. We know why, and it is
the next thing on the list.

The spell checker only knows one dictionary at a time.

Upgrading

Your settings are carried over. Nothing has to be installed again and no file
format has changed.

Let us know what you think.
`;

const PROSE_AFTER = `Release notes for 2.4

We have shipped a new version of the editor. It fixes eleven bugs and adds two
features that people have asked for.

What is new

The first is a keyboard shortcut for saving. Press it and the document is
written to disk. There is nothing to set up first.

The second is an autosave that runs every thirty seconds and stays out of the
way. It is on for a new installation and can be turned off under Preferences.

We made the sidebar narrower, which gives the text more room on a small screen.
It can be dragged back to where it was.

The status bar counts words, lines and characters, and says which of the three
is selected.

What we fixed

Opening a file with no final newline no longer adds one.

Search stops at the end of the document and says so, rather than wrapping
around in silence.

The window remembers its size and its position between sessions.

Pasting a wide table is about forty times faster than it was.

A document left open overnight no longer loses its undo history.

What is still wrong

Printing comes out wrong on a page that has been zoomed. We know why, and it is
the next thing on the list.

Upgrading

Your settings are carried over. Nothing has to be installed again and no file
format has changed.

Thank you to everybody who wrote in about the search bar. Let us know what you
make of this one.
`;

const CONFIG_BEFORE = `name: deploy

on:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  build:
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: site
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: site
          path: dist
      - run: ./scripts/upload.sh dist
`;

const CONFIG_AFTER = `name: deploy

on:
  push:
    branches: [main, release/*]
  workflow_dispatch:

concurrency:
  group: deploy
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run format -- --check

  build:
    needs: check
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: site
          path: dist
          retention-days: 7

  deploy:
    needs: build
    runs-on: ubuntu-24.04
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: site
          path: dist
      - run: ./scripts/upload.sh dist
      - run: ./scripts/purge-cache.sh
`;

const KOREAN_BEFORE = `공원 이용 안내

개장 시간

여름철 개장 시간은 오전 6시부터 오후 10시까지입니다.
겨울철에는 오전 7시부터 오후 8시까지 문을 엽니다.
정기 휴원일은 매월 첫째 주 월요일입니다.

반려동물

반려동물은 목줄을 채우면 들어올 수 있습니다.
배변 봉투는 각 출입구에 놓아 두었습니다.
잔디 광장에는 반려동물을 데리고 들어갈 수 없습니다.

자전거와 주차

자전거는 동문 주차장에 세워 주세요.
주차장은 두 시간까지 무료이고, 그 뒤로는 30분에 500원입니다.
대형 버스는 미리 연락해 자리를 확인해 주세요.

시설 이용

야외 취사와 음주는 할 수 없습니다.
분수 광장은 매시 정각에 15분 동안 가동합니다.
화장실은 정문, 동문, 호수 쉼터 세 곳에 있습니다.

문의

공원 관리 사무소는 정문 옆 1층에 있습니다.
평일 오전 9시부터 오후 6시까지 문을 엽니다.
`;

const KOREAN_AFTER = `공원 이용 안내

개장 시간

여름철 개장 시간은 오전 5시부터 오후 11시까지입니다.
겨울철에는 오전 7시부터 오후 8시까지 문을 엽니다.
정기 휴원일은 매월 첫째 주와 셋째 주 월요일입니다.

반려동물

반려동물은 목줄을 채우면 들어올 수 있습니다.
배변 봉투는 각 출입구와 쉼터에 놓아 두었습니다.
잔디 광장에는 반려동물을 데리고 들어갈 수 없습니다.
맹견은 입마개를 씌워 주세요.

자전거와 주차

자전거는 동문과 서문 주차장에 세워 주세요.
주차장은 한 시간까지 무료이고, 그 뒤로는 30분에 500원입니다.
전기차 충전기는 서문 주차장에 네 대 있습니다.

시설 이용

야외 취사와 음주는 할 수 없습니다.
드론은 날릴 수 없습니다.
분수 광장은 매시 정각에 20분 동안 가동합니다.
화장실은 정문, 동문, 호수 쉼터, 어린이 놀이터 네 곳에 있습니다.
산책로 조명은 해가 진 뒤 두 시간 동안 켜 둡니다.

문의

공원 관리 사무소는 정문 옆 1층에 있습니다.
평일 오전 9시부터 오후 7시까지 문을 엽니다.
전화는 관리 사무소 대표 번호로 걸어 주세요.
`;

export const SAMPLES = {
  code: {
    before: CODE_BEFORE,
    after: CODE_AFTER,
    beforeLabel: 'cart.js @ main',
    afterLabel: 'cart.js @ currency',
    language: 'javascript'
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
    afterLabel: 'deploy.yml @ v2',
    language: 'yaml'
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
    afterLabel: 'After',
    language: 'javascript'
  }
} satisfies Record<string, Sample>;

export type SampleName = keyof typeof SAMPLES;
