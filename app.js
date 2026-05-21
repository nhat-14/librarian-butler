const storageKey = "simple-book-list";
const bookList = document.getElementById("bookList");
const template = document.getElementById("bookCardTemplate");
const addBookForm = document.getElementById("addBookForm");
const exportBooksButton = document.getElementById("exportBooksButton");
const importBooksButton = document.getElementById("importBooksButton");
const importBooksInput = document.getElementById("importBooksInput");

let books = loadBooks();

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

function loadBooks() {
  try {
    const storedBooks = JSON.parse(localStorage.getItem(storageKey));
    if (!Array.isArray(storedBooks)) {
      return [];
    }

    return storedBooks.map(normalizeBook).filter(Boolean);
  } catch {
    return [];
  }
}

function saveBooks(nextBooks) {
  localStorage.setItem(storageKey, JSON.stringify(nextBooks));
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
  const percent = fragment.querySelector(".percent");
  const progressBar = fragment.querySelector(".progress-bar");
  const editButton = fragment.querySelector(".edit-book");
  const removeButton = fragment.querySelector(".remove-book");

  const progress = book.totalPages === 0 ? 0 : Math.round((book.currentPages / book.totalPages) * 100);

  row.dataset.bookId = book.id;
  title.textContent = book.title;
  author.textContent = book.author;
  percent.textContent = `${progress}%`;
  progressBar.style.width = `${progress}%`;
  editButton.addEventListener("click", () => editBook(book.id));
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

function editBook(bookId) {
  const book = books.find((entry) => entry.id === bookId);
  if (!book) {
    return;
  }

  const nextTitle = window.prompt("Book title", book.title);
  if (nextTitle === null) {
    return;
  }

  const nextAuthor = window.prompt("Author", book.author);
  if (nextAuthor === null) {
    return;
  }

  const nextTotalPagesInput = window.prompt("Total pages", String(book.totalPages));
  if (nextTotalPagesInput === null) {
    return;
  }

  const nextCurrentPagesInput = window.prompt("Current pages", String(book.currentPages));
  if (nextCurrentPagesInput === null) {
    return;
  }

  const nextTitleValue = nextTitle.trim();
  const nextTotalPages = Number(nextTotalPagesInput);
  const nextCurrentPages = Number(nextCurrentPagesInput);

  if (
    !nextTitleValue ||
    !nextAuthor.trim() ||
    !Number.isFinite(nextTotalPages) ||
    nextTotalPages < 1 ||
    !Number.isFinite(nextCurrentPages)
  ) {
    return;
  }

  book.title = nextTitleValue;
  book.author = nextAuthor.trim();
  book.totalPages = nextTotalPages;
  book.currentPages = Math.min(Math.max(nextCurrentPages, 0), nextTotalPages);

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

renderLibrary();
