import { a as createComponent, d as renderTemplate, m as maybeRenderHead, f as renderScript, s as spreadAttributes, u as unescapeHTML, c as createAstro, e as renderComponent, r as renderSlot, j as renderHead, b as addAttribute } from './astro/server_CWo-EdvC.mjs';
import 'piccolore';
/* empty css                          */
import 'clsx';

const $$TailwindIndicator = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${ false}`;
}, "/Users/danielnoworyta/Desktop/code/dn-website/src/components/TailwindIndicator.astro", void 0);

const $$ThemeToggle = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<button id="theme-toggle" type="button" class="relative flex items-center justify-center w-10 h-10 rounded-md transition-colors duration-200" aria-label="Toggle theme"> <svg width="24" height="24" fill="none" viewBox="0 0 24 24" id="sun-icon" class="absolute w-5 h-5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <circle cx="12" cy="12" r="3.25" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></circle> <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 2.75V4.25"></path> <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.25 6.75L16.0659 7.93416"></path> <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.25 12.0001L19.75 12.0001"></path> <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.25 17.2501L16.0659 16.066"></path> <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19.75V21.25"></path> <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.9341 16.0659L6.74996 17.25"></path> <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.25 12.0001L2.75 12.0001"></path> <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.93405 7.93423L6.74991 6.75003"></path> </svg> <svg id="moon-icon" class="absolute w-5 h-5 transition-all duration-300" fill="none" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M18.25 15.0314C17.7575 15.1436 17.2459 15.2027 16.7209 15.2027C12.8082 15.2027 9.63607 11.9185 9.63607 7.86709C9.63607 6.75253 9.87614 5.69603 10.3057 4.75C7.12795 5.47387 4.75 8.40659 4.75 11.9143C4.75 15.9657 7.9221 19.25 11.8348 19.25C14.6711 19.25 17.1182 17.5242 18.25 15.0314Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </svg> </button> ${renderScript($$result, "/Users/danielnoworyta/Desktop/code/dn-website/src/components/ThemeToggle.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/danielnoworyta/Desktop/code/dn-website/src/components/ThemeToggle.astro", void 0);

function createSvgComponent({ meta, attributes, children }) {
  const Component = createComponent((_, props) => {
    const normalizedProps = normalizeProps(attributes, props);
    return renderTemplate`<svg${spreadAttributes(normalizedProps)}>${unescapeHTML(children)}</svg>`;
  });
  Object.defineProperty(Component, "toJSON", {
    value: () => meta,
    enumerable: false
  });
  return Object.assign(Component, meta);
}
const ATTRS_TO_DROP = ["xmlns", "xmlns:xlink", "version"];
const DEFAULT_ATTRS = {};
function dropAttributes(attributes) {
  for (const attr of ATTRS_TO_DROP) {
    delete attributes[attr];
  }
  return attributes;
}
function normalizeProps(attributes, props) {
  return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}

const Logo = createSvgComponent({"meta":{"src":"/_astro/Logo.DH950VT6.svg","width":199,"height":168,"format":"svg"},"attributes":{"width":"199","height":"168","fill":"none","viewBox":"0 0 199 168"},"children":"<g clip-path=\"url(#clip0_175_385)\"><path fill=\"#transparent\" d=\"M0 0h198.375v168H0z\" /><path fill=\"var(--color-orange-500)\" d=\"m121.146 118.828 4.033 6.281a70.1 70.1 0 0 1-32.933 32.969 98.1 98.1 0 0 1-33.337 9.192c-4.732.498-9.49.743-14.253.734H0V39.701h33.848v99.022H45.85a71 71 0 0 0 13.05-1.146c15.086-2.799 26.62-10.759 33.238-23.764 4.084-8.015 8.318-15.928 8.318-27.765 0-.215 0-.43-.008-.635l20.698 33.419z\" /><path fill=\"var(--color-grey-950)\" d=\"M198.375 0v168h-33.607l-35.05-54.668-26.865-44.256c-.129-.236-.245-.476-.383-.742a167 167 0 0 0-11.25-17.118 58.3 58.3 0 0 0-11.728-11.717l-2.255-1.576a49.6 49.6 0 0 0-16.924-6.942c-.46-.103-.927-.193-1.412-.283a67 67 0 0 0-10.178-1.13 91 91 0 0 0-2.868-.051H0V0h44.652c1.374 0 2.727.021 4.071.06 3.479.103 6.871.33 10.178.691C87.08 3.804 108.56 16.131 121.125 36l.039.073 3.839 6.878 40.01 71.768V0z\" /></g><defs><clipPath id=\"clip0_175_385\"><path fill=\"#fff\" d=\"M0 0h198.375v168H0z\" /></clipPath></defs>"});

const $$Astro$1 = createAstro("https://danielnoworyta.com");
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Index;
  const propsStr = JSON.stringify(Astro2.props);
  const paramsStr = JSON.stringify(Astro2.params);
  return renderTemplate`${renderComponent($$result, "vercel-speed-insights", "vercel-speed-insights", { "data-props": propsStr, "data-params": paramsStr, "data-pathname": Astro2.url.pathname })} ${renderScript($$result, "/Users/danielnoworyta/Desktop/code/dn-website/node_modules/@vercel/speed-insights/dist/astro/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/danielnoworyta/Desktop/code/dn-website/node_modules/@vercel/speed-insights/dist/astro/index.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://danielnoworyta.com");
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  return renderTemplate(_a || (_a = __template([`<script>
  const getThemePreference = () => {
    if (typeof localStorage !== "undefined" && localStorage.getItem("theme")) {
      return localStorage.getItem("theme");
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const updateTheme = (theme) => {
    const isDark = theme === "dark";
    document.documentElement.classList[isDark ? "add" : "remove"]("dark");

    // Update favicon based on theme
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href = isDark ? "/favicon-dark.ico" : "/favicon-light.ico";
    }
  };

  // Set initial theme
  updateTheme(getThemePreference());
<\/script> <html lang="en"> <head><meta charset="utf-8"><link rel="preload" href="/fonts/Geomanist/Geomanist-Regular-Webfont/geomanist-regular-webfont.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/Geomanist/Geomanist-Medium-Webfont/geomanist-medium-webfont.woff2" as="font" type="font/woff2" crossorigin><link rel="icon" href="/favicon-light.ico"><meta name="viewport" content="width=device-width"><meta name="generator"`, `><link rel="alternate" type="application/rss+xml" title="Daniel Noworyta's Blog" href="/rss.xml">`, "", '</head> <body class="bg-grey-50"> <div class="px-(--inline-padding)"> <header class="mx-auto max-w-4xl flex items-center justify-between h-16 laptop:h-20"> <a href="/" class="flex items-center gap-1.5 group"> <p class="font-medium tracking-wide">Daniel</p> ', ' <p class="font-medium tracking-wide">Noworyta</p> </a> <nav> <ul class="flex items-baseline justify-between gap-8"> <li><a href="/about">About</a></li> </ul> <ul class="flex items-baseline justify-between gap-8"> <li><a href="/blog">Blog</a></li> </ul> </nav> ', " </header> </div> ", " ", " ", " </body></html>"])), addAttribute(Astro2.generator, "content"), renderSlot($$result, $$slots["head"], renderTemplate`<meta name="description" content="Code to learn..."><title>Daniel Noworyta</title>`), renderHead(), renderComponent($$result, "Logo", Logo, { "width": 17, "height": 15, "class": "-rotate-15 group-hover:rotate-0 duration-200" }), renderComponent($$result, "ThemeToggle", $$ThemeToggle, {}), renderSlot($$result, $$slots["default"]), renderComponent($$result, "TailwindIndicator", $$TailwindIndicator, {}), renderComponent($$result, "SpeedInsights", $$Index, {}));
}, "/Users/danielnoworyta/Desktop/code/dn-website/src/layouts/Layout.astro", void 0);

export { $$Layout as $, createSvgComponent as c };
