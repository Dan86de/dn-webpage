import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"blog">;
export type Category = Post["data"]["category"];

/**
 * A post plus the number it gets in its category. Issues are numbered in the
 * order they were published ("Issue #3"); essays are not numbered.
 */
export interface ListedPost {
  post: Post;
  issueNumber?: number;
}

const byDateDesc = (a: Post, b: Post) =>
  b.data.publishDate.getTime() - a.data.publishDate.getTime();

/**
 * Posts visible on the current build, newest first. Drafts are hidden in
 * production and shown on the dev server so a piece can be read in place
 * before `pnpm post` publishes it.
 */
export async function getVisiblePosts(): Promise<Post[]> {
  const all = await getCollection("blog");
  return all
    .filter((post) => import.meta.env.DEV || !post.data.isDraft)
    .sort(byDateDesc);
}

/** Published posts only, newest first. Used where drafts must never leak (RSS). */
export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getCollection("blog");
  return all.filter((post) => !post.data.isDraft).sort(byDateDesc);
}

/**
 * Attach issue numbers. Issues count up from the oldest one, so a number is
 * stable once assigned as long as nothing is backdated before it.
 */
export function withIssueNumbers(posts: Post[]): ListedPost[] {
  const issues = posts
    .filter((post) => post.data.category === "issue")
    .sort((a, b) => -byDateDesc(a, b));
  const numbers = new Map(issues.map((post, i) => [post.id, i + 1]));
  return posts.map((post) => ({ post, issueNumber: numbers.get(post.id) }));
}

/** "Issue #3" for issues, "Essay" for everything else. */
export function categoryLabel({ post, issueNumber }: ListedPost): string {
  return post.data.category === "issue" && issueNumber
    ? `Issue #${issueNumber}`
    : "Essay";
}

/** The posts published directly before and after the given one. */
export function neighbours(posts: Post[], current: Post) {
  const sorted = [...posts].sort(byDateDesc);
  const index = sorted.findIndex((post) => post.id === current.id);
  return {
    // Newer post, if any
    next: index > 0 ? sorted[index - 1] : undefined,
    // Older post, if any
    previous: index >= 0 ? sorted[index + 1] : undefined,
  };
}
