# October, After Dark

A small Halloween-themed site hosted on GitHub Pages.

## How memories work now

Claude's shared database has been removed. Memories are stored in:

- `data/memories.json` for the story data
- `data/images/` for uploaded photos

The public site reads those files from the GitHub repository. When you edit a memory, the site uses the GitHub REST API to commit the changed file(s) to your repository.

### GitHub setup

The site automatically detects a GitHub Pages repository when it is opened from a `*.github.io` address. If you use a custom domain or test with a local file, enter the repository as `owner/repository` the first time you edit a memory.

To edit memories, the site asks for a **fine-grained GitHub personal access token**. Give the token access only to this repository and only the **Contents: Read and write** permission. The token is kept in `sessionStorage`, so it is cleared when the browser session is ended.

Do **not** put a GitHub token in the source code or commit one to GitHub.

## Build

`python3 build.py` creates `dist/spooky-october.html` with the CSS and JavaScript inlined. The memory data and photos intentionally stay outside that file because GitHub needs to update them separately.
