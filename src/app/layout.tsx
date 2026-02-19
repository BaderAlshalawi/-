import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LocaleInitializer } from "@/components/layout/LocaleInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LeanPulse | Enterprise Governance Platform",
  description: "LeanPulse — enterprise governance platform for managing technology investments across Portfolios, Products, Releases, and Features.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <LocaleInitializer />
          {children}
        </Providers>
      </body>
    </html>
  );
}
