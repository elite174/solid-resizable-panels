import type { Direction } from '../types';

export const isHorizontalDirection = (direction: Direction) => direction.includes('row');
