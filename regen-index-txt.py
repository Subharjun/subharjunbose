#!/usr/bin/env python3
"""Regenerate index.txt — a plain-text mirror of every string in index.html.

Run after editing index.html so the two can't drift:  python3 regen-index-txt.py
"""
import html
import re

# block-level tags start a new line; inline ones (strong, code, span, a, time)
# deliberately do not, so a sentence split by <strong> stays on one line
BLOCK = {"h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "ul", "ol", "section",
         "article", "header", "footer", "nav", "aside", "figure", "figcaption",
         "address", "div", "form", "textarea", "main", "br"}


def main():
    s = open("index.html").read()
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = re.sub(r"<!DOCTYPE[^>]*>", "", s, flags=re.I)
    s = re.sub(r"<script.*?</script>", "", s, flags=re.S)
    s = re.sub(r"<head.*?</head>", "", s, flags=re.S)

    out = []

    def blank():
        if out and out[-1] != "":
            out.append("")

    for m in re.finditer(r"<(/?)([a-zA-Z0-9]+)([^>]*)>|([^<]+)", s):
        closing, tag, attrs, text = m.group(1), m.group(2), m.group(3) or "", m.group(4)
        if tag and not closing:
            page = re.search(r'data-page="([^"]+)"', attrs)
            if page:
                out += ["", "# " + page.group(1), ""]
                continue
            if tag.lower() in BLOCK:
                blank()
            alt = re.search(r'alt="([^"]+)"', attrs)
            if alt:
                out += ["alt = " + alt.group(1), ""]
            placeholder = re.search(r'placeholder="([^"]+)"', attrs)
            if placeholder:
                out.append(placeholder.group(1))
        elif text:
            t = html.unescape(re.sub(r"\s+", " ", text)).strip()
            if not t:
                continue
            if out and out[-1] != "" and not out[-1].startswith("alt ="):
                out[-1] += " " + t
            else:
                out.append(t)

    out = [re.sub(r"\s+([,.;:])", r"\1", line) for line in out]

    lines, prev_blank = [], False
    for line in out:
        is_blank = line == ""
        if is_blank and prev_blank:
            continue
        prev_blank = is_blank
        lines.append(line)

    with open("index.txt", "w") as f:
        f.write("Subharjun Bose - AI & Automation Engineer\n"
                "Plain-text mirror of every string on the site. "
                "Regenerate with regen-index-txt.py after editing index.html.\n\n"
                + "\n".join(lines).strip() + "\n")
    print("index.txt: %d lines" % (len(lines) + 3))


if __name__ == "__main__":
    main()
