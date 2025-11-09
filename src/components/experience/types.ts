import type { SvgComponent } from "astro/types";

export interface WorkExperienceProps {
  companyName: string;
  isCurrentJob?: boolean;
}

export interface PositionProps {
  title: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  defaultOpen?: boolean;
}
