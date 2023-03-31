export type ItemResizeState = {
  flexGrow: number;
};

export type ConfigItem = ItemResizeState & {
  id: string;
  minFlexGrow?: number;
  maxFlexGrow?: number;
} & (
    | { collapsible?: false; collapsed?: never }
    | { collapsible?: true; collapsed?: boolean }
  );

export type Direction = "vertical" | "horizontal";
