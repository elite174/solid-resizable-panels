export const roundTo = (digits: number) => (number: number) =>
  Math.round(number * 10 ** digits) / 10 ** digits;

export const roundTo4Digits = roundTo(4);

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));
