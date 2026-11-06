import { Checkbox as HeroCheckbox } from "@heroui/react";
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
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** Checkbox on HeroUI's Checkbox. `checked="indeterminate"` shows the mixed state. */
function Checkbox({ checked, onCheckedChange, disabled, className, ...props }: CheckboxProps) {
  return (
    <HeroCheckbox
      {...props}
      isSelected={checked === true}
      isIndeterminate={checked === "indeterminate"}
      onChange={onCheckedChange}
      isDisabled={disabled}
      className={cn("shrink-0", className)}
    >
      <HeroCheckbox.Control>
        <HeroCheckbox.Indicator />
      </HeroCheckbox.Control>
    </HeroCheckbox>
  );
}

export { Checkbox };
