const bookList = document.getElementById("bookList");
const movieList = document.getElementById("movieList");
const template = document.getElementById("bookCardTemplate");
const movieTemplate = document.getElementById("movieCardTemplate");
const addBookForm = document.getElementById("addBookForm");
const addMovieForm = document.getElementById("addMovieForm");
const createPrUpdateButton = document.getElementById("createPrUpdateButton");
const createMoviePrUpdateButton = document.getElementById("createMoviePrUpdateButton");
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
const filterButtons = document.querySelectorAll(".filter-button");

let books = [];
let movies = [];
let currentMovieFilter = "all";

function normalizeMovie(movie) {
  if (!movie || typeof movie.title !== "string") {
    return null;
  }

  return {
    id: String(movie.id ?? `movie-${crypto.randomUUID()}`),
    title: String(movie.title),
    year: movie.year ? Number(movie.year) : null,
    status: String(movie.status ?? "want-to-watch"),
  };
}

async function loadMoviesFromMarkdown() {
  try {
    const response = await fetch("./data/movies.md", { cache: "no-store" });
    if (!response.ok) {
      return [];
    }

    const markdown = await response.text();
    const jsonBlockMatch = markdown.match(/```json\s*([\s\S]*?)```/i);
    if (!jsonBlockMatch) {
      return [];
    }

    const parsedMovies = JSON.parse(jsonBlockMatch[1]);
    if (!Array.isArray(parsedMovies)) {
      return [];
    }

    return parsedMovies.map(normalizeMovie).filter(Boolean);
  } catch {
    return [];
  }
}


// Parses "1-50, 200-250" into a count of unique page numbers within [1, totalPages]
function parsePageRanges(str, totalPages) {
  if (!str || !str.trim()) return 0;
  const pages = new Set();
  for (const part of str.split(",")) {
    const range = part.trim();
    const dashIdx = range.indexOf("-", 1);
    if (dashIdx !== -1) {
      const from = parseInt(range.slice(0, dashIdx), 10);
      const to = parseInt(range.slice(dashIdx + 1), 10);
      if (Number.isFinite(from) && Number.isFinite(to)) {
        for (let p = Math.max(1, from); p <= Math.min(to, totalPages); p++) pages.add(p);
      }
    } else {
      const p = parseInt(range, 10);
      if (Number.isFinite(p) && p >= 1 && p <= totalPages) pages.add(p);
    }
  }
  return pages.size;
}

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

  // Backward compat: convert old currentPages number to a range string
  let pagesRead = book.pagesRead ?? null;
  if (pagesRead === null && Number.isFinite(Number(book.currentPages)) && Number(book.currentPages) > 0) {
    pagesRead = `1-${Math.min(Number(book.currentPages), totalPages)}`;
  }

  return {
    id: String(book.id ?? `book-${crypto.randomUUID()}`),
    title: String(book.title),
    author: String(book.author),
    totalPages,
    pagesRead: String(pagesRead ?? ""),
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
  const markdownMovies = await loadMoviesFromMarkdown();
  books = markdownBooks;
  movies = markdownMovies;
  renderLibrary();
  renderMovies();
}

function saveBooks(nextBooks) {
  books = nextBooks;
}

function saveMovies(nextMovies) {
  movies = nextMovies;
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

  const compactBooks = books.map((book) => ({
    id: String(book.id),
    title: String(book.title),
    author: String(book.author),
    totalPages: Number(book.totalPages),
    pagesRead: String(book.pagesRead ?? ""),
  }));

  const compactMovies = movies.map((movie) => ({
    id: String(movie.id),
    title: String(movie.title),
    year: movie.year ? Number(movie.year) : null,
    status: String(movie.status),
  }));

  const issueTitle = `[website-update] Library data update (${new Date().toISOString().slice(0, 10)})`;
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
    "<!-- MOVIES_JSON_START -->",
    "```json",
    JSON.stringify(compactMovies, null, 2),
    "```",
    "<!-- MOVIES_JSON_END -->",
  ].join("\n");

  const issueUrl = new URL(`https://github.com/${owner}/${repo}/issues/new`);
  issueUrl.searchParams.set("title", issueTitle);
  issueUrl.searchParams.set("body", issueBody);

  window.open(issueUrl.toString(), "_blank", "noopener");
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

  const uniquePages = parsePageRanges(book.pagesRead, book.totalPages);
  const progress = book.totalPages === 0 ? 0 : Math.round((uniquePages / book.totalPages) * 100);

  row.dataset.bookId = book.id;
  title.textContent = book.title;
  author.textContent = book.author;
  currentPagesInput.value = book.pagesRead;
  currentPagesInput.addEventListener("change", () => updatePagesRead(book.id, currentPagesInput.value));
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

function renderMovie(movie) {
  const fragment = movieTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".movie-row");
  const title = fragment.querySelector(".title");
  const year = fragment.querySelector(".year");
  const status = fragment.querySelector(".status");
  const removeButton = fragment.querySelector(".remove-movie");

  const statusLabel = movie.status === "watched" ? "✓ Watched" : "⏱ Want to Watch";

  row.dataset.movieId = movie.id;
  row.dataset.status = movie.status;
  title.textContent = movie.title;
  year.textContent = movie.year ? `${movie.year}` : "No year";
  status.textContent = statusLabel;
  
  removeButton.addEventListener("click", () => removeMovie(movie.id));

  return fragment;
}

function renderMovies() {
  movieList.replaceChildren();
  const fragment = document.createDocumentFragment();

  const filtered = currentMovieFilter === "all" 
    ? movies 
    : movies.filter((m) => m.status === currentMovieFilter);

  filtered.forEach((movie) => {
    fragment.appendChild(renderMovie(movie));
  });

  movieList.appendChild(fragment);
}

function removeBook(bookId) {
  books = books.filter((book) => book.id !== bookId);
  saveBooks(books);
  renderLibrary();
}

function removeMovie(movieId) {
  movies = movies.filter((movie) => movie.id !== movieId);
  saveMovies(movies);
  renderMovies();
}

function updatePagesRead(bookId, value) {
  const book = books.find((entry) => entry.id === bookId);
  if (!book) {
    return;
  }

  book.pagesRead = String(value ?? "").trim();
  saveBooks(books);
  renderLibrary();
}

addBookForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(addBookForm);
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const totalPages = Number(formData.get("totalPages") ?? 0);
  const pagesRead = String(formData.get("pagesRead") ?? "").trim();

  if (!title || !author || !Number.isFinite(totalPages) || totalPages < 1) {
    return;
  }

  books = [
    {
      id: `book-${crypto.randomUUID()}`,
      title,
      author,
      totalPages,
      pagesRead,
    },
    ...books,
  ];

  saveBooks(books);
  renderLibrary();
  addBookForm.reset();
});

addMovieForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(addMovieForm);
  const title = String(formData.get("title") ?? "").trim();
  const year = formData.get("year") ? Number(formData.get("year")) : null;
  const status = String(formData.get("status") ?? "want-to-watch");

  if (!title) {
    return;
  }

  movies = [
    {
      id: `movie-${crypto.randomUUID()}`,
      title,
      year,
      status,
    },
    ...movies,
  ];

  saveMovies(movies);
  renderMovies();
  addMovieForm.reset();
});

// Tab switching
tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.getAttribute("data-tab");
    
    // Update active button
    tabButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    
    // Update active content
    tabContents.forEach((content) => content.classList.remove("active"));
    document.getElementById(`${tab}Tab`).classList.add("active");
  });
});

// Movie filter buttons
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentMovieFilter = button.getAttribute("data-filter");
    
    // Update active button
    filterButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    
    renderMovies();
  });
});

createPrUpdateButton.addEventListener("click", createWebsiteUpdateIssue);
createMoviePrUpdateButton.addEventListener("click", createWebsiteUpdateIssue);

initializeLibrary();
