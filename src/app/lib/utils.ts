import { Merriweather } from "next/font/google"
import { API_URL, HOME_POST_LIMIT, WP_REVALIDATE_SECONDS } from "./consts"

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const merriweather = Merriweather({ weight: "900", subsets: ["latin"] })

export async function fetchSinglePost(slug: string) {
  const query = new URLSearchParams({ slug })
  const response = await fetch(`${API_URL}/posts?${query.toString()}`, {
    next: {
      revalidate: WP_REVALIDATE_SECONDS,
      tags: [`post:${slug}`],
    },
  })
  const post = await response.json()
  if (post.length === 0) return null
  return post[0]
}

export async function fetchPostSlugs(limit = HOME_POST_LIMIT) {
  const query = new URLSearchParams({
    per_page: String(limit),
    _fields: "slug",
  })
  const response = await fetch(`${API_URL}/posts?${query.toString()}`, {
    next: {
      revalidate: WP_REVALIDATE_SECONDS,
    },
  })
  return response.json()
}

export async function fetchPostsByCategory(categoryId: number, all = false) {
  const query = new URLSearchParams({
    categories: String(categoryId),
  })

  if (!all) {
    query.set("per_page", String(HOME_POST_LIMIT))
  }

  const response = await fetch(`${API_URL}/posts?${query.toString()}`, {
    next: {
      revalidate: WP_REVALIDATE_SECONDS,
      tags: [`category:${categoryId}`],
    },
  })
  return response.json()
}

export function prettyDate(date: string) {
  return new Date(date).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function cleanUpText(text) {
  return text.replace(/<[^>]*>/g, "").replace(/\n\n+/g, "\n\n")
}
