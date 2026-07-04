export type BlueCollarTimelineValue =
  | "urgent"
  | "this_week"
  | "scheduled_date";

export type BlueCollarTimelineOption = {
  value: BlueCollarTimelineValue;
  label: string;
};

export const BLUE_COLLAR_TIMELINE_OPTIONS: BlueCollarTimelineOption[] = [
  { value: "urgent", label: "Urgent" },
  { value: "this_week", label: "This Week" },
  { value: "scheduled_date", label: "Scheduled Date" },
];

const TIMELINE_VALUES = new Set<string>(
  BLUE_COLLAR_TIMELINE_OPTIONS.map((option) => option.value),
);

export function encodeTimelineNotes(
  timeline: BlueCollarTimelineValue,
  scheduledDate?: string,
): string {
  if (timeline === "scheduled_date" && scheduledDate) {
    return `scheduled_date:${scheduledDate}`;
  }
  return timeline;
}

export function decodeTimelineNotes(raw: string | null | undefined): {
  timeline: BlueCollarTimelineValue | "";
  scheduledDate: string;
} {
  if (!raw) return { timeline: "", scheduledDate: "" };

  if (raw.startsWith("scheduled_date:")) {
    return {
      timeline: "scheduled_date",
      scheduledDate: raw.slice("scheduled_date:".length),
    };
  }

  if (TIMELINE_VALUES.has(raw)) {
    return { timeline: raw as BlueCollarTimelineValue, scheduledDate: "" };
  }

  return { timeline: "", scheduledDate: "" };
}
