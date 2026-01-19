import { a as createComponent, c as createAstro, m as maybeRenderHead, b as addAttribute, r as renderSlot, d as renderTemplate, n as createVNode, F as Fragment, ax as __astro_tag_component__ } from './astro/server_CWo-EdvC.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import 'piccolore';
import 'clsx';

function TestButton() {
  const [count, setCount] = useState(0);
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: () => setCount(count + 1),
      style: {
        padding: "0.5rem 1rem",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "0.25rem",
        cursor: "pointer"
      },
      children: [
        "Clicked ",
        count,
        " times"
      ]
    }
  );
}

const $$Astro$2 = createAstro("https://danielnoworyta.com");
const $$Callout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Callout;
  const { type = "info", title } = Astro2.props;
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
    tip: "bg-green-50 border-green-200 text-green-900",
    danger: "bg-red-50 border-red-200 text-red-900"
  };
  const icons = {
    info: "\u2139\uFE0F",
    warning: "\u26A0\uFE0F",
    tip: "\u{1F4A1}",
    danger: "\u{1F6A8}"
  };
  return renderTemplate`${maybeRenderHead()}<div${addAttribute(`callout border-l-4 p-4 my-4 ${styles[type]}`, "class")}> ${title && renderTemplate`<div class="callout-title font-semibold mb-2 flex items-center gap-2"> <span>${icons[type]}</span> <span>${title}</span> </div>`} <div class="callout-content"> ${renderSlot($$result, $$slots["default"])} </div> </div>`;
}, "/Users/danielnoworyta/Desktop/code/dn-website/src/components/mdx/Callout.astro", void 0);

function CodeDemo({ code, title }) {
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const runCode = () => {
    setError("");
    setOutput("");
    try {
      const logs = [];
      const customConsole = {
        log: (...args) => {
          logs.push(args.map((arg) => String(arg)).join(" "));
        }
      };
      const func = new Function("console", code);
      func(customConsole);
      setOutput(logs.join("\n"));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        padding: "1rem",
        marginTop: "1rem",
        marginBottom: "1rem"
      },
      children: [
        title && /* @__PURE__ */ jsx(
          "h4",
          {
            style: {
              marginTop: 0,
              marginBottom: "0.75rem",
              fontSize: "1.125rem",
              fontWeight: 600
            },
            children: title
          }
        ),
        /* @__PURE__ */ jsx(
          "pre",
          {
            style: {
              backgroundColor: "#f3f4f6",
              padding: "0.75rem",
              borderRadius: "0.25rem",
              overflowX: "auto",
              marginBottom: "0.75rem"
            },
            children: /* @__PURE__ */ jsx("code", { children: code })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: runCode,
            style: {
              padding: "0.5rem 1rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              marginBottom: "0.75rem"
            },
            children: "Run Code"
          }
        ),
        output && /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "0.25rem",
              padding: "0.75rem",
              marginTop: "0.75rem"
            },
            children: [
              /* @__PURE__ */ jsx("strong", { children: "Output:" }),
              /* @__PURE__ */ jsx(
                "pre",
                {
                  style: {
                    marginTop: "0.5rem",
                    marginBottom: 0,
                    whiteSpace: "pre-wrap"
                  },
                  children: output
                }
              )
            ]
          }
        ),
        error && /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "0.25rem",
              padding: "0.75rem",
              marginTop: "0.75rem"
            },
            children: [
              /* @__PURE__ */ jsx("strong", { children: "Error:" }),
              /* @__PURE__ */ jsx(
                "pre",
                {
                  style: {
                    marginTop: "0.5rem",
                    marginBottom: 0,
                    whiteSpace: "pre-wrap",
                    color: "#dc2626"
                  },
                  children: error
                }
              )
            ]
          }
        )
      ]
    }
  );
}

const $$Astro$1 = createAstro("https://danielnoworyta.com");
const $$Figure = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Figure;
  const { src, alt, caption } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<figure class="my-6"> <img${addAttribute(src, "src")}${addAttribute(alt, "alt")} class="w-full rounded-lg"> ${caption && renderTemplate`<figcaption class="text-center text-sm text-grey-800 mt-2 italic">${caption}</figcaption>`} </figure>`;
}, "/Users/danielnoworyta/Desktop/code/dn-website/src/components/mdx/Figure.astro", void 0);

const $$Astro = createAstro("https://danielnoworyta.com");
const $$YouTube = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$YouTube;
  const { id, title = "YouTube video" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="youtube-embed my-6"> <div class="relative w-full" style="padding-bottom: 56.25%;"> <iframe${addAttribute(`https://www.youtube.com/embed/${id}`, "src")}${addAttribute(title, "title")} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="absolute top-0 left-0 w-full h-full rounded-lg"></iframe> </div> </div>`;
}, "/Users/danielnoworyta/Desktop/code/dn-website/src/components/mdx/YouTube.astro", void 0);

const frontmatter = {
  "isDraft": false,
  "title": "Testing MDX Integration",
  "description": "A comprehensive test post demonstrating MDX integration with React components and syntax highlighting.",
  "image": "/images/mdx-test.jpg",
  "imageAlt": "MDX integration test visualization",
  "category": "Development",
  "author": "Daniel Noworyta",
  "tags": ["mdx", "test", "react"],
  "publishDate": "2026-01-19T00:00:00.000Z",
  "authorContact": "daniel.noworyta@gmail.com",
  "canonicalURL": "http://localhost:4321/blog/test-mdx",
  "slug": "test-mdx"
};
function getHeadings() {
  return [{
    "depth": 1,
    "slug": "mdx-integration-test",
    "text": "MDX Integration Test"
  }, {
    "depth": 2,
    "slug": "interactive-component",
    "text": "Interactive Component"
  }, {
    "depth": 2,
    "slug": "mdx-component-library",
    "text": "MDX Component Library"
  }, {
    "depth": 3,
    "slug": "callout-component",
    "text": "Callout Component"
  }, {
    "depth": 3,
    "slug": "code-demo-component",
    "text": "Code Demo Component"
  }, {
    "depth": 3,
    "slug": "figure-component",
    "text": "Figure Component"
  }, {
    "depth": 3,
    "slug": "youtube-component",
    "text": "YouTube Component"
  }, {
    "depth": 2,
    "slug": "markdown-features",
    "text": "Markdown Features"
  }];
}
function _createMdxContent(props) {
  const _components = {
    code: "code",
    em: "em",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    li: "li",
    p: "p",
    pre: "pre",
    span: "span",
    strong: "strong",
    ul: "ul",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "mdx-integration-test",
      children: "MDX Integration Test"
    }), "\n", createVNode(_components.p, {
      children: "This is a test post to verify MDX integration is working correctly."
    }), "\n", createVNode(_components.h2, {
      id: "interactive-component",
      children: "Interactive Component"
    }), "\n", createVNode(_components.p, {
      children: "Below is a React component imported and rendered in MDX:"
    }), "\n", createVNode(TestButton, {
      "client:load": true,
      "client:component-path": "@/components/TestButton",
      "client:component-export": "TestButton",
      "client:component-hydration": true
    }), "\n", createVNode(_components.h2, {
      id: "mdx-component-library",
      children: "MDX Component Library"
    }), "\n", createVNode(_components.h3, {
      id: "callout-component",
      children: "Callout Component"
    }), "\n", createVNode($$Callout, {
      type: "info",
      title: "Information",
      children: createVNode(_components.p, {
        children: "This is an informational callout. Use it to highlight important details."
      })
    }), "\n", createVNode($$Callout, {
      type: "warning",
      title: "Warning",
      children: createVNode(_components.p, {
        children: "This is a warning callout. Use it to alert readers about potential issues."
      })
    }), "\n", createVNode($$Callout, {
      type: "tip",
      title: "Pro Tip",
      children: createVNode(_components.p, {
        children: "This is a tip callout. Share helpful advice and best practices."
      })
    }), "\n", createVNode($$Callout, {
      type: "danger",
      title: "Danger",
      children: createVNode(_components.p, {
        children: "This is a danger callout. Use it for critical warnings."
      })
    }), "\n", createVNode(_components.h3, {
      id: "code-demo-component",
      children: "Code Demo Component"
    }), "\n", createVNode(CodeDemo, {
      "client:load": true,
      title: "Interactive JavaScript Demo",
      code: `console.log("Hello from CodeDemo!");
console.log("This code runs in the browser!");
const result = 2 + 2;
console.log("2 + 2 =", result);`,
      "client:component-path": "@/components/mdx",
      "client:component-export": "CodeDemo",
      "client:component-hydration": true
    }), "\n", createVNode(_components.h3, {
      id: "figure-component",
      children: "Figure Component"
    }), "\n", createVNode($$Figure, {
      src: "/favicon-light.ico",
      alt: "Site favicon",
      caption: "An example figure with a caption"
    }), "\n", createVNode(_components.h3, {
      id: "youtube-component",
      children: "YouTube Component"
    }), "\n", createVNode($$YouTube, {
      id: "Rlml72ovDPE",
      title: "Example YouTube Video"
    }), "\n", createVNode(_components.h2, {
      id: "markdown-features",
      children: "Markdown Features"
    }), "\n", createVNode(_components.p, {
      children: "All standard markdown features should still work:"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: "Lists work"
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Bold text"
        }), " works"]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.em, {
          children: "Italic text"
        }), " works"]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.code, {
          children: "Inline code"
        }), " works"]
      }), "\n"]
    }), "\n", createVNode(_components.pre, {
      class: "astro-code github-dark",
      style: {
        backgroundColor: "#24292e",
        color: "#e1e4e8",
        overflowX: "auto",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word"
      },
      tabindex: "0",
      "data-language": "javascript",
      children: createVNode(_components.code, {
        children: [createVNode(_components.span, {
          class: "line",
          children: createVNode(_components.span, {
            style: {
              color: "#6A737D"
            },
            children: "// Code blocks work"
          })
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#F97583"
            },
            children: "function"
          }), createVNode(_components.span, {
            style: {
              color: "#B392F0"
            },
            children: " hello"
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: "() {"
          })]
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: "  console."
          }), createVNode(_components.span, {
            style: {
              color: "#B392F0"
            },
            children: "log"
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: "("
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: "\"Hello from MDX!\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ");"
          })]
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: "}"
          })
        })]
      })
    }), "\n", createVNode(_components.p, {
      children: "This confirms MDX is properly configured!"
    })]
  });
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? createVNode(MDXLayout, {
    ...props,
    children: createVNode(_createMdxContent, {
      ...props
    })
  }) : _createMdxContent(props);
}

const url = "src/content/blog/test-mdx/test-mdx.mdx";
const file = "/Users/danielnoworyta/Desktop/code/dn-website/src/content/blog/test-mdx/test-mdx.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/danielnoworyta/Desktop/code/dn-website/src/content/blog/test-mdx/test-mdx.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
