import React from "react";
import "global.css";
import Header from "../components/Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="text-black bg-white dark:text-white dark:bg-[#111010]"
      // className={clsx(
      //   "text-black bg-white dark:text-white dark:bg-[#111010]",
      //   geomanist.variable
      // )}
    >
      <body>
        <Header />
        <main className="container mx-auto max-w-7xl">{children}</main>
      </body>
    </html>
  );
}
