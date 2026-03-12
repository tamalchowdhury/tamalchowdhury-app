import React, { Suspense } from "react"
import { fetchPostSlugs, fetchSinglePost } from "../lib/utils"
import LoadingSinglePost from "./loading-single-post"
import SinglePostComponent from "./single-post"
import { Metadata } from "next"
import { BASE_URL, HOME_POST_LIMIT } from "../lib/consts"
import { cache } from "react"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ slug: string }>
}

export const revalidate = 120
const getSinglePost = cache(fetchSinglePost)

function stripHtml(value = "") {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export async function generateStaticParams() {
  // Prebuild recent posts so first navigation is often static + warm.
  const posts = await fetchPostSlugs(HOME_POST_LIMIT * 2)
  return posts.map((post: { slug: string }) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Props["params"] }): Promise<Metadata> {
  const { slug } = await params
  const post = await getSinglePost(slug)

  if (!post) {
    return {
      title: "Post not found",
      description: "Post not found",
    }
  }

  const yoastTitle = post.yoast_head_json?.title?.trim()
  const pageTitle = post.title?.rendered?.trim() || "Untitled"
  const fallbackTitle = `${pageTitle} # তমাল চৌধুরীর টেক ব্লগ`
  const yoastDescription = post.yoast_head_json?.description?.trim()
  const fallbackDescription = stripHtml(post.excerpt?.rendered || "") || "Post not found"
  const metaTitle = yoastTitle || fallbackTitle
  const metaDescription = yoastDescription || fallbackDescription
  const canonicalUrl = `${BASE_URL}/${slug}`
  const yoastImage = post.yoast_head_json?.og_image?.[0]?.url
  const ogImage = yoastImage || `${BASE_URL}/img/author.jpg`

  return {
    metadataBase: new URL(BASE_URL),
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: metaTitle,
      description: metaDescription,
      siteName: "তমাল এ চৌধুরী",
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [ogImage],
    },
  }
}

export default async function SinglePostPage({ params }: Props) {
  const { slug } = await params
  const post = await getSinglePost(slug)

  if (!post) {
    notFound()
  }

  return (
    <>
      <Suspense key={slug} fallback={<LoadingSinglePost />}>
        <SinglePostComponent slug={slug} post={post} />
      </Suspense>
    </>
  )
}
