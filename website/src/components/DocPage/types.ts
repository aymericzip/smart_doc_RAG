import type { DocMetadata } from "@smart-doc/docs";

export type Section = Record<string, CategorizedDocMetadata>;

export type CategorizedDocMetadata = {
  title: string;
  default?: DocMetadata;
  subSections?: Section;
};
