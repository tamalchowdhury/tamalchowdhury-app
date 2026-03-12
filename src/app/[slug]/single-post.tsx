import React from "react"
import { prettyDate } from "../lib/utils"
import { AUTHOR_NAME, BANGLA_CATEGORY } from "../lib/consts"
import { banglaHfont } from "@/fonts/fonts"
import ShareButtons from "./components/share-buttons"
import Image from "next/image"
import { EnglishTitle } from "../components/english-title"
import PostContent from "./components/post-content"
import { notFound } from "next/navigation"

type Props = {
  slug: string
  post: any
}

const INTERNAL_HOSTS = new Set([
  "tamalchowdhury.com",
  "www.tamalchowdhury.com",
  "wp.tamalchowdhury.com",
])

function getInternalPath(href: string) {
  if (!href) return null
  if (href.startsWith("/")) return href
  if (href.startsWith("#")) return href

  try {
    const url = new URL(href, "https://www.tamalchowdhury.com")
    const isHttp = url.protocol === "http:" || url.protocol === "https:"
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase()
    const normalizedHost = hostname === "tamalchowdhury.com" ? "tamalchowdhury.com" : hostname

    if (!isHttp || !INTERNAL_HOSTS.has(normalizedHost) && !INTERNAL_HOSTS.has(url.hostname.toLowerCase())) {
      return null
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

function isExternalLink(href: string) {
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("/") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false
  }

  try {
    const url = new URL(href, "https://tamalchowdhury.com")
    const isHttp = url.protocol === "http:" || url.protocol === "https:"
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase()

    return isHttp && hostname !== "tamalchowdhury.com"
  } catch {
    return false
  }
}

function normalizeExternalAnchor(anchorTag: string) {
  let updated = anchorTag

  if (/\btarget\s*=/i.test(updated)) {
    updated = updated.replace(
      /\btarget\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i,
      'target="_blank"',
    )
  } else {
    updated = updated.replace(/<a\b/i, '<a target="_blank"')
  }

  if (/\brel\s*=/i.test(updated)) {
    updated = updated.replace(
      /\brel\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i,
      (_match, _full, doubleQuoted, singleQuoted, bare) => {
        const relValue = (doubleQuoted || singleQuoted || bare || "").trim()
        const relParts = new Set(relValue.split(/\s+/).filter(Boolean))
        relParts.add("noopener")
        relParts.add("noreferrer")
        return `rel="${Array.from(relParts).join(" ")}"`
      },
    )
  } else {
    updated = updated.replace(/<a\b/i, '<a rel="noopener noreferrer"')
  }

  if (/\bclass\s*=/i.test(updated)) {
    updated = updated.replace(
      /\bclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i,
      (_match, _full, doubleQuoted, singleQuoted, bare) => {
        const classValue = (doubleQuoted || singleQuoted || bare || "").trim()
        const classes = new Set(classValue.split(/\s+/).filter(Boolean))
        classes.add("post-external-link")
        return `class="${Array.from(classes).join(" ")}"`
      },
    )
  } else {
    updated = updated.replace(/<a\b/i, '<a class="post-external-link"')
  }

  return updated
}

function normalizeInternalAnchor(anchorTag: string, internalPath: string) {
  let updated = anchorTag

  if (/\bhref\s*=/i.test(updated)) {
    updated = updated.replace(
      /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i,
      `href="${internalPath}"`,
    )
  }

  updated = updated.replace(/\s+target\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, "")

  return updated
}

function transformExternalLinks(html: string) {
  return html.replace(/<a\b[^>]*>/gi, (anchorTag) => {
    const hrefMatch = anchorTag.match(
      /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i,
    )
    const href = hrefMatch?.[2] || hrefMatch?.[3] || hrefMatch?.[4] || ""
    const internalPath = getInternalPath(href)

    if (internalPath) {
      return normalizeInternalAnchor(anchorTag, internalPath)
    }

    if (!isExternalLink(href)) return anchorTag

    return normalizeExternalAnchor(anchorTag)
  })
}

function conditionalDateByline(publishedDate: string, updatedDate: string) {
  const published = new Date(publishedDate).getTime()
  const updated = new Date(updatedDate).getTime()
  const diffHours = Math.abs(updated - published) / (1000 * 60 * 60)

  // if the updated date is within the same 24 hours as the published date, return the published date
  if (diffHours <= 24) {
    return `প্রথম প্রকাশঃ ${prettyDate(publishedDate)}`
  }
  return `প্রথম প্রকাশঃ ${prettyDate(publishedDate)} # সর্বশেষ আপডেটঃ ${prettyDate(updatedDate)}`
}

export default function SinglePostComponent({ slug, post }: Props) {
  if (!post) {
    notFound()
  }

  // needs to implement a better solution here
  const isBangla = post.categories.includes(BANGLA_CATEGORY)
  const transformedPostContent = transformExternalLinks(post.content.rendered)

  return (
    <>
      <div className='space-y-4'>
        {isBangla ? (
          <BanglaTitle>{post.title.rendered}</BanglaTitle>
        ) : (
          <EnglishTitle>{post.title.rendered}</EnglishTitle>
        )}

        <div className='flex gap-[10px] items-start sm:items-center text-[13px] sm:text-[14px] text-[#333]/70'>
          <div>
            <Image
              src='/img/author.jpg'
              alt='Tamal Chowdhury'
              width={48}
              height={48}
              className='rounded-full object-cover w-10 h-10 sm:w-12 sm:h-12'
            />
          </div>
          <div className='min-w-0'>
            <div className='italic'>লেখক: {AUTHOR_NAME}</div>
            <div className='uppercase text-[12px] sm:text-[14px]'>
              {conditionalDateByline(post.date, post.modified)}
            </div>
          </div>
        </div>

        <PostContent
          className='post__body text-[16px] md:text-[20px] overflow-x-hidden'
          html={transformedPostContent}
        />
      </div>
      <ShareButtons slug={slug} />
    </>
  )
}

export function BanglaTitle({ children, className = "" }) {
  return (
    <h1
      className={`text-[24px] sm:text-[28px] md:text-[38px] font-bold leading-tight ${banglaHfont.className} ${className}`}
    >
      {children}
    </h1>
  )
}
