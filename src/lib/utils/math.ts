export const roundTo = (digits: number) => (number: number) =>
  Math.round(number * 10 ** digits) / 10 ** digits;

export const roundTo4Digits = roundTo(4);
