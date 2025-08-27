import { configuration } from "intlayer";
import { translateDoc } from "@intlayer/cli";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Fill the list of files to audit if you want to audit only a subset of the files
// If empty list is provided, the audit will run on all markdown files present in the /en folder
const DOC_PATTERN: string[] = ["./docs/en/**/*.md"];

const EXCLUDED_GLOB_PATTEN: string[] = [
  "**/node_modules/**",
  "**/dist/**",
  "**/src/**",
];

const { locales, defaultLocale } = configuration.internationalization;

// Number of files to process simultaneously
const NB_SIMULTANEOUS_FILE_PROCESSED: number = 3;

const customInstructions = readFileSync(
  join(process.cwd(), "./tools/prompts/CUSTOM_INSTRUCTIONS.md"),
  "utf-8"
);

translateDoc({
  excludedGlobPattern: EXCLUDED_GLOB_PATTEN,
  docPattern: DOC_PATTERN,
  locales,
  baseLocale: defaultLocale,
  aiOptions: configuration.ai,
  nbSimultaneousFileProcessed: NB_SIMULTANEOUS_FILE_PROCESSED,
  customInstructions,
});
