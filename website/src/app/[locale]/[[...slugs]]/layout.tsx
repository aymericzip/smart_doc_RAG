import { DocPageLayout } from "@components/DocPage/DocPageLayout";
import { getDocMetadataBySlug } from "@smart-doc/docs";
import { getLocalizedUrl, getMultilingualUrls } from "intlayer";
import type { Metadata } from "next";
import type { LocalPromiseParams, NextLayoutIntlayer } from "next-intlayer";

export type DocProps = {
  slugs: string[];
};

export type DocPageProps = LocalPromiseParams<DocProps>;

export const generateStaticParams = async () => {
  const docMetadata = await getDocMetadataBySlug([]);

  const slugList: string[][] = docMetadata.map((meta) => meta.slugs);

  return slugList;
};

export const generateMetadata = async ({
  params,
}: DocPageProps): Promise<Metadata> => {
  const { locale, slugs } = await params;

  const docsData = await getDocMetadataBySlug(slugs, locale, true);

  const filteredDocsData = docsData.filter(
    (doc) => doc.slugs.length === slugs.length
  );

  if (!filteredDocsData || filteredDocsData.length === 0) {
    return {};
  }

  const docData: any = filteredDocsData[0];

  const relativeUrl = docData.relativeUrl;

  return {
    title: docData.title,
    description: docData.description,
    keywords: docData.keywords,
    alternates: {
      canonical: getLocalizedUrl(relativeUrl, locale),
      languages: {
        ...getMultilingualUrls(relativeUrl),
        "x-default": relativeUrl,
      },
    },
    openGraph: {
      url: getLocalizedUrl(
        `https://${process.env.NEXT_PUBLIC_URL ?? "example.com"}${relativeUrl}`,
        locale
      ),
      title: docData.title,
      description: docData.description,
    },
  };
};

const DocLayout: NextLayoutIntlayer<DocProps> = async ({
  children,
  params,
}) => {
  const { locale, slugs } = await params;

  return (
    <DocPageLayout activeSections={slugs} locale={locale}>
      {children}
    </DocPageLayout>
  );
};

export default DocLayout;
