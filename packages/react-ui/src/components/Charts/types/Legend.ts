export interface LegendItem {
  key: string;
  label: string;
  color: string;
  icon?: React.ComponentType;
  percentage?: number;
  /** When true the series is hidden and the legend item renders dimmed. */
  hidden?: boolean;
}

export interface StackedLegendItem {
  key: string;
  label: string;
  value: number;
  color: string;
  /** When true the slice/segment is hidden and the legend row renders dimmed. */
  hidden?: boolean;
}
