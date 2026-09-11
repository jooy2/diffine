/**
 * The pairs of pictures the demos compare, and how the second of each pair is
 * made.
 *
 * Only two files are committed to this site: a photograph and an icon, both
 * from the same collection the text samples come from. Everything they are
 * compared against is drawn here, in the browser, out of the file itself — a
 * patch cloned over part of the shot, the same crop taken a pixel further
 * along, the same picture saved again badly, an icon with a badge on it.
 *
 * Which is not a trick to save two downloads. A pair of pictures that differ in
 * a way nobody can describe is a demo nobody learns anything from, and each of
 * these differs in exactly one way with a name: something was edited, something
 * moved, something was re-encoded, something was added. The options on the page
 * are then a reader watching one named difference appear and disappear.
 */

export type PictureName = 'retouched' | 'moved' | 'saved' | 'badge';

/** Two pictures to compare, and what to call each of them. */
export interface PicturePair {
  before: Blob;
  after: Blob;
  beforeLabel: string;
  afterLabel: string;
  /** A third, for the demo that compares more than two. */
  third?: Blob;
  thirdLabel?: string;
}

const TEAPOT = '/samples/teapot.jpg';
const TELESCOPE = '/samples/telescope.png';

/** The files, fetched once however many times a reader switches back to them. */
const FILES = new Map<string, Promise<Blob>>();

function fileOf(url: string): Promise<Blob> {
  const held = FILES.get(url);

  if (held) {
    return held;
  }

  const wanted = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Could not fetch ${url}`);
      }

      return response.blob();
    })
    .catch((reason) => {
      // A promise that failed is not an answer worth keeping. Without this, a
      // request that went out while the dev server was restarting would be the
      // answer for the rest of the page's life.
      FILES.delete(url);

      throw reason;
    });

  FILES.set(url, wanted);

  return wanted;
}

const bitmapOf = async (url: string) => createImageBitmap(await fileOf(url));

/** A canvas of a given size, and the context to draw on it with. */
function surfaceOf(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('No 2D canvas to draw the sample on');
  }

  return context;
}

function blobOf(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The canvas produced no file'))),
      type,
      quality
    );
  });
}

/**
 * The photograph, with a patch of itself cloned over part of it.
 *
 * What a retoucher does, and the case a picture comparison is usually reached
 * for: two versions of the same asset where one of them has been worked on, and
 * the question is which part.
 */
async function retouched(): Promise<PicturePair> {
  const bitmap = await bitmapOf(TEAPOT);
  const patch = Math.round(bitmap.width / 6);

  /** The photograph with a square of itself cloned from one place to another. */
  const cloneInto = async (from: [number, number], onto: [number, number]) => {
    const context = surfaceOf(bitmap.width, bitmap.height);

    context.drawImage(bitmap, 0, 0);
    context.drawImage(
      bitmap,
      Math.round(bitmap.width * from[0]),
      Math.round(bitmap.height * from[1]),
      patch,
      patch,
      Math.round(bitmap.width * onto[0]),
      Math.round(bitmap.height * onto[1]),
      patch,
      patch
    );

    return blobOf(context.canvas, 'image/png');
  };

  return {
    before: await fileOf(TEAPOT),
    after: await cloneInto([0.1, 0.55], [0.62, 0.2]),
    // A third, edited somewhere else, for the demo that compares more than two.
    third: await cloneInto([0.62, 0.2], [0.08, 0.12]),
    beforeLabel: 'teapot.jpg',
    afterLabel: 'retouched.png',
    thirdLabel: 'second-pass.png'
  };
}

/**
 * The same crop of the photograph, taken one pixel further along.
 *
 * Nothing in it changed. Every edge in it did, which is the whole of what
 * `align` is for: leave it off and the comparison is a picture of the picture,
 * turn it on and there is nothing to report.
 */
async function moved(): Promise<PicturePair> {
  const bitmap = await bitmapOf(TEAPOT);
  const width = bitmap.width - 2;
  const height = bitmap.height - 2;

  const first = surfaceOf(width, height);
  const second = surfaceOf(width, height);

  first.drawImage(bitmap, 1, 1, width, height, 0, 0, width, height);
  second.drawImage(bitmap, 2, 2, width, height, 0, 0, width, height);

  return {
    before: await blobOf(first.canvas, 'image/png'),
    after: await blobOf(second.canvas, 'image/png'),
    beforeLabel: 'crop.png',
    afterLabel: 'crop-moved.png'
  };
}

/**
 * The same photograph, saved again by a worse encoder.
 *
 * Not one pixel of it is the same and not one part of it changed, which is what
 * `tolerance` is measured against. At nought it lights up everywhere; at the
 * default it is quiet except where the encoder gave up.
 */
async function saved(): Promise<PicturePair> {
  const bitmap = await bitmapOf(TEAPOT);
  const context = surfaceOf(bitmap.width, bitmap.height);

  context.drawImage(bitmap, 0, 0);

  return {
    before: await fileOf(TEAPOT),
    after: await blobOf(context.canvas, 'image/jpeg', 0.3),
    beforeLabel: 'teapot.jpg',
    afterLabel: 'teapot-q30.jpg'
  };
}

/**
 * The icon, with a badge drawn on the corner of it.
 *
 * Transparent either side of the mark, and every curve on it drawn smooth —
 * which is the pair to look at with `ignoreAntialiasing` on and off.
 */
async function badge(): Promise<PicturePair> {
  const bitmap = await bitmapOf(TELESCOPE);
  const context = surfaceOf(bitmap.width, bitmap.height);
  const radius = bitmap.width / 8;

  context.drawImage(bitmap, 0, 0);
  context.beginPath();
  context.arc(bitmap.width - radius * 1.4, radius * 1.4, radius, 0, Math.PI * 2);
  context.fillStyle = '#e8385c';
  context.fill();
  context.lineWidth = radius / 5;
  context.strokeStyle = '#ffffff';
  context.stroke();

  return {
    before: await fileOf(TELESCOPE),
    after: await blobOf(context.canvas, 'image/png'),
    beforeLabel: 'telescope.png',
    afterLabel: 'telescope-badge.png'
  };
}

const PAIRS: Record<PictureName, () => Promise<PicturePair>> = {
  retouched,
  moved,
  saved,
  badge
};

/** One pair, built once and kept for as long as the page is open. */
const BUILT = new Map<PictureName, Promise<PicturePair>>();

export function pairOf(name: PictureName): Promise<PicturePair> {
  const held = BUILT.get(name);

  if (held) {
    return held;
  }

  const building = PAIRS[name]().catch((reason) => {
    BUILT.delete(name);

    throw reason;
  });

  BUILT.set(name, building);

  return building;
}
