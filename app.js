const defaultBooks = [
  {
    id: "networking",
    title: "Computer Networking: A Top-Down Approach, Global Edition",
    author: "James Kurose and Keith Ross",
    totalPages: 864,
    cover:
      "https://placehold.co/600x800/244b5a/F7F2E8?text=Computer+Networking",
  },
  {
    id: "pride",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    totalPages: 432,
    cover:
      "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
  },
  {
    id: "dune",
    title: "Dune",
    author: "Frank Herbert",
    totalPages: 688,
    cover:
      "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
  },
  {
    id: "sapiens",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    totalPages: 498,
    cover:
      "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
  },
  {
    id: "hobbit",
    title: "The Hobbit",
    author: "J. R. R. Tolkien",
    totalPages: 310,
    cover:
      "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
  },
];

const booksStorageKey = "book-catalog";
const progressStorageKey = "book-progress-state";
const bookList = document.getElementById("bookList");
const template = document.getElementById("bookCardTemplate");
const addBookForm = document.getElementById("addBookForm");
let books = loadBooks();
const savedState = loadProgressState();

function loadBooks() {
  try {
    const storedBooks = JSON.parse(localStorage.getItem(booksStorageKey));
    if (!Array.isArray(storedBooks) || storedBooks.length === 0) {
      return defaultBooks;
    }

    const existingIds = new Set(storedBooks.map((book) => book.id));
    const missingDefaults = defaultBooks.filter((book) => !existingIds.has(book.id));
    return [...missingDefaults, ...storedBooks];
  } catch {
    return defaultBooks;
  }
}

function saveBooks(nextBooks) {
  localStorage.setItem(booksStorageKey, JSON.stringify(nextBooks));
}

function loadProgressState() {
  try {
    return JSON.parse(localStorage.getItem(progressStorageKey)) ?? {};
  } catch {
    return {};
  }
}

function saveProgressState(state) {
  localStorage.setItem(progressStorageKey, JSON.stringify(state));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatProgress(currentPage, totalPages) {
  const ratio = totalPages === 0 ? 0 : currentPage / totalPages;
  const percent = Math.round(ratio * 100);
  return {
    percent: clamp(percent, 0, 100),
    ratio: clamp(ratio, 0, 1),
  };
}

function renderBook(book) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector(".book-card");
  const cover = fragment.querySelector(".cover");
  const title = fragment.querySelector(".title");
  const author = fragment.querySelector(".author");
  const totalPages = fragment.querySelector(".total-pages");
  const percent = fragment.querySelector(".percent");
  const input = fragment.querySelector(".page-input");
  const progressBar = fragment.querySelector(".progress-bar");
  const summary = fragment.querySelector(".page-summary");

  const currentPage = Number(savedState[book.id] ?? 0);
  const progress = formatProgress(currentPage, book.totalPages);

  card.dataset.bookId = book.id;
  cover.src = book.cover;
  cover.alt = `${book.title} cover`;
  title.textContent = book.title;
  author.textContent = book.author;
  totalPages.textContent = book.totalPages.toLocaleString();
  percent.textContent = `${progress.percent}%`;
  input.value = currentPage;
  input.max = book.totalPages;
  progressBar.style.width = `${progress.percent}%`;
  summary.textContent = `${clamp(currentPage, 0, book.totalPages).toLocaleString()} / ${book.totalPages.toLocaleString()} pages`;

  input.addEventListener("input", () => {
    const nextValue = clamp(Number(input.value || 0), 0, book.totalPages);
    savedState[book.id] = nextValue;
    saveProgressState(savedState);

    const nextProgress = formatProgress(nextValue, book.totalPages);
    percent.textContent = `${nextProgress.percent}%`;
    progressBar.style.width = `${nextProgress.percent}%`;
    summary.textContent = `${nextValue.toLocaleString()} / ${book.totalPages.toLocaleString()} pages`;
  });

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

function getCoverFallback(title) {
  void title;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#d9c7af" />
          <stop offset="100%" stop-color="#a96f46" />
        </linearGradient>
      </defs>
      <rect width="600" height="800" rx="40" fill="url(#g)"/>
      <rect x="52" y="56" width="496" height="688" rx="30" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.28)"/>
      <text x="70" y="230" fill="#fff" font-family="Georgia, serif" font-size="56" font-weight="700">New Book</text>
      <text x="70" y="320" fill="#fff" font-family="Arial, sans-serif" font-size="34">Add a cover URL</text>
    </svg>
  `);
}

function addBook(book) {
  books = [book, ...books];
  saveBooks(books);
  renderLibrary();
}

addBookForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(addBookForm);
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const totalPages = Number(formData.get("totalPages") ?? 0);
  const coverInput = String(formData.get("cover") ?? "").trim();

  if (!title || !author || !Number.isFinite(totalPages) || totalPages < 1) {
    return;
  }

  addBook({
    id: `book-${crypto.randomUUID()}`,
    title,
    author,
    totalPages,
    cover: coverInput || getCoverFallback(title),
  });

  addBookForm.reset();
});

renderLibrary();
