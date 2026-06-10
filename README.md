# Book Progress

A simple GitHub Pages-friendly reading tracker.

## Features

- Shows a list of books with covers
- Lets you enter the current page for each book
- Updates a progress bar under each cover
- Lets you add custom books from the page
- Loads default/shared books from `data/books.md` (Markdown JSON block)
- Supports a Markdown notes file at `data/progress.md`
- Uses `master` as the direct update branch for Markdown data changes

## Markdown database

This project uses Markdown files as repo-based data:

- `data/books.md`: shared book data (JSON block inside Markdown)
- `data/progress.md`: free-form progress/process notes

When the app starts, it loads books from `data/books.md`.

Note: edits made in the browser are in-memory for the current page session. To persist, update `data/books.md` and/or `data/progress.md` and push to `master`.

## GitHub workflow

Workflow file: `.github/workflows/books-progress-pr.yml`

Behavior:

1. Edit `data/books.md` or `data/progress.md`.
2. Push to `master`.
3. Workflow runs and recognizes data is already updated directly on `master`.

## Run locally

Open `index.html` in a browser, or serve the folder with any static file server.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository.
2. In GitHub, open **Settings** > **Pages**.
3. Set the source to the branch that contains these files and choose the root folder.
4. Save and wait for the site URL.

# librarian-butler
