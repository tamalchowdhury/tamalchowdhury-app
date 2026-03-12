import { buildLlmsHeader, fetchAllPostsForLlms, mapPostsToLlmsLines } from "../lib/llms"

export const revalidate = 3600

export async function GET() {
  const posts = await fetchAllPostsForLlms()
  const postLines = mapPostsToLlmsLines(posts)

  const content = [
    buildLlmsHeader(),
    "## Full Article Index",
    ...postLines,
    "",
  ].join("\n")

  return new Response(content, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  })
}
