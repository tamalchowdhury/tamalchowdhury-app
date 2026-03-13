import { API_URL, BASE_URL, SITE_NAME, SITE_TAGLINE, WP_REVALIDATE_SECONDS } from "./consts"

type WPPostForLlms = {
  slug: string
  date: string
  title?: { rendered?: string }
  excerpt?: { rendered?: string }
}

function stripHtml(value = "") {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function decodeEntities(value = "") {
  return value
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8230;|&hellip;/g, "...")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function normalizeText(value = "") {
  return decodeEntities(stripHtml(value))
}

function toIsoDate(value: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().split("T")[0]
}

export async function fetchAllPostsForLlms(maxPages = 20) {
  const posts: WPPostForLlms[] = []

  for (let page = 1; page <= maxPages; page += 1) {
    const query = new URLSearchParams({
      per_page: "100",
      page: String(page),
      _fields: "slug,date,title,excerpt",
    })

    const response = await fetch(`${API_URL}/posts?${query.toString()}`, {
      next: { revalidate: WP_REVALIDATE_SECONDS },
    })

    if (!response.ok) {
      break
    }

    const batch = (await response.json()) as WPPostForLlms[]
    if (!batch.length) {
      break
    }

    posts.push(...batch)

    const totalPagesHeader = response.headers.get("x-wp-totalpages")
    const totalPages = Number(totalPagesHeader || "1")
    if (page >= totalPages || Number.isNaN(totalPages)) {
      break
    }
  }

  return posts
}

export function buildLlmsHeader() {
  return [
    `# ${SITE_NAME}`,
    `> ${SITE_TAGLINE}. Public programming articles in Bangla and English.`,
    "",
    "## Site Index",
    `- [Home](${BASE_URL})`,
    `- [Bangla Posts](${BASE_URL}/bn)`,
    `- [English Posts](${BASE_URL}/en)`,
    `- [All Posts](${BASE_URL}/all)`,
    `- [Sitemap](${BASE_URL}/sitemap.xml)`,
    `- [Extended LLM Index](${BASE_URL}/llms-full.txt)`,
    "",
  ].join("\n")
}

export function mapPostsToLlmsLines(posts: WPPostForLlms[]) {
  return posts.map((post) => {
    const title = normalizeText(post.title?.rendered || post.slug || "Untitled")
    const excerpt = normalizeText(post.excerpt?.rendered || "")
    const shortExcerpt = excerpt.slice(0, 220)
    const publishedDate = toIsoDate(post.date)
    const postUrl = `${BASE_URL}/${post.slug}`
    const details = [publishedDate, shortExcerpt].filter(Boolean).join(" - ")

    return details ? `- [${title}](${postUrl}) - ${details}` : `- [${title}](${postUrl})`
  })
}
