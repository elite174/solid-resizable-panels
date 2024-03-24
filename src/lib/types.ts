export type LayoutItem = {
  id: string;
  size?: number;
  /** A number from 0 to 100 */
  minSize: number;
  /** A number from 0 to 100 */
  maxSize: number;
  collapsible: boolean;
};

export type ResolvedLayoutItem = Required<LayoutItem>;

export type Direction = "row" | "column" | "row-reverse" | "column-reverse";
