import { MetadataRoute } from "next"
import { BASE_URL } from "./lib/consts"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/api/v1/webhook"],
      },
      // High-frequency AI crawlers: keep them on content pages and away from heavy/static paths.
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "PerplexityBot",
          "CCBot",
          "GoogleOther",
          "Bytespider",
          "Amazonbot",
          "Applebot-Extended",
        ],
        allow: "/",
        disallow: [
          "/api/",
          "/api/v1/webhook",
          "/_next/",
          "/img/",
          "/contact",
          "/sponsor",
        ],
      },
      // User-initiated / search-oriented AI agents can access full public content.
      {
        userAgent: ["ChatGPT-User", "OAI-SearchBot", "Claude-User", "Google-Extended"],
        allow: "/",
        disallow: ["/api/", "/api/v1/webhook"],
      },
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`],
    host: BASE_URL,
  }
}
