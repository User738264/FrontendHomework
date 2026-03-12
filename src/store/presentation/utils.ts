import { type Position, type Size } from '../../types';

export const arraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

export const positionsEqual = (a: Position, b: Position): boolean => {
  return a.x === b.x && a.y === b.y;
};

export const sizesEqual = (a: Size, b: Size): boolean => {
  return a.width === b.width && a.height === b.height;
};