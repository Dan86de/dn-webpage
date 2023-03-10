import { defineDocumentType, makeSource } from "contentlayer/source-files";

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      description: "The title of the post",
      required: true,
    },
    publishedAt: {
      type: "string",
      description: "The date of the post",
      required: true,
    },
    isReady: {
      type: "boolean",
      description: "Is the post ready to be fully consumed?",
      required: true,
    },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath,
    },
    url: {
      type: "string",
      resolve: (post) =>
        // use env variables here to make this more dynamic
        // `https://danielnoworyta.com/blog/${post._raw.flattenedPath}`,
        `http://localhost:3000/blog/${post._raw.flattenedPath}`,
    },
  },
}));

export default makeSource({
  contentDirPath: "posts",
  documentTypes: [Post],
}) as any;
