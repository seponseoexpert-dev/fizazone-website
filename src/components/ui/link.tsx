"use client";

import NextLink from "next/link";
import React, { forwardRef } from "react";

export type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href?: string;
  to?: string;
  search?: Record<string, string | number | boolean | undefined | null>;
  params?: Record<string, string | number>;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, to, search, params, children, ...rest },
  ref,
) {
  let targetHref = href || to || "#";

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      targetHref = targetHref.replace(`$${k}`, String(v)).replace(`[${k}]`, String(v));
    });
  }

  if (search) {
    const sp = new URLSearchParams();
    Object.entries(search).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        sp.set(k, String(v));
      }
    });
    const qs = sp.toString();
    if (qs) {
      targetHref += (targetHref.includes("?") ? "&" : "?") + qs;
    }
  }

  return (
    <NextLink ref={ref} href={targetHref} {...rest}>
      {children}
    </NextLink>
  );
});

export default Link;
