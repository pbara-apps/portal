import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GALLERY_CATEGORIES } from "@/types/admin";

/**
 * Picks one of the fixed gallery categories. An item saved earlier with a
 * free-text category keeps that value as an extra option, so editing it
 * doesn't silently change its category.
 */
export function GalleryCategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const known = (GALLERY_CATEGORIES as readonly string[]).includes(value);
  const options = known || !value ? GALLERY_CATEGORIES : [...GALLERY_CATEGORIES, value];

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-text-dark">Category</label>
      <Select value={value || "General"} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
