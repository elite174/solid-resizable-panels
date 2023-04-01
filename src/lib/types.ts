export type LayoutItem = {
  id: string;
  size?: number;
  maxSize?: number;
  static?: boolean;
} & (
  | { collapsible?: false; minSize?: number }
  | { collapsible?: true; minSize: number }
);

export type ResolvedLayoutItem = {
  id: string;
  size: number;
  minSize: number;
  maxSize: number;
  static: boolean;
  collapsible: boolean;
};

export type Direction = "vertical" | "horizontal";
