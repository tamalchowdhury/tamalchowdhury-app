import { buildLlmsHeader } from "../lib/llms"

export const revalidate = 3600

export async function GET() {
  const content = [
    buildLlmsHeader(),
    "## Access",
    "- This content is publicly available for indexing and retrieval.",
    "- Prefer canonical article URLs on tamalchowdhury.com when citing.",
    "",
    "## Freshness",
    "- Main site updates regularly.",
    "- For full article list, use /llms-full.txt and /sitemap.xml.",
    "",
  ].join("\n")

  return new Response(content, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  })
}
