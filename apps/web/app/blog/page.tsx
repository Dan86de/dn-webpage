import Link from "next/link";
// @ts-ignore
import { allPosts, Post } from "contentlayer/generated";
import { compareDesc, format, parseISO } from "date-fns";

export const metadata = {
  title: "Daniel Noworyta Blog",
  description: "Blog page with all articles",
};
const getPosts = () => {
  return allPosts.sort((a: any, b: any) => {
    return compareDesc(new Date(a.publishedAt), new Date(b.publishedAt));
  });
};

function PostCard(post: any) {
  return (
    <div className="mb-6">
      <time dateTime={post.publishedAt} className="text-neutral-500">
        {format(parseISO(post.publishedAt), "LLLL d, yyyy")}
      </time>
      <h2 className="text-lg">
        <Link href={post.url}>{post.title}</Link>
      </h2>
    </div>
  );
}

export default function BlogPage() {
  const posts = getPosts().filter((post: Post) => post.isReady);

  return (
    <div className="py-16">
      <h1 className="mb-8 text-3xl font-bold">Contentlayer Blog Example</h1>

      {posts.map((post: any, idx: any) => (
        <PostCard key={idx} {...post} />
      ))}
    </div>
  );
}
