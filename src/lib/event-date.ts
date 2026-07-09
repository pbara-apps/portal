import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(advancedFormat);

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "August",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string) {
  return ISO_DATE.test(value);
}

export function parseEventDateParts(date: string, endDate?: string | null) {
  if (!isIsoDate(date)) {
    return { day: "--", month: "", year: "", label: date };
  }

  const [, y, m, d] = date.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? [];
  const monthIdx = Math.max(1, Math.min(12, Number(m))) - 1;

  return {
    day: d ?? "",
    month: MONTH_NAMES[monthIdx] ?? "",
    year: y ?? "",
    label: formatEventDateLabel(date, endDate),
  };
}

export function formatEventDateLabel(date: string, endDate?: string | null) {
  if (!isIsoDate(date)) return date;

  const start = dayjs(date);
  if (!start.isValid()) return date;

  if (!endDate || endDate === date || !isIsoDate(endDate)) {
    return start.format("MMMM Do, YYYY");
  }

  const end = dayjs(endDate);
  if (!end.isValid()) return start.format("MMMM Do, YYYY");

  if (start.year() === end.year() && start.month() === end.month()) {
    return `${start.format("MMMM Do")} – ${end.format("Do, YYYY")}`;
  }
  if (start.year() === end.year()) {
    return `${start.format("MMMM Do")} – ${end.format("MMMM Do, YYYY")}`;
  }
  return `${start.format("MMMM Do, YYYY")} – ${end.format("MMMM Do, YYYY")}`;
}

export function eventEndTimestamp(date: string, endDate?: string | null) {
  const compare = endDate && isIsoDate(endDate) ? endDate : date;
  if (!isIsoDate(compare)) {
    const parsed = Date.parse(compare);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return dayjs(compare).endOf("day").valueOf();
}
