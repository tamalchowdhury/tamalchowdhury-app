"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { merriweather } from "../lib/utils"

type TocItem = {
  id: string
  text: string
  level: 1 | 2 | 3 | 4
}

const postTitleSelector = "main h1"
const postBodySelector = ".post__body"

function slugifyHeading(text: string) {
  const normalized = text
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()

  return normalized || "section"
}

async function copyText(text: string) {
  if (!text) return false

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const fallback = document.createElement("textarea")
      fallback.value = text
      fallback.setAttribute("readonly", "")
      fallback.style.position = "fixed"
      fallback.style.opacity = "0"
      document.body.appendChild(fallback)
      fallback.select()
      const copied = document.execCommand("copy")
      document.body.removeChild(fallback)
      return copied
    } catch {
      return false
    }
  }
}

function getPermalink(hashId: string) {
  return `${window.location.origin}${window.location.pathname}${window.location.search}#${hashId}`
}

function getHeadingText(heading: HTMLHeadingElement) {
  const clonedHeading = heading.cloneNode(true) as HTMLHeadingElement
  clonedHeading.querySelectorAll(".post-heading-hash").forEach((node) => node.remove())
  return clonedHeading.textContent?.trim() || ""
}

function getPostTitleItem() {
  const postTitle = document.querySelector<HTMLHeadingElement>(postTitleSelector)
  const titleText = postTitle?.textContent?.trim() || ""
  if (!postTitle || !titleText) return null

  if (!postTitle.id) {
    postTitle.id = "post-title"
  }

  return {
    id: postTitle.id,
    text: titleText,
    level: 1 as const,
  }
}

function attachHeadingHashLinks(items: TocItem[]) {
  items.forEach((item) => {
    if (item.level < 2) return

    const heading = document.getElementById(item.id)
    if (!heading) return

    const existing = heading.querySelector<HTMLAnchorElement>(".post-heading-hash")
    const anchor = existing || document.createElement("a")

    anchor.className = "post-heading-hash ml-2 text-[#333]/45 hover:text-pink-600"
    anchor.href = `#${item.id}`
    anchor.textContent = "#"
    anchor.ariaLabel = `Copy link for ${item.text}`
    anchor.title = "Copy section link"

    if (!anchor.dataset.copyBound) {
      anchor.dataset.copyBound = "true"
      anchor.addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()
        void copyText(getPermalink(item.id))
      })
    }

    if (!existing) heading.appendChild(anchor)
  })
}

function createTocFromDom() {
  const postBody = document.querySelector(postBodySelector)
  if (!postBody) return []

  const headings = Array.from(postBody.querySelectorAll<HTMLHeadingElement>("h2, h3, h4"))

  const titleItem = getPostTitleItem()
  if (!titleItem && !headings.length) return []

  const usedIds = new Map<string, number>()
  const items: TocItem[] = []

  if (titleItem) {
    usedIds.set(titleItem.id, 1)
    items.push(titleItem)
  }

  headings.forEach((heading) => {
    const text = getHeadingText(heading)
    if (!text) return

    const level = Number(heading.tagName[1]) as TocItem["level"]
    if (level < 2 || level > 4) return

    const preferredId = heading.id || slugifyHeading(text)
    const currentCount = usedIds.get(preferredId) || 0
    const finalId = currentCount === 0 ? preferredId : `${preferredId}-${currentCount}`

    usedIds.set(preferredId, currentCount + 1)
    heading.id = finalId

    items.push({
      id: finalId,
      text,
      level,
    })
  })

  attachHeadingHashLinks(items)
  return items
}

function areItemsEqual(a: TocItem[], b: TocItem[]) {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i += 1) {
    if (
      a[i].id !== b[i].id ||
      a[i].text !== b[i].text ||
      a[i].level !== b[i].level
    ) {
      return false
    }
  }

  return true
}

function getActiveHeadingId(items: TocItem[]) {
  const offset = 140
  const scrollBottom = window.scrollY + window.innerHeight
  const pageBottom = document.documentElement.scrollHeight
  const isNearPageBottom = scrollBottom >= pageBottom - 6

  if (isNearPageBottom && items.length) {
    return items[items.length - 1].id
  }

  let activeId = items[0]?.id || ""

  for (const item of items) {
    const heading = document.getElementById(item.id)
    if (!heading) continue

    const top = heading.getBoundingClientRect().top
    if (top - offset <= 0) {
      activeId = item.id
    } else {
      break
    }
  }

  return activeId
}

export default function TableOfContents() {
  const pathname = usePathname()
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState("")
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    let refreshDebounce: number | null = null
    let rafId: number | null = null

    const refreshToc = () => {
      const nextItems = createTocFromDom()
      setItems((currentItems) =>
        areItemsEqual(currentItems, nextItems) ? currentItems : nextItems,
      )
      setActiveId(getActiveHeadingId(nextItems))
    }

    rafId = window.requestAnimationFrame(refreshToc)

    const observer = new MutationObserver(() => {
      if (refreshDebounce !== null) window.clearTimeout(refreshDebounce)
      refreshDebounce = window.setTimeout(refreshToc, 80)
    })

    const postBody = document.querySelector(postBodySelector)
    if (postBody) {
      observer.observe(postBody, {
        childList: true,
        subtree: true,
      })
    }

    const fallbackTimers: number[] = [140, 320, 700, 1300].map((delay) =>
      window.setTimeout(refreshToc, delay),
    )

    return () => {
      observer.disconnect()
      fallbackTimers.forEach((timer) => window.clearTimeout(timer))
      if (rafId !== null) window.cancelAnimationFrame(rafId)
      if (refreshDebounce !== null) window.clearTimeout(refreshDebounce)
    }
  }, [pathname])

  useEffect(() => {
    if (!items.length) return

    let scrollRafId: number | null = null

    const refreshActiveId = () => {
      setActiveId((currentId) => {
        const nextId = getActiveHeadingId(items)
        return currentId === nextId ? currentId : nextId
      })
    }

    const onScroll = () => {
      if (scrollRafId !== null) return
      scrollRafId = window.requestAnimationFrame(() => {
        scrollRafId = null
        refreshActiveId()
      })
    }

    const onHashChange = () => {
      const hashId = window.location.hash.replace(/^#/, "")
      if (hashId) {
        setActiveId(hashId)
        return
      }
      refreshActiveId()
    }

    refreshActiveId()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    window.addEventListener("hashchange", onHashChange)

    return () => {
      if (scrollRafId !== null) {
        window.cancelAnimationFrame(scrollRafId)
      }
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      window.removeEventListener("hashchange", onHashChange)
    }
  }, [items])

  if (!items.length) return null

  return (
    <div className='mb-8 md:sticky md:top-6'>
      <div className='flex items-center justify-between mb-2'>
        <h3 className={`${merriweather.className} font-bold`}>
          পেজের সব অংশসমূহ
        </h3>
        <button
          type='button'
          className='md:hidden text-[13px] font-medium text-pink-700 border border-pink-200 rounded px-2 py-1'
          onClick={() => setIsMobileOpen((current) => !current)}
          aria-expanded={isMobileOpen}
          aria-controls='mobile-post-toc'
        >
          {isMobileOpen ? "বন্ধ করুন" : "দেখুন"}
        </button>
      </div>
      <nav
        id='mobile-post-toc'
        aria-label='পেজের সব অংশসমূহ'
        className={`${isMobileOpen ? "block" : "hidden"} md:block max-h-[45vh] md:max-h-[calc(100vh-2rem)] overflow-auto pr-1 md:pr-2`}
      >
        <ul className='space-y-1'>
          {items.map((item) => {
            const isActive = activeId === item.id
            const indicatorClass =
              item.level === 3 || item.level === 4
                ? isActive
                  ? "border-l-2 border-pink-600"
                  : "border-l border-[#333]/20"
                : isActive
                  ? "border-l-2 border-pink-600"
                  : "border-l-2 border-transparent"
            const levelClass =
              item.level === 1
                ? "pl-2"
                : item.level === 2
                  ? "pl-2"
                  : item.level === 3
                    ? "ml-3 pl-3"
                    : "ml-6 pl-3"

            return (
              <li key={item.id} className='text-[13px] md:text-[14px] leading-snug'>
                <a
                  href={`#${item.id}`}
                  className={`block transition break-words ${indicatorClass} ${levelClass} ${
                    isActive ? "text-[#111]" : "text-[#333]/70 hover:text-[#111]"
                  }`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  {item.text}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
