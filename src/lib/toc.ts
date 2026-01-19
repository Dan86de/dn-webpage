export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export interface TocItem {
  slug: string;
  text: string;
  children: TocItem[];
}

/**
 * Generates a nested table of contents structure from flat headings array.
 * Only includes h2 and h3 levels (depth 2 and 3).
 */
export function generateToc(headings: Heading[]): TocItem[] {
  const toc: TocItem[] = [];
  const h2Items: Map<string, TocItem> = new Map();

  for (const heading of headings) {
    // Only include h2 and h3
    if (heading.depth !== 2 && heading.depth !== 3) {
      continue;
    }

    const item: TocItem = {
      slug: heading.slug,
      text: heading.text,
      children: [],
    };

    if (heading.depth === 2) {
      // Add h2 to root level
      toc.push(item);
      h2Items.set(heading.slug, item);
    } else if (heading.depth === 3) {
      // Add h3 as child of most recent h2
      const lastH2 = toc[toc.length - 1];
      if (lastH2) {
        lastH2.children.push(item);
      }
    }
  }

  return toc;
}
