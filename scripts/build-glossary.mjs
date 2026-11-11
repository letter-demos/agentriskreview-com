// Renders glossary/*.html from the Glossary collection in content/glossary.json.
// Run with: node scripts/build-glossary.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { entries } = JSON.parse(readFileSync(join(root, "content/glossary.json"), "utf8"));

// Reuse the shared page chrome (tracking snippet, header) from the blog index.
const blogLines = readFileSync(join(root, "blog/index.html"), "utf8").split("\n");
const script = blogLines.find((l) => l.includes("lettervisit.com"));
const header = blogLines.find((l) => l.startsWith("<header>"));
const footer =
  '<footer><div class="wrap">© 2026 Agent Risk Review. Independent Risk Evaluation for Insurance Professionals · <a href="../glossary/index.html">Glossary</a></div></footer>';

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const page = (title, desc, canon, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://agentriskreview.com/${canon}">
<link rel="stylesheet" href="../style.css">
${script}
</head>
<body>
${header}
<main><div class="wrap">
${body}
</div></main>
${footer}
</body>
</html>
`;

const bySlug = Object.fromEntries(entries.map((e) => [e.slug, e]));
mkdirSync(join(root, "glossary"), { recursive: true });

for (const e of entries) {
  const related = e.related
    .map((slug) => `<li><a href="${slug}.html">${esc(bySlug[slug].title)}</a></li>`)
    .join("");
  const body = [
    '<p class="meta"><a href="index.html">Glossary</a></p>',
    `<h1>${esc(e.title)}</h1>`,
    `<p class="lede">${esc(e.definition)}</p>`,
    ...e.body.map((p) => `<p>${esc(p)}</p>`),
    "<h2>Related terms</h2>",
    `<ul>${related}</ul>`,
    `<p class="meta">Related service: <a href="${e.service.href}">${esc(e.service.name)}</a> · <a href="index.html">All terms</a></p>`,
  ].join("\n");
  writeFileSync(
    join(root, "glossary", `${e.slug}.html`),
    page(`${esc(e.title)} | Agent Risk Review glossary`, esc(e.definition), `glossary/${e.slug}.html`, body)
  );
}

const lede = "Plain definitions of the compliance, licensing and carrier terms insurance agents and agencies run into most.";
const list = [...entries]
  .sort((a, b) => a.title.localeCompare(b.title))
  .map((e) => `<h2><a href="${e.slug}.html">${esc(e.title)}</a></h2><p>${esc(e.definition)}</p>`)
  .join("\n");
writeFileSync(
  join(root, "glossary/index.html"),
  page("Agent Risk Review glossary", lede, "glossary/index.html", `<h1>Glossary</h1>\n<p class="lede">${lede}</p>\n${list}`)
);
