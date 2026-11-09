import { Checkbox as HeroCheckbox } from "@heroui/react";
import type * as React from "react";
import { cn } from "@/lib/utils";

type CheckedState = boolean | "indeterminate";

interface CheckboxProps {
  checked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  value?: string;
  className?: string;
  /** Visible text beside the box; clicking it toggles the box too. */
  label?: React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** Checkbox on HeroUI's Checkbox. `checked="indeterminate"` shows the mixed state. */
function Checkbox({ checked, onCheckedChange, disabled, className, label, ...props }: CheckboxProps) {
  return (
    <HeroCheckbox
      {...props}
      isSelected={checked === true}
      isIndeterminate={checked === "indeterminate"}
      onChange={onCheckedChange}
      isDisabled={disabled}
      className={cn("shrink-0", className)}
    >
      <HeroCheckbox.Content className={label ? "gap-2" : undefined}>
        <HeroCheckbox.Control>
          <HeroCheckbox.Indicator />
        </HeroCheckbox.Control>
        {label ? <span className="select-none text-sm text-foreground">{label}</span> : null}
      </HeroCheckbox.Content>
    </HeroCheckbox>
  );
}

export { Checkbox };
