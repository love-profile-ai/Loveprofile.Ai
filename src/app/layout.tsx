import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "A guided, romantic AI relationship reflection — from first question to your personalized report.",
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "Enter a private relationship journal powered by AI. Understand the patterns beneath your feelings.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${fraunces.variable} min-h-screen antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
