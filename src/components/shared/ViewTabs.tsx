import { Tabs } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface ViewTab<K extends string> {
  id: K;
  label: string;
  /** Shown as a small pill, e.g. items waiting. Hidden when undefined. */
  count?: number;
}

interface ViewTabsProps<K extends string> {
  "aria-label": string;
  tabs: ViewTab<K>[];
  value: K;
  onChange: (id: K) => void;
  className?: string;
}

/**
 * Switches between views of the same list (e.g. Active / Awaiting approval).
 * Keyboard: arrow keys move between tabs. The page renders the matching view.
 */
export function ViewTabs<K extends string>({ tabs, value, onChange, className, ...props }: ViewTabsProps<K>) {
  return (
    <Tabs
      selectedKey={value}
      onSelectionChange={(key) => onChange(String(key) as K)}
      className={cn("w-fit max-w-full", className)}
    >
      <Tabs.ListContainer className="w-fit max-w-full overflow-x-auto">
        <Tabs.List aria-label={props["aria-label"]} className="w-max">
          {tabs.map((tab) => (
            <Tabs.Tab key={tab.id} id={tab.id} className="gap-2 whitespace-nowrap px-3.5">
              {tab.label}
              {tab.count !== undefined ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] font-semibold leading-[18px] tabular-nums",
                    tab.count > 0 ? "bg-gold/20 text-[#7a5f0c]" : "bg-foreground/[0.06] text-muted",
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
