export type LayoutItem = {
  id: string;
  flexGrow: number;
  maxFlexGrow?: number;
} & (
  | { collapsible?: false; minFlexGrow?: number }
  | { collapsible?: true; minFlexGrow: number }
);

export type Direction = "vertical" | "horizontal";
