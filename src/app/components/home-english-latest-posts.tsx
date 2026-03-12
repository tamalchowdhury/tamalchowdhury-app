import Link from "next/link"
import React from "react"
import { fetchPostsByCategory, merriweather } from "../lib/utils"
import { ENGLISH_CATEGORY } from "../lib/consts"
import { ReadMoreLinkEn } from "./read-more-links"

export default async function HomeEnglishLatestPosts({ all = false}) {
  const post = await fetchPostsByCategory(ENGLISH_CATEGORY, all)

  return (
    <div className='space-y-[30px]'>
      {post.map((p) => (
        <div className='space-y-[20px]' key={p.id}>
          <Link href={`/${p.slug}`} prefetch={true}>
            <h2
              className={`${merriweather.className} text-[24px] sm:text-[28px] leading-tight font-bold hover:underline`}
            >
              {p.title.rendered}
            </h2>
          </Link>
          <div
            className='text-[16px] md:text-[20px]'
            dangerouslySetInnerHTML={{ __html: p.excerpt.rendered }}
          />
          <ReadMoreLinkEn slug={p.slug} />
        </div>
      ))}
    </div>
  )
}
