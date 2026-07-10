import { LuCalendar, LuX } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AuditFiltersProps {
  className?: string;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApplyTime: () => void;
  onClearTime: () => void;
  timeActive: boolean;
  users: string[];
  selectedUser: string | null;
  onUserSelect: (user: string | null) => void;
  eventTypes: string[];
  selectedEventType: string | null;
  onEventTypeSelect: (eventType: string | null) => void;
}

function FilterLink({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full truncate text-left text-sm transition-colors hover:underline",
        active
          ? "font-semibold text-gold"
          : "font-medium text-primary hover:text-gold",
      )}
    >
      {label}
    </button>
  );
}

export function AuditFilters({
  className,
  from,
  to,
  onFromChange,
  onToChange,
  onApplyTime,
  onClearTime,
  timeActive,
  users,
  selectedUser,
  onUserSelect,
  eventTypes,
  selectedEventType,
  onEventTypeSelect,
}: AuditFiltersProps) {
  return (
    <aside
      className={cn(
        "space-y-8 lg:sticky lg:top-6 lg:self-start",
        className,
      )}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-dark">Filter by time</h2>
        <div className="space-y-2.5">
          <Input
            type="datetime-local"
            label="From"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            endContent={<LuCalendar size={15} className="text-text-muted" />}
            className="h-10 bg-surface"
          />
          <Input
            type="datetime-local"
            label="To"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            endContent={<LuCalendar size={15} className="text-text-muted" />}
            className="h-10 bg-surface"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={onApplyTime} className="flex-1">
            Filter
          </Button>
          {timeActive ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onClearTime}
              aria-label="Clear time filter"
            >
              <LuX size={16} />
            </Button>
          ) : null}
        </div>
      </section>

      <div className="h-px bg-text-dark/8" />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text-dark">
            Filter by users
          </h2>
          {selectedUser ? (
            <button
              type="button"
              onClick={() => onUserSelect(null)}
              className="text-xs font-medium text-text-muted hover:text-primary"
            >
              Clear
            </button>
          ) : null}
        </div>
        {users.length === 0 ? (
          <p className="text-xs text-text-muted">No actors yet.</p>
        ) : (
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user}>
                <FilterLink
                  label={user}
                  active={selectedUser === user}
                  onClick={() =>
                    onUserSelect(selectedUser === user ? null : user)
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="h-px bg-text-dark/8" />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text-dark">
            Filter by event type
          </h2>
          {selectedEventType ? (
            <button
              type="button"
              onClick={() => onEventTypeSelect(null)}
              className="text-xs font-medium text-text-muted hover:text-primary"
            >
              Clear
            </button>
          ) : null}
        </div>
        {eventTypes.length === 0 ? (
          <p className="text-xs text-text-muted">No event types yet.</p>
        ) : (
          <ul className="space-y-2">
            {eventTypes.map((type) => (
              <li key={type}>
                <FilterLink
                  label={type}
                  active={selectedEventType === type}
                  onClick={() =>
                    onEventTypeSelect(
                      selectedEventType === type ? null : type,
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
