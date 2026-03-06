import React from "react"
import { fetchSinglePost, merriweather, prettyDate } from "../lib/utils"
import { AUTHOR_NAME, BANGLA_CATEGORY } from "../lib/consts"
import { banglaHfont } from "@/fonts/fonts"
import ShareButtons from "./components/share-buttons"
import Image from "next/image"
import { EnglishTitle } from "../components/english-title"

type Props = {
  slug: string
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

export default async function SinglePostComponent({ slug }: Props) {
  const post = await fetchSinglePost(slug)

  if (!post) {
    return <div>Post not found</div>
  }

  // needs to implement a better solution here
  const isBangla = post.categories.includes(BANGLA_CATEGORY)

  return (
    <>
      <div className='space-y-4'>
        {isBangla ? (
          <BanglaTitle>{post.title.rendered}</BanglaTitle>
        ) : (
          <EnglishTitle>{post.title.rendered}</EnglishTitle>
        )}

        <div className='flex gap-[10px] items-center text-[14px] text-[#333]/70'>
          <div>
            <Image
              src='/img/author.jpg'
              alt='Tamal Chowdhury'
              width={48}
              height={48}
              className='rounded-full object-cover'
            />
          </div>
          <div>
            <div className='italic'>লেখক: {AUTHOR_NAME}</div>
            <div className='uppercase text-[14px]'>
              {conditionalDateByline(post.date, post.modified)}
            </div>
          </div>
        </div>

        <div
          className='post__body text-[16px] md:text-[20px]'
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />
      </div>
      <ShareButtons
        slug={slug}
        title={post.title.rendered}
        content={post.content.rendered}
      />
    </>
  )
}

export function BanglaTitle({ children, className = "" }) {
  return (
    <h1
      className={`text-[28px] md:text-[38px] font-bold leading-tight ${banglaHfont.className} ${className}`}
    >
      {children}
    </h1>
  )
}
