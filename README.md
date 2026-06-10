# Book Progress

A simple GitHub Pages-friendly reading tracker.

## Features

- Shows a list of books with covers
- Lets you enter the current page for each book
- Updates a progress bar under each cover
- Lets you add custom books from the page
- Loads default/shared books from `data/books.md` (Markdown JSON block)
- Supports a Markdown notes file at `data/progress.md`
- Creates a GitHub issue from the website and automatically opens a PR with updated `data/books.md`

## Markdown database

This project uses Markdown files as repo-based data:

- `data/books.md`: shared book data (JSON block inside Markdown)
- `data/progress.md`: free-form progress/process notes

When the app starts, it loads books from `data/books.md`.

Note: edits made in the browser are in-memory for the current page session until you click the Create PR update button and submit the generated GitHub issue.

## GitHub workflow

Workflow file: `.github/workflows/books-progress-pr.yml`

Behavior:

1. Update books in the website UI.
2. Click Create PR update and submit the prefilled issue.
3. GitHub Actions parses the issue, updates `data/books.md` on an automation branch, and opens/updates a PR into `master`.

## Run locally

Open `index.html` in a browser, or serve the folder with any static file server.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository.
2. In GitHub, open **Settings** > **Pages**.
3. Set the source to the branch that contains these files and choose the root folder.
4. Save and wait for the site URL.

# librarian-butler
