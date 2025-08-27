/* --------------------------------------------------------------------------
 *  docs/tools/generateEntry.ts
 *
 *  Completely re-written generator that now produces *two* artefacts for every
 *  documentation category (blog, docs, frequent_questions, legal):
 *    1. A `<category>.entry.ts` file listing every markdown document and
 *       exposing a `localeRecord` that asynchronously reads its content for
 *       any locale.
 *    2. A `<category>.types.ts` file providing an exhaustive TypeScript type
 *       describing the front-matter metadata of every document for all
 *       locales.
 *
 *  The generator is invoked from the `prepare` script of the `docs` package
 *  and must therefore be 100 % deterministic.
 * ------------------------------------------------------------------------- */

import fg from "fast-glob";
import { existsSync, mkdirSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { localeMap } from "intlayer";
import { dirname, join } from "path";
import prettier from "prettier";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface CategoryConfig {
  /** constant exported from the generated entry file */
  constName: string;
  /** path to the generated entry file */
  entryFilePath: string;
}

/* -------------------------------------------------------------------------- */
/*                               CONFIGURATION                                */
/* -------------------------------------------------------------------------- */

const categories: CategoryConfig[] = [
  {
    constName: "docsEntry",
    entryFilePath: "./src/generated/entry.ts",
  },
];

/* -------------------------------------------------------------------------- */
/*                      HELPERS – ENTRY FILES GENERATION                      */
/* -------------------------------------------------------------------------- */

const buildEntryContent = (englishFiles: string[]): string => {
  // Create the generated folder if it doesn't exist
  mkdirSync("./src/generated", { recursive: true });

  const header = [
    `/* AUTO-GENERATED – DO NOT EDIT */`,
    `/* REGENERATE USING \`pnpm prepare\` */`,
    `import type { LocalesValues } from 'intlayer';`,
    `import { readFile } from 'fs/promises';`,
    `import { dirname, join } from 'path';`,
    `import { fileURLToPath } from 'url';`,
    ``,
    `const isESModule = typeof import.meta.url === 'string';`,
    `const dir = isESModule ? dirname(fileURLToPath(import.meta.url)) : __dirname;`,
    ``,
    `\nexport const docsEntry = {\n`,
  ].join("\n");

  const lines = englishFiles
    .sort()
    .map((file) => {
      const relativeAfterLocale = file.replace(`./docs/en/`, "");

      const localeList = localeMap(({ locale }) => {
        const fileExists = existsSync(
          join(process.cwd(), `./docs/${locale}/${relativeAfterLocale}`)
        );
        if (!fileExists) {
          console.error(
            `File ./docs/docs/${locale}/${relativeAfterLocale} does not exist`
          );
          return `'${locale}': Promise.resolve(readFile(join(dir, '../../../../docs/docs/en/${relativeAfterLocale}'), 'utf8'))`;
        }

        return `'${locale}': Promise.resolve(readFile(join(dir, '../../../../docs/docs/${locale}/${relativeAfterLocale}'), 'utf8'))`;
      });
      return `  '${file}': {${localeList.join(",")}} as unknown as Record<LocalesValues, Promise<string>>,`;
    })
    .join("");

  const footer = `} as const;\n`;
  return header + lines + footer;
};

/* -------------------------------------------------------------------------- */
/*                                    MAIN                                    */
/* -------------------------------------------------------------------------- */

const generate = async () => {
  console.log("🔄 Generating entry & type files…");

  for (const cfg of categories) {
    /* ----------------------------- entry file ------------------------------ */
    const englishPattern = `./docs/en/**/*.mdx`;
    const files = fg.sync(englishPattern);

    const entryContent = buildEntryContent(files);
    await mkdir(dirname(cfg.entryFilePath), { recursive: true });

    /* --------------------------- format with prettier -------------------------- */
    try {
      // Resolve Prettier configuration for the target file to ensure the
      // generated artefacts follow the workspace formatting rules.
      const resolvedPrettierConfig = await prettier.resolveConfig(
        cfg.entryFilePath
      );

      const formatted = await prettier.format(entryContent, {
        ...resolvedPrettierConfig,
        parser: "typescript",
        filepath: cfg.entryFilePath,
      });

      const currentContent = await readFile(cfg.entryFilePath, "utf-8");

      // If the file is different from the formatted version, write the formatted version
      if (formatted !== currentContent) {
        await writeFile(cfg.entryFilePath, formatted, "utf-8");
        console.log(`✨ Formatted ${cfg.entryFilePath}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to format ${cfg.entryFilePath}:`, error);
    }
  }

  console.log("🎉 Done!");
};

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
