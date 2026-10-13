import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "@/styles.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const poppins = Poppins({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

import { fetchServerSiteBranding } from "@/lib/site-branding-server";
import { fetchSeoMetaForPage } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [branding, customSeo] = await Promise.all([
    fetchServerSiteBranding(),
    fetchSeoMetaForPage("home", "home", "bd"),
  ]);

  const siteTitle = customSeo?.meta_title || branding.site_title || "Faiza Zone — Fashion, Footwear & Accessories Online";
  const siteDesc =
    customSeo?.meta_description ||
    branding.tagline ||
    "Shop trending kurti, panjabi, hoodies, sneakers and accessories at Faiza Zone. Authentic quality, flash sales up to 50% off with fast worldwide delivery.";
  const favicon = branding.favicon_url || "/api/favicon";

  return {
    metadataBase: new URL("https://faizazone.com"),
    title: {
      default: siteTitle,
      template: "%s | Faiza Zone",
    },
    description: siteDesc,
    keywords: [
      "Faiza Zone",
      "FaizaZone",
      "online shopping BD",
      "fashion store bangladesh",
      "kurti collection",
      "panjabi",
      "hoodie",
      "sneakers",
      "ethnic wear",
      "mens fashion",
      "womens fashion",
    ],
    authors: [{ name: "Faiza Zone", url: "https://faizazone.com" }],
    creator: "Faiza Zone",
    publisher: "Faiza Zone",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://faizazone.com",
      siteName: "Faiza Zone",
      title: siteTitle,
      description: siteDesc,
      images: [
        {
          url: branding.logo_url || "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Faiza Zone Online Fashion Store",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDesc,
      site: "@faizazone",
      creator: "@faizazone",
      images: [branding.logo_url || "/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
  };
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://faizazone.com/#organization",
      name: "Faiza Zone",
      url: "https://faizazone.com",
      logo: {
        "@type": "ImageObject",
        url: "https://faizazone.com/og-image.jpg",
        width: 1200,
        height: 630,
      },
      sameAs: [
        "https://www.facebook.com/faizazone",
        "https://www.instagram.com/faizazone",
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+8801700000000",
          contactType: "customer service",
          areaServed: ["BD", "US", "GB", "CA", "AU"],
          availableLanguage: ["English", "Bengali"],
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://faizazone.com/#website",
      url: "https://faizazone.com",
      name: "Faiza Zone",
      description: "Online fashion and lifestyle store for Bangladesh, USA, UK, Canada & Australia.",
      publisher: { "@id": "https://faizazone.com/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://faizazone.com/categories?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await fetchServerSiteBranding();

  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href={branding.favicon_url || "/api/favicon"} />
        <link rel="shortcut icon" href={branding.favicon_url || "/api/favicon"} />
        <link rel="apple-touch-icon" href={branding.favicon_url || "/api/favicon"} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('fz_theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <Providers initialBranding={branding}>{children}</Providers>
      </body>
    </html>
  );
}
