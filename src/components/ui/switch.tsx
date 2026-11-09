import { Switch as HeroSwitch } from "@heroui/react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** Toggle switch on HeroUI's Switch. */
function Switch({ checked, onCheckedChange, disabled, className, ...props }: SwitchProps) {
  return (
    <HeroSwitch
      {...props}
      isSelected={checked}
      onChange={onCheckedChange}
      isDisabled={disabled}
      className={cn("shrink-0", className)}
    >
      <HeroSwitch.Content>
        <HeroSwitch.Control>
          <HeroSwitch.Thumb />
        </HeroSwitch.Control>
      </HeroSwitch.Content>
    </HeroSwitch>
  );
}

export { Switch };
