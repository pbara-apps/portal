import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetBody, SheetFooter, SheetHeader } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { ImageUploadField } from "@/features/admin/components/shared/ImageUploadField";
import { isIsoDate } from "@/lib/event-date";
import { useCreateEvent, useUpdateEvent } from "@/lib/api/event";
import type { AdminEvent, EventFormPayload } from "@/types/admin";
import { EVENT_CATEGORIES, EVENT_STATUSES } from "@/types/admin";

interface EventFormDrawerProps {
  mode: "create" | "edit";
  initial?: AdminEvent;
  onClose: () => void;
}

function hasDateRange(initial?: AdminEvent) {
  return Boolean(initial?.endDate && initial.endDate !== initial.date);
}

export function EventFormDrawer({ mode, initial, onClose }: EventFormDrawerProps) {
  const [isRange, setIsRange] = useState(hasDateRange(initial));
  const [form, setForm] = useState<EventFormPayload>({
    title: initial?.title ?? "",
    category: initial?.category ?? "Golden Ambassador",
    date: initial?.date ?? "",
    endDate: initial?.endDate ?? null,
    venue: initial?.venue ?? "",
    description: initial?.description ?? "",
    image: initial?.image ?? null,
    status: initial?.status ?? "open",
  });
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  useEffect(() => {
    setIsRange(hasDateRange(initial));
    setForm({
      title: initial?.title ?? "",
      category: initial?.category ?? "Golden Ambassador",
      date: initial?.date ?? "",
      endDate: initial?.endDate ?? null,
      venue: initial?.venue ?? "",
      description: initial?.description ?? "",
      image: initial?.image ?? null,
      status: initial?.status ?? "open",
    });
  }, [initial]);

  const saving = createEvent.isPending || updateEvent.isPending;

  const handleSave = async () => {
    if (!form.title.trim() || !form.venue.trim()) {
      errorToast("Title and venue are required.", "Validation");
      return;
    }
    if (!form.date.trim() || !isIsoDate(form.date)) {
      errorToast("Select a valid event date.", "Validation");
      return;
    }
    if (isRange) {
      if (!form.endDate || !isIsoDate(form.endDate)) {
        errorToast("Select an end date for the event range.", "Validation");
        return;
      }
      if (form.endDate < form.date) {
        errorToast("End date must be on or after the start date.", "Validation");
        return;
      }
    }

    const payload: EventFormPayload = {
      ...form,
      endDate: isRange ? form.endDate : null,
    };

    try {
      if (mode === "create") {
        await createEvent.mutateAsync(payload);
        successToast("Event created.");
      } else if (initial?.id) {
        await updateEvent.mutateAsync({ id: initial.id, body: payload });
        successToast("Event updated.");
      }
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Save failed.", "Error");
    }
  };

  return (
    <>
      <SheetHeader className="bg-background/40">
        <h3 className="text-lg font-semibold text-primary">
          {mode === "create" ? "Create Event" : "Edit Event"}
        </h3>
      </SheetHeader>
      <SheetBody className="space-y-4">
        <ImageUploadField
          label="Cover Image"
          value={form.image}
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
          folder="events"
          previewName={form.title || "Event"}
        />
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-dark">Category</label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={isRange}
              onCheckedChange={(value) => {
                setIsRange(value);
                if (!value) {
                  setForm((f) => ({ ...f, endDate: null }));
                }
              }}
            />
            <span className="text-sm text-text-dark">Multi-day event</span>
          </div>
          {isRange ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                type="date"
                label="Start date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                required
              />
              <Input
                type="date"
                label="End date"
                value={form.endDate ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    endDate: e.target.value || null,
                  }))
                }
                required
              />
            </div>
          ) : (
            <Input
              type="date"
              label="Event date"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  date: e.target.value,
                  endDate: null,
                }))
              }
              required
            />
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-dark">Status</label>
          <Select
            value={form.status ?? "open"}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, status: v as typeof form.status }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          label="Venue"
          value={form.venue}
          onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
          required
        />
        <Textarea
          label="Description"
          rows={5}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          required
        />
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} className="w-full bg-primary text-white sm:w-auto">
          Save
        </Button>
      </SheetFooter>
    </>
  );
}
