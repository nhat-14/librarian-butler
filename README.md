# Book Progress

A simple GitHub Pages-friendly reading tracker.

## Features

- Shows a list of books with covers
- Lets you enter the current page for each book
- Updates a progress bar under each cover
- Lets you add custom books from the page
- Loads default/shared books from `data/books.md` (Markdown JSON block)
- Supports a Markdown notes file at `data/progress.md`
- Automatically opens a pull request when Markdown data files change on non-`master` branches

## Markdown database

This project uses Markdown files as repo-based data:

- `data/books.md`: shared book data (JSON block inside Markdown)
- `data/progress.md`: free-form progress/process notes

When the app starts, it loads books from `data/books.md`.

Note: edits made in the browser are in-memory for the current page session. To persist and trigger PR automation, update `data/books.md` and/or `data/progress.md` in your branch and push.

## Auto pull request workflow

Workflow file: `.github/workflows/books-progress-pr.yml`

Behavior:

1. Edit `data/books.md` or `data/progress.md` in a non-`master` branch.
2. Push your branch.
3. GitHub Actions automatically creates an open PR into `master` (if one does not already exist for that branch).

## Run locally

Open `index.html` in a browser, or serve the folder with any static file server.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository.
2. In GitHub, open **Settings** > **Pages**.
3. Set the source to the branch that contains these files and choose the root folder.
4. Save and wait for the site URL.

# librarian-butler
