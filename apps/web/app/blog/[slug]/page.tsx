import { notFound } from "next/navigation";
import { allPosts } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer/hooks";
import React from "react";

export async function generateStaticParams() {
  return allPosts.map((post: any) => ({
    slug: post.slug,
  }));
}

export default function Page({ params }: { params: { slug: string } }) {
  const post = allPosts.find((post) => post.slug === params.slug);
  if (!post) {
    notFound();
  }

  return (
    <section>
      <Mdx code={post.body.code} />
    </section>
  );
}

interface MdxProps {
  code: string;
}

function H1({ children }: { children?: React.ReactNode }) {
  return <h1 className="text-4xl font-semibold text-inherit">{children}</h1>;
}

function H2({ children }: { children?: React.ReactNode }) {
  return <h2 className="text-3xl font-semibold text-inherit">{children}</h2>;
}

function H3({ children }: { children?: React.ReactNode }) {
  return <h1 className="text-2xl font-semibold text-inherit">{children}</h1>;
}

function H4({ children }: { children?: React.ReactNode }) {
  return <h2 className="text-xl font-semibold text-inherit">{children}</h2>;
}

function P({ children }: { children?: React.ReactNode }) {
  return <p className="text-xl font-regular text-inherit">{children}</p>;
}

const components = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
};

function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code);

  return (
    <article className="prose md:prose-lg lg:prose-xl prose-neutral dark:prose-invert mx-auto">
      <Component components={{ ...components }} />
    </article>
  );
}
