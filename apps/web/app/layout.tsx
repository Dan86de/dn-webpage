import React from "react";
import "global.css";
import Header from "../components/Header";
import localFont from "next/font/local";
import clsx from "clsx";
import AnalyticsWrapper from "../components/AnalyticsWrapper";

const geomanist = localFont({
  src: [
    {
      path: "../public/fonts/geomanist-thin-webfont.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/geomanist-extralight-webfont.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/fonts/geomanist-light-webfont.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/geomanist-regular-webfont.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/geomanist-book-webfont.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/geomanist-medium-webfont.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/geomanist-bold-webfont.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/geomanist-black-webfont.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/geomanist-ultra-webfont.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "../public/fonts/geomanist-thin-italic-webfont.woff2",
      weight: "100",
      style: "italic",
    },
    {
      path: "../public/fonts/geomanist-extralight-italic-webfont.woff2",
      weight: "200",
      style: "italic",
    },
    {
      path: "../public/fonts/geomanist-light-italic-webfont.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/geomanist-regular-italic-webfont.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/geomanist-book-italic-webfont.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/geomanist-medium-italic-webfont.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/geomanist-bold-italic-webfont.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/fonts/geomanist-black-italic-webfont.woff2",
      weight: "800",
      style: "italic",
    },
    {
      path: "../public/fonts/geomanist-ultra-italic-webfont.woff2",
      weight: "900",
      style: "italic",
    },
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
        geomanist.className
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
