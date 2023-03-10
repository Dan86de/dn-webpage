import React from "react";
import "global.css";
import Header from "../components/Header";
import localFont from "next/font/local";
import { clsx } from "tailwind-config";
import AnalyticsWrapper from "../components/AnalyticsWrapper";

const silkaMono = localFont({
  src: [
    {
      path: "../public/fonts/silka-mono/silkamono-regular-webfont.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/silka-mono/silkamono-medium-webfont.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/silka-mono/silkamono-semibold-webfont.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/silka-mono/silkamono-bold-webfont.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-silka-mono",
});

const geomanist = localFont({
  src: [
    // {
    //   path: "../public/fonts/geomanist/geomanist-thin-webfont.woff2",
    //   weight: "100",
    //   style: "normal",
    // },
    // {
    //   path: "../public/fonts/geomanist/geomanist-extralight-webfont.woff2",
    //   weight: "200",
    //   style: "normal",
    // },
    // {
    //   path: "../public/fonts/geomanist/geomanist-light-webfont.woff2",
    //   weight: "300",
    //   style: "normal",
    // },
    {
      path: "../public/fonts/geomanist/geomanist-regular-webfont.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/geomanist/geomanist-book-webfont.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/geomanist/geomanist-medium-webfont.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/geomanist/geomanist-bold-webfont.woff2",
      weight: "700",
      style: "normal",
    },
    // {
    //   path: "../public/fonts/geomanist/geomanist-black-webfont.woff2",
    //   weight: "800",
    //   style: "normal",
    // },
    // {
    //   path: "../public/fonts/geomanist/geomanist-ultra-webfont.woff2",
    //   weight: "900",
    //   style: "normal",
    // },
    // {
    //   path: "../public/fonts/geomanist/geomanist-thin-italic-webfont.woff2",
    //   weight: "100",
    //   style: "italic",
    // },
    // {
    //   path: "../public/fonts/geomanist/geomanist-extralight-italic-webfont.woff2",
    //   weight: "200",
    //   style: "italic",
    // },
    // {
    //   path: "../public/fonts/geomanist/geomanist-light-italic-webfont.woff2",
    //   weight: "300",
    //   style: "italic",
    // },
    // {
    //   path: "../public/fonts/geomanist/geomanist-regular-italic-webfont.woff2",
    //   weight: "400",
    //   style: "italic",
    // },
    // {
    //   path: "../public/fonts/geomanist/geomanist-book-italic-webfont.woff2",
    //   weight: "500",
    //   style: "italic",
    // },
    // {
    //   path: "../public/fonts/geomanist/geomanist-medium-italic-webfont.woff2",
    //   weight: "600",
    //   style: "italic",
    // },
    // {
    //   path: "../public/fonts/geomanist/geomanist-bold-italic-webfont.woff2",
    //   weight: "700",
    //   style: "italic",
    // },
    // {
    //   path: "../public/fonts/geomanist/geomanist-black-italic-webfont.woff2",
    //   weight: "800",
    //   style: "italic",
    // },
    // {
    //   path: "../public/fonts/geomanist/geomanist-ultra-italic-webfont.woff2",
    //   weight: "900",
    //   style: "italic",
    // },
  ],
  display: "swap",
  variable: "--font-geomanist",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={clsx(
        "text-neutral-900 bg-neutral-50 dark:text-neutral-50 dark:bg-neutral-900",
        geomanist.variable,
        silkaMono.variable
      )}
    >
      <body>
        <Header />
        <main className="container mx-auto max-w-7xl">
          {children}
          <AnalyticsWrapper />
        </main>
      </body>
    </html>
  );
}
