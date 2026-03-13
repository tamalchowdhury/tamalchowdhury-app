import Link from "next/link"
import React from "react"
import { BANGLA_CATEGORY } from "../lib/consts"
import { banglaHfont } from "@/fonts/fonts"
import { ReadMoreLinkBn } from "./read-more-links"
import { fetchPostsByCategory } from "../lib/utils"

export default async function HomeBanglaLatestPosts({ all = false }) {
  const post = await fetchPostsByCategory(BANGLA_CATEGORY, all)

  return (
    <div className='space-y-[30px]'>
      {post.map((p) => (
        <div className='space-y-[20px]' key={p.id}>
          <Link href={`/${p.slug}`} prefetch={true}>
            <h2
              className={`${banglaHfont.className} text-[24px] sm:text-[28px] leading-tight font-bold hover:underline`}
            >
              {p.title.rendered}
            </h2>
          </Link>
          <div
            className={` text-[16px] md:text-[20px]`}
            dangerouslySetInnerHTML={{ __html: p.excerpt.rendered }}
          />
          <ReadMoreLinkBn slug={p.slug} />
        </div>
      ))}
    </div>
  )
}
