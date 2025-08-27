import { Container } from "@components/Container";
import { DocMetadata } from "@smart-doc/docs";
import { Locales } from "intlayer";
import { FC } from "react";
import { ContributionMessage } from "../ContributionMessage";
import { CopyMarkdownMessage } from "../CopyMarkdownMessage";
import { SummarizeAI } from "../SummarizeAI/SummarizeAI";
import { TranslatedContentMessage } from "../TranslatedContentMessage";

type DocHeaderProps = DocMetadata & {
  locale: Locales;
  markdownContent: string;
};

export const DocHeader: FC<DocHeaderProps> = ({
  relativeUrl,
  markdownContent,
  githubUrl,
  locale,
}) => (
  <>
    <Container className="sticky top-20 mt-5 z-5 flex flex-col gap-2 px-4 py-2 max-w-[95%] mx-auto">
      <div className="flex flex-row gap-4 w-full justify-between">
        <div className="flex flex-row gap-4 w-full justify-start items-center">
          <SummarizeAI url={`${process.env.NEXT_PUBLIC_URL}${relativeUrl}`} />
        </div>
        <div className="flex flex-row gap-4 w-full justify-end items-center">
          <TranslatedContentMessage pageUrl={relativeUrl} />

          <ContributionMessage
            githubUrl={githubUrl.replace("/en/", `/${locale}/`)}
          />

          <CopyMarkdownMessage markdownContent={markdownContent} />
        </div>
      </div>
    </Container>
  </>
);
