import { Suspense } from "react"
import HomeEnglishLatestPosts from "./components/home-english-latest-posts"
import LoadingPosts from "./components/loading-posts"
import { merriweather } from "./lib/utils"
import HomeBanglaLatestPosts from "./components/home-bangla-latest-posts"
import { banglaHfont } from "@/fonts/fonts"
import Link from "next/link"

export default async function Home() {
  return (
    <div className='space-y-[40px]'>
      <section>
        <h3
          className={`${banglaHfont.className} uppercase sm:-ml-[10px] mb-2 tracking-wider text-[16px] sm:text-[18px]`}
        >
          সব পোস্টগুলো
        </h3>
        <Suspense fallback={<LoadingPosts />}>
          <HomeBanglaLatestPosts />

          <ReadAllPosts href='/all'>আরো পোস্ট দেখুন</ReadAllPosts>
        </Suspense>
      </section>
    </div>
  )
}

function ReadAllPosts({ children, href }) {
  return (
    <Link
      href={href}
      className='block text-center bg-accent/10 p-3 sm:p-4 rounded-md my-8 hover:bg-accent/40 transition hover:font-bold hover:shadow-md'
    >
      {children}
    </Link>
  )
}
