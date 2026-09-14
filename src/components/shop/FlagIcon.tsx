import { cn, getImageSrc } from "@/lib/utils";

import bdFlag from "circle-flags/flags/bd.svg";
import usFlag from "circle-flags/flags/us.svg";
import gbFlag from "circle-flags/flags/gb.svg";
import caFlag from "circle-flags/flags/ca.svg";
import auFlag from "circle-flags/flags/au.svg";

const flagMap = {
  bd: getImageSrc(bdFlag),
  us: getImageSrc(usFlag),
  usa: getImageSrc(usFlag),
  gb: getImageSrc(gbFlag),
  global: getImageSrc(usFlag),
  uk: getImageSrc(gbFlag),
  ca: getImageSrc(caFlag),
  au: getImageSrc(auFlag),
};

type FlagCode = keyof typeof flagMap;

export function FlagIcon({
  code,
  className,
  alt,
}: {
  code: string;
  className?: string;
  alt?: string;
}) {
  const src = flagMap[code as FlagCode] || flagMap.usa;
  return (
    <img
      src={src}
      alt={alt || `${code.toUpperCase()} flag`}
      className={cn("inline-block h-5 w-5 shrink-0 object-contain", className)}
    />
  );
}
