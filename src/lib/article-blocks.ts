export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; url: string; caption?: string }
  | { type: "video"; url: string; caption?: string };

export function normalizeBlocks(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter((b): b is ContentBlock => {
    if (!b || typeof b !== "object") return false;
    const t = (b as { type?: unknown }).type;
    if (t === "text") return typeof (b as { text?: unknown }).text === "string";
    if (t === "image" || t === "video") return typeof (b as { url?: unknown }).url === "string";
    return false;
  });
}

/** Converts legacy markdown/HTML content into blocks so old matérias keep working. */
export function blocksFromLegacyContent(raw: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const re = /(!\[[^\]]*\]\(([^)\s]+)\))|(<video\s+src="([^"]+)"[^>]*><\/video>)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const before = raw.slice(last, m.index).trim();
    if (before) blocks.push({ type: "text", text: before });
    if (m[2]) blocks.push({ type: "image", url: m[2], caption: "" });
    else if (m[4]) blocks.push({ type: "video", url: m[4], caption: "" });
    last = re.lastIndex;
  }
  const tail = raw.slice(last).trim();
  if (tail) blocks.push({ type: "text", text: tail });
  return blocks;
}
