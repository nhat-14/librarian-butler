const bookList = document.getElementById("bookList");
const template = document.getElementById("bookCardTemplate");
const addBookForm = document.getElementById("addBookForm");
const exportBooksButton = document.getElementById("exportBooksButton");
const importBooksButton = document.getElementById("importBooksButton");
const importBooksInput = document.getElementById("importBooksInput");
const createPrUpdateButton = document.getElementById("createPrUpdateButton");

let books = [];

function normalizeBook(book) {
  if (
    !book ||
    typeof book.title !== "string" ||
    typeof book.author !== "string" ||
    !Number.isFinite(Number(book.totalPages))
  ) {
    return null;
  }

  const totalPages = Number(book.totalPages);

  return {
    id: String(book.id ?? `book-${crypto.randomUUID()}`),
    title: String(book.title),
    author: String(book.author),
    totalPages,
    currentPages: Math.min(Math.max(Number(book.currentPages ?? 0), 0), totalPages),
  };
}

async function loadBooksFromMarkdown() {
  try {
    const response = await fetch("./data/books.md", { cache: "no-store" });
    if (!response.ok) {
      return [];
    }

    const markdown = await response.text();
    const jsonBlockMatch = markdown.match(/```json\s*([\s\S]*?)```/i);
    if (!jsonBlockMatch) {
      return [];
    }

    const parsedBooks = JSON.parse(jsonBlockMatch[1]);
    if (!Array.isArray(parsedBooks)) {
      return [];
    }

    return parsedBooks.map(normalizeBook).filter(Boolean);
  } catch {
    return [];
  }
}

async function initializeLibrary() {
  const markdownBooks = await loadBooksFromMarkdown();
  books = markdownBooks;
  renderLibrary();
}

function saveBooks(nextBooks) {
  books = nextBooks;
}

function exportBooks() {
  const blob = new Blob([JSON.stringify(books, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "books.json";
  link.click();

  URL.revokeObjectURL(url);
}

function inferRepositoryFromLocation() {
  const host = window.location.hostname;
  const pathSegments = window.location.pathname.split("/").filter(Boolean);

  if (host.endsWith("github.io") && pathSegments.length > 0) {
    return {
      owner: host.split(".")[0],
      repo: pathSegments[0],
    };
  }

  return {
    owner: "nhat-14",
    repo: "librarian-butler",
  };
}

function createWebsiteUpdateIssue() {
  const { owner, repo } = inferRepositoryFromLocation();
  if (!owner || !repo) {
    window.alert("Could not determine repository path.");
    return;
  }

  const note = window.prompt("Optional progress note for data/progress.md", "") ?? "";
  const compactBooks = books.map((book) => ({
    id: String(book.id),
    title: String(book.title),
    author: String(book.author),
    totalPages: Number(book.totalPages),
    currentPages: Number(book.currentPages),
  }));

  const issueTitle = `[website-update] Books data update (${new Date().toISOString().slice(0, 10)})`;
  const issueBody = [
    "This issue was generated from the website UI.",
    "",
    "Please keep the markers unchanged.",
    "",
    "<!-- BOOKS_JSON_START -->",
    "```json",
    JSON.stringify(compactBooks, null, 2),
    "```",
    "<!-- BOOKS_JSON_END -->",
    "",
    "<!-- PROGRESS_NOTE_START -->",
    note.trim() || "No progress note provided.",
    "<!-- PROGRESS_NOTE_END -->",
  ].join("\n");

  const issueUrl = new URL(`https://github.com/${owner}/${repo}/issues/new`);
  issueUrl.searchParams.set("title", issueTitle);
  issueUrl.searchParams.set("body", issueBody);

  window.open(issueUrl.toString(), "_blank", "noopener");
}

async function importBooksFromFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("Import file must contain an array of books.");
  }

  const importedBooks = parsed.map(normalizeBook).filter(Boolean);
  books = importedBooks;
  saveBooks(books);
  renderLibrary();
}

function renderBook(book) {
  const fragment = template.content.cloneNode(true);
  const row = fragment.querySelector(".book-row");
  const title = fragment.querySelector(".title");
  const author = fragment.querySelector(".author");
  const currentPagesInput = fragment.querySelector(".current-pages-input");
  const percent = fragment.querySelector(".percent");
  const progressBar = fragment.querySelector(".progress-bar");
  const removeButton = fragment.querySelector(".remove-book");

  const progress = book.totalPages === 0 ? 0 : Math.round((book.currentPages / book.totalPages) * 100);

  row.dataset.bookId = book.id;
  title.textContent = book.title;
  author.textContent = book.author;
  currentPagesInput.value = String(book.currentPages);
  currentPagesInput.max = String(book.totalPages);
  currentPagesInput.addEventListener("change", () => updateCurrentPages(book.id, currentPagesInput.value));
  percent.textContent = `${progress}%`;
  progressBar.style.width = `${progress}%`;
  removeButton.addEventListener("click", () => removeBook(book.id));

  return fragment;
}

function renderLibrary() {
  bookList.replaceChildren();
  const fragment = document.createDocumentFragment();

  books.forEach((book) => {
    fragment.appendChild(renderBook(book));
  });

  bookList.appendChild(fragment);
}

function removeBook(bookId) {
  books = books.filter((book) => book.id !== bookId);
  saveBooks(books);
  renderLibrary();
}

function updateCurrentPages(bookId, nextCurrentPagesValue) {
  const book = books.find((entry) => entry.id === bookId);
  if (!book) {
    return;
  }

  const nextCurrentPages = Number(nextCurrentPagesValue);
  if (!Number.isFinite(nextCurrentPages) || nextCurrentPages < 0) {
    renderLibrary();
    return;
  }

  book.currentPages = Math.min(Math.max(nextCurrentPages, 0), book.totalPages);
  saveBooks(books);
  renderLibrary();
}

addBookForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(addBookForm);
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const totalPages = Number(formData.get("totalPages") ?? 0);
  const currentPages = Number(formData.get("currentPages") ?? 0);

  if (!title || !author || !Number.isFinite(totalPages) || totalPages < 1 || !Number.isFinite(currentPages)) {
    return;
  }

  const safeCurrentPages = Math.min(Math.max(currentPages, 0), totalPages);

  books = [
    {
      id: `book-${crypto.randomUUID()}`,
      title,
      author,
      totalPages,
      currentPages: safeCurrentPages,
    },
    ...books,
  ];

  saveBooks(books);
  renderLibrary();
  addBookForm.reset();
});

exportBooksButton.addEventListener("click", exportBooks);

importBooksButton.addEventListener("click", () => {
  importBooksInput.click();
});

createPrUpdateButton.addEventListener("click", createWebsiteUpdateIssue);

importBooksInput.addEventListener("change", async () => {
  const [file] = importBooksInput.files ?? [];
  if (!file) {
    return;
  }

  try {
    await importBooksFromFile(file);
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "Could not import file.");
  } finally {
    importBooksInput.value = "";
  }
});

initializeLibrary();
