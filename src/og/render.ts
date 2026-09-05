/**
 * Renders a 1200x630 share image for a post: the same card as
 * public/og-default.jpg, with the post title where the homepage line is.
 * Runs at build time only (the /og/[slug].png endpoint is prerendered), so
 * it reads fonts and the photo straight from disk.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const WIDTH = 1200;
const HEIGHT = 630;

const asset = (file: string) => readFileSync(resolve(process.cwd(), "src/og", file));

const fonts = [
  { name: "Geomanist", data: asset("fonts/Geomanist-Medium.ttf"), weight: 500 as const, style: "normal" as const },
  { name: "Atkinson", data: asset("fonts/AtkinsonHyperlegible-Regular.ttf"), weight: 400 as const, style: "normal" as const },
];
const avatar = `data:image/jpeg;base64,${asset("avatar.jpg").toString("base64")}`;

/** Longer titles get a smaller face so they stay on at most three lines. */
function titleSize(title: string): number {
  const n = title.length;
  if (n <= 28) return 84;
  if (n <= 44) return 72;
  if (n <= 64) return 60;
  return 52;
}

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: { style, children },
});

export async function renderPostImage(title: string): Promise<Buffer> {
  const tree = el(
    "div",
    {
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      alignItems: "center",
      padding: "0 96px",
      backgroundColor: "#131313",
      color: "#f0f0f0",
      fontFamily: "Atkinson",
    },
    [
      el("img", { width: 300, height: 300, borderRadius: 20, objectFit: "cover", flexShrink: 0 }, undefined),
      el(
        "div",
        { display: "flex", flexDirection: "column", marginLeft: 64, width: 644 },
        [
          el("div", { width: 44, height: 6, borderRadius: 3, backgroundColor: "#ff5900", marginBottom: 22 }),
          el(
            "div",
            { fontSize: 20, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8a8a", marginBottom: 22 },
            "Daniel Noworyta. Full-stack dev in Poland.",
          ),
          el(
            "div",
            {
              fontFamily: "Geomanist",
              fontWeight: 500,
              fontSize: titleSize(title),
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              textWrap: "balance",
            },
            title,
          ),
        ],
      ),
      el(
        "div",
        { position: "absolute", left: 96, bottom: 48, fontFamily: "Geomanist", fontWeight: 500, fontSize: 24, color: "#8a8a8a", letterSpacing: "0.02em" },
        "danielnoworyta.com",
      ),
    ],
  );
  // The img needs its src outside `style`; patch it in after building the tree.
  (tree.props.children as any)[0].props.src = avatar;

  const svg = await satori(tree as any, { width: WIDTH, height: HEIGHT, fonts });
  return new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } }).render().asPng();
}
