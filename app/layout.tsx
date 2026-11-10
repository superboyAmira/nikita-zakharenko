import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://www.zakharenkolink.com";
const title = "Nikita Zakharenko | Golang Software Engineer";
const description =
  "Go, high-load systems and data engineering. Nikita Zakharenko (Никита Захаренко): 4+ years of backend experience, Wildberries, Belgrade.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [
    "Nikita Zakharenko",
    "Никита Захаренко",
    "Golang Software Engineer",
    "Go Backend Developer",
    "Разработчик Go",
    "Wildberries",
    "ClickHouse",
    "PostgreSQL",
    "Kafka",
    "gRPC",
    "High-load systems",
    "Belgrade",
  ],
  authors: [{ name: "Nikita Zakharenko", url: siteUrl }],
  creator: "Nikita Zakharenko",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Nikita Zakharenko",
    type: "profile",
    firstName: "Nikita",
    lastName: "Zakharenko",
    locale: "en_US",
    alternateLocale: ["ru_RU"],
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: siteUrl,
  name: title,
  description,
  inLanguage: ["en", "ru"],
  mainEntity: {
    "@type": "Person",
    name: "Nikita Zakharenko",
    alternateName: "Никита Захаренко",
    jobTitle: "Golang Software Engineer",
    description,
    url: siteUrl,
    worksFor: {
      "@type": "Organization",
      name: "Wildberries",
    },
    homeLocation: {
      "@type": "Place",
      name: "Belgrade, Serbia",
    },
    alumniOf: [
      {
        "@type": "CollegeOrUniversity",
        name: "Russian University of Transport (RUT MIIT)",
      },
      {
        "@type": "EducationalOrganization",
        name: "School 21",
      },
    ],
    knowsAbout: [
      "Go (Golang)",
      "PostgreSQL",
      "ClickHouse",
      "Apache Kafka",
      "Redis",
      "gRPC",
      "Docker",
      "Kubernetes",
      "High-Load Backend Systems",
      "Observability",
      "Grafana",
      "Jaeger",
      "Prometheus",
    ],
    knowsLanguage: ["ru", "en", "de"],
    sameAs: [
      "https://www.linkedin.com/in/zakharenkolink",
      "https://t.me/zakharenkoNikita",
      "https://github.com/superboyAmira",
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0f0c16" />
        <meta name="color-scheme" content="dark" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Context" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;500&family=JetBrains+Mono:wght@400;500&family=Onest:wght@400;500;600&display=swap" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
