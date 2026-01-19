import { c as createAstro, a as createComponent, b as addAttribute, d as renderTemplate, u as unescapeHTML } from './astro/server_CWo-EdvC.mjs';
import 'piccolore';
import 'clsx';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://danielnoworyta.com");
const $$SEO = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$SEO;
  const {
    title,
    description,
    canonicalURL,
    image,
    imageAlt,
    publishDate,
    author,
    tags = [],
    type = "article"
  } = Astro2.props;
  const ogImage = image || "/og-default.jpg";
  const ogImageAlt = imageAlt || title;
  const siteUrl = new URL(canonicalURL).origin;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`,
    datePublished: publishDate?.toISOString(),
    author: {
      "@type": "Person",
      name: author || "Anonymous"
    },
    keywords: tags.join(", "),
    url: canonicalURL
  };
  return renderTemplate`<!-- Primary Meta Tags --><title>${title}</title><meta name="title"${addAttribute(title, "content")}><meta name="description"${addAttribute(description, "content")}><link rel="canonical"${addAttribute(canonicalURL, "href")}><!-- Open Graph / Facebook --><meta property="og:type"${addAttribute(type, "content")}><meta property="og:url"${addAttribute(canonicalURL, "content")}><meta property="og:title"${addAttribute(title, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:image"${addAttribute(ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`, "content")}>${imageAlt && renderTemplate`<meta property="og:image:alt"${addAttribute(ogImageAlt, "content")}>`}<!-- Twitter Card --><meta name="twitter:card" content="summary_large_image"><meta name="twitter:url"${addAttribute(canonicalURL, "content")}><meta name="twitter:title"${addAttribute(title, "content")}><meta name="twitter:description"${addAttribute(description, "content")}><meta name="twitter:image"${addAttribute(ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`, "content")}>${imageAlt && renderTemplate`<meta name="twitter:image:alt"${addAttribute(ogImageAlt, "content")}>`}<!-- Structured Data (JSON-LD) -->${type === "article" && publishDate && renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(structuredData)))}`;
}, "/Users/danielnoworyta/Desktop/code/dn-website/src/components/SEO.astro", void 0);

function getReadingTime(content) {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  const minTime = Math.max(1, minutes - 1);
  const maxTime = minutes + 1;
  return `${minTime}-${maxTime} min read`;
}

export { $$SEO as $, getReadingTime as g };
