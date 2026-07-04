export const PROJECT_DURATION_OPTIONS = [
  { value: "small", label: "1 to 3 months - Small" },
  { value: "medium", label: "3 to 6 months - Medium" },
  { value: "large", label: "More than 6 months - Large" },
] as const;

export const EXPERIENCE_LEVEL_OPTIONS = [
  {
    value: "entry",
    title: "Entry",
    description: "Looking for someone relatively new to this field",
  },
  {
    value: "intermediate",
    title: "Intermediate",
    description: "Looking for substantial experience in this field",
  },
  {
    value: "expert",
    title: "Expert",
    description:
      "Looking for comprehensive and deep expertise in this field",
  },
] as const;

export type ProjectDuration =
  (typeof PROJECT_DURATION_OPTIONS)[number]["value"];
export type ExperienceLevel =
  (typeof EXPERIENCE_LEVEL_OPTIONS)[number]["value"];
