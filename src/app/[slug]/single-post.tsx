import React from "react"
import { prettyDate } from "../lib/utils"
import { AUTHOR_NAME, BANGLA_CATEGORY } from "../lib/consts"
import { banglaHfont } from "@/fonts/fonts"
import ShareButtons from "./components/share-buttons"
import Image from "next/image"
import { EnglishTitle } from "../components/english-title"
import PostContent from "./components/post-content"
import { notFound } from "next/navigation"
import { getInternalPath } from "./lib/internal-links"
import { parseFragment } from "parse5"

type Props = {
  slug: string
  post: any
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

type ParsedNode = {
  nodeName?: string
  attrs?: Array<{ name: string; value: string }>
  childNodes?: ParsedNode[]
  sourceCodeLocation?: {
    startTag?: {
      startOffset: number
      endOffset: number
    }
  }
}

function collectAnchorNodes(root: ParsedNode) {
  const anchors: ParsedNode[] = []
  const stack: ParsedNode[] = [root]

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) continue

    if (node.nodeName === "a" && node.sourceCodeLocation?.startTag) {
      anchors.push(node)
    }

    if (node.childNodes?.length) {
      for (let i = node.childNodes.length - 1; i >= 0; i -= 1) {
        stack.push(node.childNodes[i])
      }
    }
  }

  return anchors
}

function transformExternalLinks(html: string) {
  const parsed = parseFragment(html, {
    sourceCodeLocationInfo: true,
  }) as ParsedNode
  const replacements: Array<{
    startOffset: number
    endOffset: number
    tag: string
  }> = []

  collectAnchorNodes(parsed).forEach((anchorNode) => {
    const startTag = anchorNode.sourceCodeLocation?.startTag
    if (!startTag) return

    const originalAnchorTag = html.slice(startTag.startOffset, startTag.endOffset)
    const hrefAttr = anchorNode.attrs?.find((attr) => attr.name === "href")
    const href = hrefAttr?.value || ""
    const internalPath = getInternalPath(href, "https://www.tamalchowdhury.com")

    if (internalPath) {
      const updatedTag = normalizeInternalAnchor(originalAnchorTag, internalPath)
      if (updatedTag !== originalAnchorTag) {
        replacements.push({
          startOffset: startTag.startOffset,
          endOffset: startTag.endOffset,
          tag: updatedTag,
        })
      }
      return
    }

    if (!isExternalLink(href)) return

    const updatedTag = normalizeExternalAnchor(originalAnchorTag)
    if (updatedTag !== originalAnchorTag) {
      replacements.push({
        startOffset: startTag.startOffset,
        endOffset: startTag.endOffset,
        tag: updatedTag,
      })
    }
  })

  if (replacements.length === 0) return html

  let updatedHtml = html
  replacements
    .sort((a, b) => b.startOffset - a.startOffset)
    .forEach(({ startOffset, endOffset, tag }) => {
      updatedHtml =
        updatedHtml.slice(0, startOffset) + tag + updatedHtml.slice(endOffset)
    })

  return updatedHtml
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
