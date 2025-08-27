"use client";

import { LocaleSwitcher } from "@components/LocaleSwitcher/LocaleSwitcher";
import { Navbar as UINavBar } from "./UI/index";

import type { FC } from "react";

export const Navbar: FC = () => {
  return (
    <UINavBar
      rightItemsMobile={
        <div className="flex gap-2">
          <LocaleSwitcher panelProps={{ className: "-left-16" }} />
        </div>
      }
      rightItemsDesktop={
        <>
          <LocaleSwitcher panelProps={{ className: "-left-16" }} />
        </>
      }
    />
  );
};
