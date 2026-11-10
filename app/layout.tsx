import type { Metadata } from "next";
import "./globals.css";

const title = "Nikita Zakharenko | Golang Software Engineer";
const description = "Go, high-load systems and data engineering. Nikita Zakharenko: 4+ years of backend experience, Wildberries, Belgrade.";

export const metadata: Metadata = {
  title,
  description,
  icons: { icon: "/favicon.svg" },
  openGraph: { title, description, type: "profile", locale: "en_US", alternateLocale: ["ru_RU"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0f0c16" />
        <meta name="color-scheme" content="dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;500&family=JetBrains+Mono:wght@400;500&family=Onest:wght@400;500;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
