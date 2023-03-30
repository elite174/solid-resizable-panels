export const roundTo = (digits: number) => (number: number) =>
  Math.round(number * 10 ** digits) / 10 ** digits;

export const roundTo4Digits = roundTo(4);

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

export const EPSILON = 0.000001;

export const isZero = (value: number) => Math.abs(value) < EPSILON;
