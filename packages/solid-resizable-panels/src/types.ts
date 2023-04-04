export type LayoutItem = {
  id: string;
  size?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
};

export interface ResolvedLayoutItem {
  id: string;
  size: number;
  minSize: number;
  maxSize: number;
  collapsible: boolean;
}

export type Direction = 'row' | 'column' | 'row-reverse' | 'column-reverse';
