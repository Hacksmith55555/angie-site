"""Combines index.html, styles.css and js/*.js into ONE file: dist/spooky-october.html

Run:  python3 build.py

Why: the published page has to be a single self-contained file, but this
folder keeps the code split up so it is easy to read and edit.
"""
import pathlib, re

root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "styles.css").read_text(encoding="utf-8")

html = html.replace('<link rel="stylesheet" href="styles.css">', "<style>\n" + css + "</style>")

def inline(match):
    src = root / match.group(1)
    if not src.exists() and match.group(1).startswith('js/'):
        src = root / match.group(1)[3:]
    code = src.read_text(encoding="utf-8")
    return "<script>\n" + code + "\n</script>"

html = re.sub(r'<script src="([^"]+)"></script>', inline, html)

out = root / "dist"
out.mkdir(exist_ok=True)
(out / "spooky-october.html").write_text(html, encoding="utf-8")
print("Built dist/spooky-october.html (%d bytes)" % len(html.encode("utf-8")))
