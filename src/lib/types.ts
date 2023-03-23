export type ConfigItem = {
  id: string;
  flexGrow: number;
  minFlexGrow?: number;
  maxFlexGrow?: number;
} & (
  | { collapsible?: false; collapsed?: never }
  | { collapsible?: true; collapsed?: boolean }
);

export type Direction = "vertical" | "horizontal";
