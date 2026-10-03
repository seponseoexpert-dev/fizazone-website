import { NextResponse, type NextRequest } from "next/server";

/** Default fallback market prefix */
const DEFAULT_MARKET = "bd";

/** Supported canonical storefront market prefixes */
const SUPPORTED_PREFIXES = new Set(["bd", "us", "uk", "ca", "au"]);

/** Legacy / alias prefixes mapped to canonical prefix */
const PREFIX_ALIASES: Record<string, string> = {
  usa: "us",
  gb: "uk",
  bgd: "bd",
};

/** ISO 3166-1 alpha-2 country codes to market prefix */
const ISO_TO_PREFIX: Record<string, string> = {
  BD: "bd",
  US: "us",
  GB: "uk",
  UK: "uk",
  CA: "ca",
  AU: "au",
};

/** Known root storefront pages that should retain market prefix */
const ROOT_STOREFRONT_PAGES = new Set([
  "categories",
  "product",
  "cart",
  "checkout",
  "about",
  "contact",
  "track-order",
  "size-guide",
  "return-policy",
  "wishlist",
  "account",
]);

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. Skip internal, static, admin, api, and payment callback routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/payment") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Extract first URL segment
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0]?.toLowerCase() || "";

  // 3. Handle legacy aliases (e.g. /usa -> /us, /gb -> /uk)
  if (first && PREFIX_ALIASES[first]) {
    const canonical = PREFIX_ALIASES[first];
    const rest = segments.slice(1).join("/");
    const targetPath = `/${canonical}${rest ? `/${rest}` : ""}`;
    const redirectUrl = new URL(targetPath + search, req.url);
    const response = NextResponse.redirect(redirectUrl, 307);
    response.cookies.set("fiza_country", canonical, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  // 4. If URL already starts with a supported market prefix (e.g. /bd, /us, /uk)
  if (first && SUPPORTED_PREFIXES.has(first)) {
    const response = NextResponse.next();
    // Synchronize cookie with the current market prefix if needed
    if (req.cookies.get("fiza_country")?.value !== first) {
      response.cookies.set("fiza_country", first, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  // 5. Determine target market prefix:
  // a) User preference cookie
  // b) Geo-IP headers (Cloudflare, Vercel, CloudFront, etc.)
  // c) Default fallback (bd)
  const savedCountry = req.cookies.get("fiza_country")?.value?.toLowerCase();
  let targetPrefix = "";

  if (savedCountry && (SUPPORTED_PREFIXES.has(savedCountry) || PREFIX_ALIASES[savedCountry])) {
    targetPrefix = PREFIX_ALIASES[savedCountry] || savedCountry;
  } else {
    // Read edge geo-location headers
    const geoCountry = (
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("cloudfront-viewer-country") ||
      req.headers.get("x-country-code") ||
      ""
    ).toUpperCase();

    if (geoCountry && ISO_TO_PREFIX[geoCountry]) {
      targetPrefix = ISO_TO_PREFIX[geoCountry];
    } else {
      targetPrefix = DEFAULT_MARKET;
    }
  }

  // 6. Formulate destination path
  let targetPath = `/${targetPrefix}`;
  if (first && ROOT_STOREFRONT_PAGES.has(first)) {
    targetPath = `/${targetPrefix}/${segments.join("/")}`;
  } else if (first) {
    targetPath = `/${targetPrefix}`;
  }

  const redirectUrl = new URL(targetPath + search, req.url);
  const response = NextResponse.redirect(redirectUrl, 307);
  response.cookies.set("fiza_country", targetPrefix, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - admin dashboard
     * - payment callback
     * - _next static/image
     * - static files (contain a dot like favicon.ico, images, etc.)
     */
    "/((?!api|admin|payment|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
