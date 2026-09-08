import type { CaseRequirement } from "./types";

export function makeRepeatedCaseTitle(title: string) {
  const normalized = title.trim();
  return normalized ? `${normalized} - خرید جدید` : "خرید جدید";
}

export function cloneRequirementsForNewCase(
  requirements: CaseRequirement[] | undefined,
  makeId: () => string,
  createdAt: string
): CaseRequirement[] | undefined {
  if (!requirements?.length) return undefined;
  return requirements.map((requirement) => ({
    id: makeId(),
    label: requirement.label,
    createdAt,
  }));
}
