export type ConfigItem = {
  id: string;
  size: number;
  minSize?: number;
  maxSize?: number;
} & (
  | { collapsible?: false; collapsed?: never }
  | { collapsible?: true; collapsed?: boolean }
);

export type Direction = "vertical" | "horizontal";
