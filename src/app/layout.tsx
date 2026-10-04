import type { Metadata } from "next";
import "@/styles.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Faiza Zone",
  description: "Online fashion store for Bangladesh, USA and UK.",
  authors: [{ name: "Faiza Zone" }],
  openGraph: {
    title: "Faiza Zone",
    description: "Online fashion store for Bangladesh, USA and UK.",
    type: "website",
    siteName: "Faiza Zone",
  },
  twitter: {
    card: "summary_large_image",
    site: "@faizazone",
  },
  icons: {
    icon: "/api/favicon",
    shortcut: "/api/favicon",
    apple: "/api/favicon",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
