import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Books.css";
import Sidebar from "./Sidebar";
import { getUserBooks } from "../services/BookService";

const Books = ({ onLogout, mode = "completed" }) => {

  const PLACEHOLDER_COVER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><rect width='100%25' height='100%25' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='20'>No Cover</text></svg>";

  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState("New");
  const [statusFilter, setStatusFilter] = useState("To Read");
  const [showRandomDraw, setShowRandomDraw] = useState(true);
  const [randomBook, setRandomBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Load books from backend database on mount
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      if (token) {
        // Fetch from backend database (only accessible to authenticated user)
        const backendBooks = await getUserBooks();
        
        // Transform backend books to match frontend format
        const transformedBooks = backendBooks.map(book => ({
          id: book.bookId,
          bookId: book.bookId,
          title: book.title,
          image: book.attachmentUrl || book.coverImageUrl || PLACEHOLDER_COVER,
          authors: book.author ? [book.author] : [],
          description: book.description || "No description available",
          favorite: false,
          rating: book.rating || 0,
          status: book.status || "To Read",
          dateAdded: book.createdAt ? new Date(book.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dateUpdated: book.updatedAt ? new Date(book.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          coverImageUrl: book.coverImageUrl,
          attachmentUrl: book.attachmentUrl,
          attachmentOriginalName: book.attachmentOriginalName,
          attachmentContentType: book.attachmentContentType
        }));
        
        setBooks(transformedBooks);
        // Sync with localStorage for offline access
        localStorage.setItem("userBooks", JSON.stringify(transformedBooks));
      } else {
        // Fallback to localStorage if not authenticated
        const savedBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
        setBooks(savedBooks);
      }
    } catch (error) {
      console.error("Error loading books:", error);
      // Fallback to localStorage on error
      const savedBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
      setBooks(savedBooks);
    } finally {
      setLoading(false);
    }
  };

  const sortBooks = (booksArray, sortType) => {
    const sorted = [...booksArray];
    switch (sortType) {
      case "New":
        return sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      case "Old":
        return sorted.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
      case "Title (A-Z)":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "Title (Z-A)":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case "Author (A-Z)":
        return sorted.sort((a, b) => {
          const authA = (a.authors && a.authors[0]) || "";
          const authB = (b.authors && b.authors[0]) || "";
          return authA.localeCompare(authB);
        });
      case "Author (Z-A)":
        return sorted.sort((a, b) => {
          const authA = (a.authors && a.authors[0]) || "";
          const authB = (b.authors && b.authors[0]) || "";
          return authB.localeCompare(authA);
        });
      default:
        return sorted;
    }
  };

  const scopedBooks = books.filter((book) => {
    if (mode === "to-read") {
      return book.status === "To Read";
    } else if (mode === "reading") {
      return book.status === "Reading";
    } else {
      return book.status === "Completed";
    }
  });

  const searchedBooks = scopedBooks.filter((book) => {
    if ((mode === "to-read" || mode === "reading") && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = book.title.toLowerCase().includes(query);
      const authorMatch = book.authors && book.authors.some(author => author.toLowerCase().includes(query));
      return titleMatch || authorMatch;
    }
    return true;
  });

  const sortedBooks = sortBooks(searchedBooks, sortBy);
  const pageTitle = mode === "to-read" ? "Books to read later" : mode === "reading" ? "Currently Reading" : "My Books";
  const emptyMessage =
    mode === "to-read"
      ? "No books in To Read yet. Start by adding a book!"
      : mode === "reading"
      ? "No books currently reading. Start a book!"
      : "No completed books yet. Complete a book to show it here!";

  const handleRandomDraw = () => {
    if (scopedBooks.length > 0) {
      const randomIndex = Math.floor(Math.random() * scopedBooks.length);
      setRandomBook(scopedBooks[randomIndex]);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activePage="books" onLogout={onLogout} />
      
      <div className="books-page">
      {(mode === "to-read" || mode === "reading") && (
        <div className="books-intro">
          <h1>{pageTitle}</h1>
          <p className="books-count">There are {scopedBooks.length} books.</p>
        </div>
      )}      {(mode === "to-read" || mode === "reading") && (
        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="status-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="New">New</option>
            <option value="Old">Old</option>
            <option value="Title (A-Z)">Title (A-Z)</option>
            <option value="Title (Z-A)">Title (Z-A)</option>
            <option value="Author (A-Z)">Author (A-Z)</option>
            <option value="Author (Z-A)">Author (Z-A)</option>
          </select>
        </div>
      )}      {mode !== "to-read" && mode !== "reading" && (
      <div className="books-header">
        <div className="books-title-group">
          <h1>{pageTitle}</h1>
          {mode === "completed" && (
            <p className="books-read-total">you read {books.filter(b => b.status === "Completed").length} books!</p>
          )}
        </div>
        <div className="books-controls">
          <select
            className="status-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Recently Updated">Recently Updated</option>
            <option value="Recently Added">Recently Added</option>
            <option value="Star Rating (High to Low)">Star Rating (High to Low)</option>
            <option value="Star Rating (Low to High)">Star Rating (Low to High)</option>
            <option value="Title (A-Z)">Title (A-Z)</option>
            <option value="Title (Z-A)">Title (Z-A)</option>
          </select>
        </div>
      </div>
      )}

      <div className="books-grid">
        {mode === "to-read" && !loading && (
          <button className="book-card add-book-card" onClick={() => navigate("/add-book")}>
            <div className="add-book-plus">+</div>
            <p className="book-title add-book-title">Add Book</p>
          </button>
        )}

        {loading ? (
          <div className="loading-state">
            <p>Loading your books...</p>
          </div>
        ) : sortedBooks.length > 0 ? (
          <>
            {sortedBooks.map((book) => (
              <div key={book.id} className="book-card" onClick={() => navigate(`/books/${book.id}`)}>
                <div className="image-wrapper">
                  <img
                    src={book.image}
                    alt={book.title}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = PLACEHOLDER_COVER;
                    }}
                  />
                  {mode !== "to-read" && mode !== "reading" && (
                    <div className="star-rating">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < book.rating ? "book-star filled" : "book-star"}>
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="book-title">{book.title}</p>
              </div>
            ))}
          </>
        ) : (
          mode === "to-read" ? (
            <div className="empty-state">
              <p>{emptyMessage}</p>
            </div>
          ) : (
            <div className="empty-state">
              <p>{emptyMessage} <strong onClick={() => navigate("/add-book")} style={{ cursor: "pointer", color: "#000" }}>Add one</strong>.</p>
            </div>
          )
        )}
      </div>
      </div>
    </div>
  );
};

export default Books;