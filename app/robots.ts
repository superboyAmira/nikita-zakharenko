import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "PerplexityBot",
          "Google-Extended",
          "Googlebot",
          "Bingbot",
          "Yandex",
        ],
        allow: "/",
      },
    ],
    sitemap: "https://www.zakharenkolink.com/sitemap.xml",
    host: "https://www.zakharenkolink.com",
  };
}
