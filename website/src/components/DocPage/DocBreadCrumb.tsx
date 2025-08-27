import {
  Breadcrumb,
  type BreadcrumbLink,
  type BreadcrumbProps,
} from "@components/Breadcrumb";
import { type Locales, getIntlayer, getLocalizedUrl } from "intlayer";
import { type FC } from "react";

type DocBreadCrumbProps = {
  slug: string[];
  locale: Locales;
} & Omit<BreadcrumbProps, "links">;

export const DocBreadCrumb: FC<DocBreadCrumbProps> = ({
  slug,
  locale,
  ...props
}) => {
  const docData = getIntlayer("doc-metadata", locale);

  const foundDoc = docData.find(
    (metadata) => metadata.slugs.join("/") === slug.join("/")
  );

  const breadcrumbsLinks: BreadcrumbLink[] = slug.map((el) => {
    return {
      text: el,
      url: foundDoc?.relativeUrl
        ? getLocalizedUrl(foundDoc.relativeUrl, locale)
        : undefined,
    };
  });

  return (
    <Breadcrumb
      links={breadcrumbsLinks}
      className="ml-10 mt-12"
      locale={locale}
      {...props}
    />
  );
};
