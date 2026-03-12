import React, { Suspense } from "react"
import { fetchSinglePost } from "../lib/utils"
import LoadingSinglePost from "./loading-single-post"
import SinglePostComponent from "./single-post"
import { Metadata } from "next"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Props["params"] }): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchSinglePost(slug)

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
  const fallbackDescription = post.excerpt.rendered?.trim() || "Post not found"

  return {
    title: yoastTitle || fallbackTitle,
    description: yoastDescription || fallbackDescription,
  }
}

export default async function SinglePostPage({ params }: Props) {
  const { slug } = await params

  return (
    <>
      <Suspense key={slug} fallback={<LoadingSinglePost />}>
        <SinglePostComponent slug={slug} />
      </Suspense>
    </>
  )
}
