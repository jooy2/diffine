import { describe, expect, it } from 'vitest';
import { wheelStep } from '../src/internal/image/viewport.js';

describe('wheelStep', () => {
  it('reads a turn of the wheel as an exponent', () => {
    expect(wheelStep(-100, false)).toBeCloseTo(Math.exp(0.25), 12);
    expect(wheelStep(100, false)).toBeCloseTo(Math.exp(-0.25), 12);
    expect(wheelStep(0, false)).toBe(1);
  });

  it('follows the fingers of a pinch', () => {
    // A browser writes a pinch as a hundred times the natural log of how far
    // the fingers moved apart, a small piece at a time.
    const pieces = [-10, -20, -15, -24.31471805599453];
    const zoomed = pieces.reduce((scale, delta) => scale * wheelStep(delta, true), 1);

    expect(pieces.reduce((sum, delta) => sum + delta, 0)).toBeCloseTo(-100 * Math.log(2), 12);
    expect(zoomed).toBeCloseTo(2, 12);
  });

  it('zooms no further in one event than a notch of the wheel does', () => {
    // Control and a mouse wheel is the same event with a notch in it.
    expect(wheelStep(-100, true)).toBeCloseTo(wheelStep(-100, false), 12);
    expect(wheelStep(100, true)).toBeCloseTo(wheelStep(100, false), 12);
    expect(wheelStep(-5000, true)).toBeCloseTo(Math.exp(0.25), 12);
  });
});
