export const EDUCATION_PROFILE_SNAPSHOT_VERSION = "ws_education_profile_v1";
export const LEGACY_EDUCATION_EXPERIENCE_VERSION =
  "ws_education_experience_v1";

export type EducationProfessionalRole = {
  jobTitle: string;
  company: string;
  city: string;
  country: string;
  currentlyWorking: boolean;
  startDate: string;
  endDate: string;
  description: string;
};

export type EducationSkillsSnapshot = {
  primarySkills: string[];
  industryTags: string[];
};

export type EducationProfileSnapshot = {
  type: typeof EDUCATION_PROFILE_SNAPSHOT_VERSION;
  professionalRole?: EducationProfessionalRole;
  skills?: EducationSkillsSnapshot;
};

type LegacyEducationExperience = {
  type: typeof LEGACY_EDUCATION_EXPERIENCE_VERSION;
  jobTitle?: string;
  company?: string;
  city?: string;
  country?: string;
  currentlyWorking?: boolean;
  startDate?: string;
  endDate?: string;
  description?: string;
};

function normalizeStringList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseLegacyExperience(
  payload: LegacyEducationExperience,
): EducationProfessionalRole {
  return {
    jobTitle: payload.jobTitle?.trim() ?? "",
    company: payload.company?.trim() ?? "",
    city: payload.city?.trim() ?? "",
    country: payload.country?.trim() ?? "",
    currentlyWorking: payload.currentlyWorking === true,
    startDate: payload.startDate?.trim() ?? "",
    endDate: payload.endDate?.trim() ?? "",
    description: payload.description?.trim() ?? "",
  };
}

export function parseEducationProfileSnapshot(
  value: string | null | undefined,
): EducationProfileSnapshot | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as
      | EducationProfileSnapshot
      | LegacyEducationExperience
      | null;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (parsed.type === EDUCATION_PROFILE_SNAPSHOT_VERSION) {
      return {
        type: EDUCATION_PROFILE_SNAPSHOT_VERSION,
        professionalRole: parsed.professionalRole
          ? {
              jobTitle: parsed.professionalRole.jobTitle?.trim() ?? "",
              company: parsed.professionalRole.company?.trim() ?? "",
              city: parsed.professionalRole.city?.trim() ?? "",
              country: parsed.professionalRole.country?.trim() ?? "",
              currentlyWorking: parsed.professionalRole.currentlyWorking === true,
              startDate: parsed.professionalRole.startDate?.trim() ?? "",
              endDate: parsed.professionalRole.endDate?.trim() ?? "",
              description: parsed.professionalRole.description?.trim() ?? "",
            }
          : undefined,
        skills: parsed.skills
          ? {
              primarySkills: normalizeStringList(parsed.skills.primarySkills),
              industryTags: normalizeStringList(parsed.skills.industryTags),
            }
          : undefined,
      };
    }

    if (parsed.type === LEGACY_EDUCATION_EXPERIENCE_VERSION) {
      return {
        type: EDUCATION_PROFILE_SNAPSHOT_VERSION,
        professionalRole: parseLegacyExperience(parsed),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function stringifyEducationProfileSnapshot(
  snapshot: EducationProfileSnapshot,
): string | undefined {
  const hasProfessionalRole = Boolean(
    snapshot.professionalRole &&
      [
        snapshot.professionalRole.jobTitle,
        snapshot.professionalRole.company,
        snapshot.professionalRole.city,
        snapshot.professionalRole.country,
        snapshot.professionalRole.startDate,
        snapshot.professionalRole.endDate,
        snapshot.professionalRole.description,
      ].some((value) => value.trim() !== "") ||
      snapshot.professionalRole?.currentlyWorking,
  );

  const hasSkills = Boolean(
    snapshot.skills &&
      (snapshot.skills.primarySkills.length > 0 ||
        snapshot.skills.industryTags.length > 0),
  );

  if (!hasProfessionalRole && !hasSkills) {
    return undefined;
  }

  const normalized: EducationProfileSnapshot = {
    type: EDUCATION_PROFILE_SNAPSHOT_VERSION,
    ...(hasProfessionalRole && snapshot.professionalRole
      ? {
          professionalRole: {
            jobTitle: snapshot.professionalRole.jobTitle.trim(),
            company: snapshot.professionalRole.company.trim(),
            city: snapshot.professionalRole.city.trim(),
            country: snapshot.professionalRole.country.trim(),
            currentlyWorking: snapshot.professionalRole.currentlyWorking,
            startDate: snapshot.professionalRole.startDate.trim(),
            endDate: snapshot.professionalRole.endDate.trim(),
            description: snapshot.professionalRole.description.trim(),
          },
        }
      : {}),
    ...(hasSkills && snapshot.skills
      ? {
          skills: {
            primarySkills: normalizeStringList(snapshot.skills.primarySkills),
            industryTags: normalizeStringList(snapshot.skills.industryTags),
          },
        }
      : {}),
  };

  return JSON.stringify(normalized);
}
