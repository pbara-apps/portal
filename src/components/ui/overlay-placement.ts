export type OverlaySide = "top" | "right" | "bottom" | "left";
export type OverlayAlign = "start" | "center" | "end";

type Placement =
  | OverlaySide
  | "top start" | "top end" | "bottom start" | "bottom end"
  | "left top" | "left bottom" | "right top" | "right bottom";

/**
 * Converts side/align props into a React Aria placement,
 * e.g. ("bottom", "end") → "bottom end", ("right", "end") → "right bottom".
 */
export function toPlacement(side: OverlaySide, align: OverlayAlign): Placement {
  if (align === "center") return side;
  if (side === "left" || side === "right") return `${side} ${align === "start" ? "top" : "bottom"}`;
  return `${side} ${align}`;
}
