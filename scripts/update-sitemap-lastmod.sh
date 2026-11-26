#!/usr/bin/env bash
# Sets <lastmod> on every <url> in sitemap.xml to the date of the last git
# commit that touched the page's source file. Run from the repo root after
# committing page changes, then commit the updated sitemap.xml.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

site="https://agentriskreview.com/"
tmp="$(mktemp)"

while IFS= read -r line; do
  if [[ "$line" =~ \<loc\>([^<]*)\</loc\> ]]; then
    loc="${BASH_REMATCH[1]}"
    path="${loc#"$site"}"
    [[ -z "$path" || "$path" == */ ]] && path="${path}index.html"
    date="$(git log -1 --format=%cs -- "$path")"
    if [[ -n "$date" ]]; then
      line="  <url><loc>${loc}</loc><lastmod>${date}</lastmod></url>"
    else
      echo "warning: no commit found for $path" >&2
      line="  <url><loc>${loc}</loc></url>"
    fi
  fi
  printf '%s\n' "$line" >> "$tmp"
done < sitemap.xml

mv "$tmp" sitemap.xml
