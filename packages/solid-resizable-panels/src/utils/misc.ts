import type { Direction } from "../types";

export const isHorizontalDirection = (direction: Direction) => direction.includes("row");

export const isReverseDirection = (direction: Direction) =>
  direction.includes("reverse");
