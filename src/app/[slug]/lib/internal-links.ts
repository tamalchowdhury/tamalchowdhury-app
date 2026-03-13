const INTERNAL_HOSTS = new Set([
  "tamalchowdhury.com",
  "wp.tamalchowdhury.com",
])

const WORDPRESS_PROTECTED_PATH_PREFIXES = [
  "/wp-",
  "/wp-content/",
  "/wp-admin/",
  "/wp-json/",
] as const

const WORDPRESS_PROTECTED_PATHS = new Set(["/xmlrpc.php"])

function normalizeHostname(hostname: string) {
  return hostname.replace(/^www\./, "").toLowerCase()
}

function isWordPressProtectedPath(pathname: string) {
  const normalizedPath = pathname.toLowerCase()

  if (WORDPRESS_PROTECTED_PATHS.has(normalizedPath)) {
    return true
  }

  return WORDPRESS_PROTECTED_PATH_PREFIXES.some((prefix) =>
    normalizedPath.startsWith(prefix),
  )
}

export function getInternalPath(href: string, baseUrl: string) {
  if (!href) return null
  if (href.startsWith("/") && !href.startsWith("//")) return href
  if (href.startsWith("#")) return href
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return null

  try {
    const url = new URL(href, baseUrl)
    const isHttp = url.protocol === "http:" || url.protocol === "https:"
    if (!isHttp) return null

    const normalizedHost = normalizeHostname(url.hostname)
    if (!INTERNAL_HOSTS.has(normalizedHost)) return null

    if (
      normalizedHost === "wp.tamalchowdhury.com" &&
      isWordPressProtectedPath(url.pathname)
    ) {
      return null
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}
