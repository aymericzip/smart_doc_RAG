"use client";

import { getLocalizedUrl, configuration, LocalesValues } from "intlayer";
import { cn } from "@utils/cn";
import { ExternalLink } from "lucide-react";
import { useLocale } from "next-intlayer";
import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import { AnchorHTMLAttributes, DetailedHTMLProps, type FC } from "react";
import { cva, VariantProps } from "class-variance-authority";

export enum LinkVariant {
  DEFAULT = "default",
  INVISIBLE_LINK = "invisible-link",
  BUTTON = "button",
  BUTTON_OUTLINED = "button-outlined",
  HOVERABLE = "hoverable",
}

export enum LinkColor {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  DESTRUCTIVE = "destructive",
  NEUTRAL = "neutral",
  LIGHT = "light",
  DARK = "dark",
  TEXT = "text",
  TEXT_INVERSE = "text-inverse",
  ERROR = "error",
  SUCCESS = "success",
  CUSTOM = "custom",
}

export enum LinkUnderlined {
  DEFAULT = "default",
  TRUE = "true",
  FALSE = "false",
}

export const linkVariants = cva(
  "gap-3 transition focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        [`${LinkVariant.DEFAULT}`]:
          "h-auto justify-start border-inherit bg-current/0 px-1 underline-offset-4 hover:bg-current/0 hover:underline",
        [`${LinkVariant.INVISIBLE_LINK}`]:
          "h-auto justify-start border-inherit bg-current/0 px-1 underline-offset-4 hover:bg-current/0",
        [`${LinkVariant.BUTTON}`]:
          "rounded-lg bg-current *:text-text-opposite min-h-8 px-6 max-md:py-2 text-sm flex items-center justify-center gap-2 whitespace-nowrap font-medium transition focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
        [`${LinkVariant.BUTTON_OUTLINED}`]:
          "rounded-lg border-[1.5px] hover:bg-current/30 min-h-8 px-6 max-md:py-2 text-sm flex items-center justify-center gap-2 whitespace-nowrap font-medium transition focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
        [`${LinkVariant.HOVERABLE}`]:
          "block rounded-lg border-none bg-current/0 transition hover:bg-current/20 aria-[current]:bg-current/5",
      },
      color: {
        [`${LinkColor.PRIMARY}`]: "text-primary",
        [`${LinkColor.SECONDARY}`]: "text-secondary",
        [`${LinkColor.DESTRUCTIVE}`]: "text-destructive",
        [`${LinkColor.NEUTRAL}`]: "text-neutral",
        [`${LinkColor.LIGHT}`]: "text-white",
        [`${LinkColor.DARK}`]: "text-neutral-800",
        [`${LinkColor.TEXT}`]: "text-text",
        [`${LinkColor.TEXT_INVERSE}`]: "text-text-opposite",
        [`${LinkColor.ERROR}`]: "text-error",
        [`${LinkColor.SUCCESS}`]: "text-success",
        [`${LinkColor.CUSTOM}`]: "",
      },
      underlined: {
        [LinkUnderlined.DEFAULT]: "",
        [LinkUnderlined.TRUE]: "underline",
        [LinkUnderlined.FALSE]: "no-underline",
      },
    },

    defaultVariants: {
      variant: LinkVariant.DEFAULT,
      color: LinkColor.PRIMARY,
      underlined: LinkUnderlined.DEFAULT,
    },
  }
);

export type LinkUIProps = DetailedHTMLProps<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> &
  VariantProps<typeof linkVariants> & {
    label: string;
    isExternalLink?: boolean;
    isActive?: boolean;
    locale?: LocalesValues;
  };

export const checkIsExternalLink = ({
  href,
  isExternalLink: isExternalLinkProp,
}: LinkProps): boolean => {
  const isValidHref = typeof href === "string" && href.trim() !== "";
  const isExternalLink =
    isExternalLinkProp === true ||
    (typeof isExternalLinkProp === "undefined" &&
      isValidHref &&
      /^https?:\/\//.test(href));

  return isExternalLink;
};

export type LinkProps = LinkUIProps & NextLinkProps;

export const Link: FC<LinkProps> = (props) => {
  const {
    variant = "default",
    color = "primary",
    children,
    label,
    className,
    isActive,
    underlined,
    locale: localeProp,
    prefetch,
    isExternalLink: isExternalLinkProp,
    href: hrefProp,
    ...otherProps
  } = props;
  const { locale: currentLocale } = useLocale();
  const locale = localeProp ?? currentLocale;
  const isExternalLink = checkIsExternalLink(props);
  const isChildrenString = typeof children === "string";

  const rel = isExternalLink ? "noopener noreferrer nofollow" : undefined;

  const target = isExternalLink ? "_blank" : "_self";

  const hrefLang = locale
    ? locale === configuration.internationalization.defaultLocale
      ? "x-default"
      : locale
    : undefined;

  const href =
    locale && hrefProp && !isExternalLink
      ? getLocalizedUrl(hrefProp, locale)
      : hrefProp;

  return (
    <NextLink
      prefetch={prefetch}
      href={href}
      hrefLang={hrefLang}
      aria-label={label}
      rel={rel}
      target={target}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        linkVariants({
          variant,
          color,
          underlined,
          className,
        })
      )}
      {...otherProps}
    >
      {variant === "button" ? (
        <span className="size-full">{children}</span>
      ) : (
        children
      )}
      {isExternalLink && isChildrenString && (
        <ExternalLink className="ml-2 inline-block size-4" />
      )}
    </NextLink>
  );
};
