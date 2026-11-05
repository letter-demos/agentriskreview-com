// Builds llms.txt from sitemap.xml and each page's <title> and meta description.
// Run with `npm run build` (or `node scripts/generate-llms-txt.mjs`) before publishing.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

function readPage(url) {
  let path = new URL(url).pathname.replace(/^\/+/, "");
  if (path === "" || path.endsWith("/")) path += "index.html";
  const file = join(root, path);
  if (!existsSync(file)) return null;
  const html = readFileSync(file, "utf8");
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const desc =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1] ??
    html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i)?.[1] ??
    "";
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g, "") ?? "";
  return { url, path, title: decode(title), h1: decode(h1), description: decode(desc) };
}

function kind(path) {
  if (path === "index.html") return "home";
  if (/^product/.test(path)) return "Product";
  if (/^pricing/.test(path)) return "Pricing";
  if (/^docs\//.test(path)) return "Docs";
  if (/^(blog|guides)\//.test(path)) return "Guides";
  return "Company";
}

const pages = urls.map(readPage).filter(Boolean);
const home = pages.find((p) => kind(p.path) === "home");
const siteName = home?.h1 && home.title.startsWith(home.h1) ? home.h1 : home?.title.split(":")[0].trim();

const sections = { Product: [], Pricing: [], Docs: [], Guides: [], Company: [] };
for (const p of pages) {
  const k = kind(p.path);
  if (k === "home") continue;
  const name = p.h1 || p.title;
  sections[k].push(`- [${name}](${p.url})${p.description ? `: ${p.description}` : ""}`);
}

let out = `# ${siteName}\n`;
if (home?.description) out += `\n> ${home.description}\n`;
for (const [heading, lines] of Object.entries(sections)) {
  if (lines.length) out += `\n## ${heading}\n\n${lines.join("\n")}\n`;
}

writeFileSync(join(root, "llms.txt"), out);
console.log(`llms.txt written with ${pages.length} pages`);
