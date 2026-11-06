import * as React from "react";
import { Pressable } from "react-aria-components";
import { Button } from "./button";

type PressableChild = React.ComponentProps<typeof Pressable>["children"];

/**
 * Lets an overlay (Popover, Dropdown) open from a custom trigger element.
 * Our <Button> is already a React Aria button and wires itself up; a plain DOM
 * element (e.g. <button>) is made pressable.
 */
export function TriggerSlot({ children }: { children: React.ReactElement }) {
  if (children.type === Button || typeof children.type !== "string") return children;
  return <Pressable>{children as PressableChild}</Pressable>;
}
