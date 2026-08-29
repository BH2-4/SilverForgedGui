import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { SiteTopBar } from "@/components/shared/SiteTopBar";
import { AtmosphereLayer } from "@/components/visual/AtmosphereLayer";
import { ParticleField } from "@/components/visual/ParticleField";
import { PageTransition } from "@/components/visual/PageTransition";
import { resolveLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionaries";
import { LOCALE_HTML_TAGS } from "@/lib/i18n/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  return {
    title: translate(locale, "meta.title"),
    description: translate(locale, "meta.description"),
    metadataBase: new URL("http://localhost:3000"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await resolveLocale();

  return (
    <html
      lang={LOCALE_HTML_TAGS[locale]}
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <AtmosphereLayer />
        <ParticleField />
        <div className="relative z-10">
          <I18nProvider initialLocale={locale}>
            <SiteTopBar />
            <PageTransition>{children}</PageTransition>
          </I18nProvider>
        </div>
      </body>
    </html>
  );
}
