"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { BASE_URL } from "@/app/lib/consts"

type Props = {
  html: string
  className?: string
}

const INTERNAL_HOSTS = new Set([
  "tamalchowdhury.com",
  "www.tamalchowdhury.com",
  "wp.tamalchowdhury.com",
])

function getInternalPathFromHref(href: string) {
  if (!href) return null
  if (href.startsWith("/")) return href
  if (href.startsWith("#")) return href
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return null

  try {
    const url = new URL(href, BASE_URL)
    const isHttp = url.protocol === "http:" || url.protocol === "https:"
    if (!isHttp) return null

    const hostname = url.hostname.toLowerCase()
    if (!INTERNAL_HOSTS.has(hostname)) return null

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

function getTableTsv(table: HTMLTableElement) {
  return Array.from(table.rows)
    .map((row) =>
      Array.from(row.cells)
        .map((cell) => (cell.textContent || "").replace(/\s+/g, " ").trim())
        .join("\t"),
    )
    .join("\n")
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

function makeCopyButton(label = "Copy", extraClass = "") {
  const button = document.createElement("button")
  button.type = "button"
  button.className = `post-copy-button ${extraClass}`.trim()
  button.setAttribute("data-post-copy-managed", "true")
  button.innerHTML =
    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H10V7h9v14z"/></svg><span>${label}</span>`
  return button
}

export default function PostContent({ html, className = "" }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const root = contentRef.current
    if (!root) return

    const removeListeners: Array<() => void> = []
    const removeButtons: Array<() => void> = []

    root
      .querySelectorAll<HTMLButtonElement>(
        'button.post-copy-button[data-post-copy-managed="true"]',
      )
      .forEach((button) => button.remove())

    const addCopyHandler = (
      button: HTMLButtonElement,
      getContent: () => string,
    ) => {
      const onClick = async () => {
        const originalMarkup = button.innerHTML
        const success = await copyText(getContent())
        if (!success) return

        button.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg><span>Copied</span>'
        window.setTimeout(() => {
          button.innerHTML = originalMarkup
        }, 1400)
      }

      button.addEventListener("click", onClick)
      removeListeners.push(() => button.removeEventListener("click", onClick))
    }

    root.querySelectorAll<HTMLPreElement>("pre.wp-block-code").forEach((pre) => {
      pre.classList.add("has-copy-button")
      const button = makeCopyButton()
      pre.appendChild(button)
      removeButtons.push(() => button.remove())

      addCopyHandler(button, () => pre.querySelector("code")?.textContent || "")
    })

    root
      .querySelectorAll<HTMLElement>(".wp-block-table")
      .forEach((tableWrapper) => {
        const table = tableWrapper.querySelector("table")
        if (!table) return

        tableWrapper.classList.add("has-copy-button")
        const button = makeCopyButton("Copy table", "post-copy-button--table")
        tableWrapper.appendChild(button)
        removeButtons.push(() => button.remove())

        addCopyHandler(button, () => getTableTsv(table))
      })

    root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
      const rawHref = anchor.getAttribute("href") || ""
      const internalPath = getInternalPathFromHref(rawHref)
      if (!internalPath) return

      anchor.setAttribute("href", internalPath)

      if (!anchor.getAttribute("target")) {
        void router.prefetch(internalPath)
      }

      const onClick = (event: MouseEvent) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          anchor.hasAttribute("download")
        ) {
          return
        }

        const target = anchor.getAttribute("target")
        if (target && target !== "_self") return

        event.preventDefault()
        router.push(internalPath)
      }

      anchor.addEventListener("click", onClick)
      removeListeners.push(() => anchor.removeEventListener("click", onClick))
    })

    return () => {
      removeListeners.forEach((remove) => remove())
      removeButtons.forEach((remove) => remove())
    }
  }, [html, router])

  return (
    <div
      ref={contentRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
