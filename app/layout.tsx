import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getSignedInPerson } from "@/lib/session";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

export async function generateMetadata(): Promise<Metadata> {
  // Whoever is signed in comes first in the tab title, so several open
  // profiles can be told apart.
  const person = await getSignedInPerson();
  return {
    title: person
      ? { default: `${person.name} · Zollhaus Wichtel`, template: `${person.name} · %s` }
      : { default: "Zollhaus Wichtel", template: "%s · Zollhaus Wichtel" },
    description: "Die Familien-Wunschlisten vom Zollhaus.",
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f4ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1512" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${geist.variable} ${fraunces.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans text-ink antialiased">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-10 text-center text-sm text-muted sm:px-6">
          <div aria-hidden className="garland mx-auto mb-4 max-w-xs opacity-70" />
          Zollhaus Wichtel · Wunschlisten für die ganze Familie ·{" "}
          <Link href="/admin" className="underline-offset-4 hover:text-ink hover:underline">
            Admin
          </Link>
        </footer>
      </body>
    </html>
  );
}
