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

  return {
    title: post.title.rendered + " | BlogKori",
    description: post.excerpt.rendered,
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
