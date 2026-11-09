import { Label, ListBox, Select as HeroSelect, Separator } from "@heroui/react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Select on HeroUI's Select + ListBox, keeping the app's compound API:
 *
 *   <Select value onValueChange>
 *     <SelectTrigger aria-label className><SelectValue placeholder /></SelectTrigger>
 *     <SelectContent><SelectItem value>Label</SelectItem></SelectContent>
 *   </Select>
 *
 * The trigger's aria-label and className are lifted onto the Select root, which is
 * where React Aria expects the accessible name and where the layout width belongs.
 */
interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  /** Visible label above the field (forms). Filters use the trigger's aria-label instead. */
  label?: React.ReactNode;
  children: React.ReactNode;
}

interface SelectTriggerProps {
  className?: string;
  id?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

function findTriggerProps(children: React.ReactNode): SelectTriggerProps {
  let found: SelectTriggerProps = {};
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<SelectTriggerProps>(child) && child.type === SelectTrigger) {
      found = child.props;
    }
  });
  return found;
}

function Select({ value, defaultValue, onValueChange, disabled, required, name, label, children }: SelectProps) {
  const trigger = findTriggerProps(children);
  return (
    <HeroSelect
      value={value === undefined ? undefined : value || null}
      defaultValue={defaultValue}
      onChange={(key) => {
        if (key != null) onValueChange?.(String(key));
      }}
      isDisabled={disabled}
      isRequired={required}
      name={name}
      aria-label={trigger["aria-label"]}
      aria-labelledby={trigger["aria-labelledby"]}
      fullWidth
      className={cn("min-w-0", label ? "gap-1.5" : null, trigger.className)}
    >
      {label ? <Label isRequired={required}>{label}</Label> : null}
      {children}
    </HeroSelect>
  );
}

function SelectTrigger({ children, id }: SelectTriggerProps) {
  return (
    <HeroSelect.Trigger id={id} className="w-full">
      {children}
      <HeroSelect.Indicator />
    </HeroSelect.Trigger>
  );
}

function SelectValue({ placeholder = "Select…" }: { placeholder?: React.ReactNode }) {
  return (
    <HeroSelect.Value className="truncate">
      {({ isPlaceholder, defaultChildren }) => (isPlaceholder ? placeholder : defaultChildren)}
    </HeroSelect.Value>
  );
}

function SelectContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <HeroSelect.Popover className={cn("min-w-(--trigger-width)", className)}>
      <ListBox className="max-h-80 overflow-y-auto">{children}</ListBox>
    </HeroSelect.Popover>
  );
}

/** Plain text of an item's children, used for typeahead and the trigger label. */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  textValue?: string;
}

function SelectItem({ value, children, disabled, className, textValue }: SelectItemProps) {
  return (
    <ListBox.Item
      id={value}
      textValue={textValue ?? (textOf(children).trim() || value)}
      isDisabled={disabled}
      className={className}
    >
      {children}
      <ListBox.ItemIndicator />
    </ListBox.Item>
  );
}

function SelectSeparator() {
  return <Separator className="my-1" />;
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectSeparator };
