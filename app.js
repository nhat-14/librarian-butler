const storageKey = "simple-book-list";
const bookList = document.getElementById("bookList");
const template = document.getElementById("bookCardTemplate");
const addBookForm = document.getElementById("addBookForm");

let books = loadBooks();

function loadBooks() {
  try {
    const storedBooks = JSON.parse(localStorage.getItem(storageKey));
    if (!Array.isArray(storedBooks)) {
      return [];
    }

    return storedBooks
      .filter((book) => book && typeof book.title === "string" && Number.isFinite(Number(book.totalPages)))
      .map((book) => ({
        id: String(book.id ?? `book-${crypto.randomUUID()}`),
        title: String(book.title),
        totalPages: Number(book.totalPages),
        currentPages: Math.min(
          Math.max(Number(book.currentPages ?? 0), 0),
          Number(book.totalPages),
        ),
      }));
  } catch {
    return [];
  }
}

function saveBooks(nextBooks) {
  localStorage.setItem(storageKey, JSON.stringify(nextBooks));
}

function renderBook(book) {
  const fragment = template.content.cloneNode(true);
  const row = fragment.querySelector(".book-row");
  const title = fragment.querySelector(".title");
  const percent = fragment.querySelector(".percent");
  const progressBar = fragment.querySelector(".progress-bar");
  const editButton = fragment.querySelector(".edit-book");
  const removeButton = fragment.querySelector(".remove-book");

  const progress = book.totalPages === 0 ? 0 : Math.round((book.currentPages / book.totalPages) * 100);

  row.dataset.bookId = book.id;
  title.textContent = book.title;
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

  if (!nextTitleValue || !Number.isFinite(nextTotalPages) || nextTotalPages < 1 || !Number.isFinite(nextCurrentPages)) {
    return;
  }

  book.title = nextTitleValue;
  book.totalPages = nextTotalPages;
  book.currentPages = Math.min(Math.max(nextCurrentPages, 0), nextTotalPages);

  saveBooks(books);
  renderLibrary();
}

addBookForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(addBookForm);
  const title = String(formData.get("title") ?? "").trim();
  const totalPages = Number(formData.get("totalPages") ?? 0);
  const currentPages = Number(formData.get("currentPages") ?? 0);

  if (!title || !Number.isFinite(totalPages) || totalPages < 1 || !Number.isFinite(currentPages)) {
    return;
  }

  const safeCurrentPages = Math.min(Math.max(currentPages, 0), totalPages);

  books = [
    {
      id: `book-${crypto.randomUUID()}`,
      title,
      totalPages,
      currentPages: safeCurrentPages,
    },
    ...books,
  ];

  saveBooks(books);
  renderLibrary();
  addBookForm.reset();
});

renderLibrary();
