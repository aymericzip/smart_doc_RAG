import type { IntlayerClientProviderProps } from "next-intlayer";
import type { FC } from "react";
import { AnimatePresenceProvider } from "./AnimatePresenceProvider";
import { IntlayerProvider } from "./IntlayerProvider";
import { QueryProvider } from "./QueryProvider";

export type AppProvidersProps = IntlayerClientProviderProps;

export const AppProviders: FC<AppProvidersProps> = ({ children, locale }) => (
  <IntlayerProvider locale={locale}>
    <QueryProvider>
      <AnimatePresenceProvider>{children}</AnimatePresenceProvider>
    </QueryProvider>
  </IntlayerProvider>
);
