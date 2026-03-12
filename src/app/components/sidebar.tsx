"use client"

import Link from "next/link"
import React from "react"
import { usePathname } from "next/navigation"
import { merriweather } from "../lib/utils"
import { sponsorLinks } from "../lib/sponsors"
import TableOfContents from "./tableOfContents"

const NON_POST_PATHS = new Set(["/", "/sponsor", "/contact", "/all"])

function isSinglePostPath(pathname: string) {
  if (!pathname || NON_POST_PATHS.has(pathname)) return false

  const normalized = pathname.replace(/^\/|\/$/g, "")
  if (!normalized) return false

  return !normalized.includes("/")
}

export default function Sidebar() {
  const pathname = usePathname()
  const showPostTocOnly = isSinglePostPath(pathname)

  return (
    <aside className='px-4 pt-5 pb-4 border-t border-slate-200 md:border-0 md:p-0 md:mt-[50px] min-w-0'>
      {showPostTocOnly ? (
        <TableOfContents />
      ) : (
        <SidebarWidget>
          <SidebarHeading>Sponsors</SidebarHeading>
          <LinksWidget links={sponsorLinks}>
            <SponsorMeLink />
          </LinksWidget>
        </SidebarWidget>
      )}
    </aside>
  )
}

function SidebarHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className={`${merriweather.className} font-bold mb-2`}>{children}</h3>
  )
}

function SidebarWidget({ children }: { children: React.ReactNode }) {
  return <div className='mb-8'>{children}</div>
}

function LinksWidget({
  links,
  children,
}: {
  links: any[]
  children?: React.ReactNode
}) {
  return (
    <ul className='space-y-1'>
      {links.map((link) => (
        <li className='uppercase text-[14px]' key={link.name}>
          <Link
            href={link.link}
            target='_blank'
            className='border-b border-b-pink-600 border-dashed hover:border-solid'
          >
            {link.name}
          </Link>
        </li>
      ))}
      {children}
    </ul>
  )
}

function SponsorMeLink() {
  return (
    <li className='uppercase text-[14px]' key='sponsore-me'>
      <Link
        href='/sponsor'
        className='border-b border-b-pink-600 border-dashed hover:border-solid'
      >
        Become a sponsor ⭐
      </Link>
    </li>
  )
}
