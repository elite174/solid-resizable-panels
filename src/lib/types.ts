export type ItemStateOnResizeStart = {
  flexGrow: number;
};

export type ConfigItem = {
  id: string;
  flexGrow: number;
  minFlexGrow?: number;
  maxFlexGrow?: number;
} & (
  | { collapsible?: false; onCollapse?: never }
  | { collapsible?: true; onCollapse?: (id: string) => void }
);

export type Direction = "vertical" | "horizontal";
