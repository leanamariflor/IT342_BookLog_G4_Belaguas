import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Books.css";
import Sidebar from "./Sidebar";
import PageLoader from "./PageLoader";
import { getUserBooks } from "../services/BookService";
import { toAbsoluteMediaUrl } from "../utils/mediaUrl";
import api from "../api/axios";

const Books = ({ onLogout, mode = "completed" }) => {

  const PLACEHOLDER_COVER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><rect width='100%25' height='100%25' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='20'>No Cover</text></svg>";

  const navigate = useNavigate();
  const STATUS_BY_MODE = {
    "to-read": "To Read",
    reading: "Reading",
    completed: "Completed",
    "on-hold": "On Hold"
  };
  const ROUTE_BY_STATUS = {
    "To Read": "/to-read",
    Reading: "/reading",
    Completed: "/books",
    "On Hold": "/on-hold"
  };

  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState("New");
  const [selectedStatus, setSelectedStatus] = useState(STATUS_BY_MODE[mode] || "Completed");
  const [showRandomDraw, setShowRandomDraw] = useState(true);
  const [randomBook, setRandomBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedStatus(STATUS_BY_MODE[mode] || "Completed");
  }, [mode]);

  // Load books from backend database on mount

  useEffect(() => {
    loadBooks(selectedStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const loadBooks = async (statusFilter) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Fetch from backend database with status filter
        const backendBooks = await getUserBooks(statusFilter);
        const transformedBooks = await Promise.all(backendBooks.map(async (book) => {
          let resolvedImage = toAbsoluteMediaUrl(book.coverImageUrl) || PLACEHOLDER_COVER;
          if (book.attachmentUrl && book.bookId) {
            try {
              const response = await api.get(`/books/${book.bookId}/attachment`, {
                responseType: "blob"
              });
              resolvedImage = URL.createObjectURL(response.data);
            } catch (attachmentError) {
              console.error("Unable to load attachment preview for book", book.bookId, attachmentError);
            }
          }
          return {
            id: book.bookId,
            bookId: book.bookId,
            title: book.title,
            image: resolvedImage,
            authors: book.author ? [book.author] : [],
            description: book.description || "No description available",
            notes: Array.isArray(book.notes)
              ? book.notes.map((note) => ({
                  id: note.id || Date.now() + Math.random(),
                  text: note.text || "",
                  date: note.date || new Date().toISOString(),
                  isFavorited: Boolean(note.isFavorited)
                }))
              : [],
            favorite: false,
            rating: book.rating || 0,
            status: book.status || "To Read",
            dateAdded: book.createdAt ? new Date(book.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            dateUpdated: book.updatedAt ? new Date(book.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            coverImageUrl: toAbsoluteMediaUrl(book.coverImageUrl) || null,
            attachmentUrl: toAbsoluteMediaUrl(book.attachmentUrl) || null,
            attachmentOriginalName: book.attachmentOriginalName,
            attachmentContentType: book.attachmentContentType
          };
        }));
        setBooks(transformedBooks);
        localStorage.setItem("userBooks", JSON.stringify(transformedBooks));
      } else {
        // Fallback to localStorage if not authenticated
        const savedBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
        const normalizedBooks = savedBooks.map((book) => ({
          ...book,
          image: toAbsoluteMediaUrl(book.image) || PLACEHOLDER_COVER,
          coverImageUrl: toAbsoluteMediaUrl(book.coverImageUrl) || null,
          attachmentUrl: toAbsoluteMediaUrl(book.attachmentUrl) || null
        }));
        setBooks(normalizedBooks);
      }
    } catch (error) {
      console.error("Error loading books:", error);
      // Fallback to localStorage on error
      const savedBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
      const normalizedBooks = savedBooks.map((book) => ({
        ...book,
        image: toAbsoluteMediaUrl(book.image) || PLACEHOLDER_COVER,
        coverImageUrl: toAbsoluteMediaUrl(book.coverImageUrl) || null,
        attachmentUrl: toAbsoluteMediaUrl(book.attachmentUrl) || null
      }));
      setBooks(normalizedBooks);
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

  const scopedBooks = books.filter((book) => book.status === selectedStatus);

  const searchedBooks = scopedBooks.filter((book) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = book.title.toLowerCase().includes(query);
      const authorMatch = book.authors && book.authors.some(author => author.toLowerCase().includes(query));
      return titleMatch || authorMatch;
    }
    return true;
  });

  const sortedBooks = sortBooks(searchedBooks, sortBy);
  let pageTitle = "My Books";
  if (selectedStatus === "To Read") pageTitle = "Books to Read Later";
  else if (selectedStatus === "Reading") pageTitle = "Currently Reading";
  else if (selectedStatus === "On Hold") pageTitle = "On Hold";
  else if (selectedStatus === "Completed") pageTitle = "Completed Books";

  let emptyMessage = "No books yet.";
  if (selectedStatus === "To Read") emptyMessage = "No books in To Read yet. Start by adding a book!";
  else if (selectedStatus === "Reading") emptyMessage = "No books currently reading. Start a book!";
  else if (selectedStatus === "On Hold") emptyMessage = "No books on hold. Put a book on hold to show it here!";
  else if (selectedStatus === "Completed") emptyMessage = "No completed books yet. Complete a book to show it here!";

  const handleStatusChange = (nextStatus) => {
    setSelectedStatus(nextStatus);
    // Optionally update the route if you want, but not required for filtering
    // navigate(ROUTE_BY_STATUS[nextStatus] || "/books");
  };

  const handleRandomDraw = () => {
    if (scopedBooks.length > 0) {
      const randomIndex = Math.floor(Math.random() * scopedBooks.length);
      setRandomBook(scopedBooks[randomIndex]);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar activePage="books" onLogout={onLogout} />
        <div className="books-page">
          <PageLoader message="Loading your books..." />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar activePage="books" onLogout={onLogout} />
      
      <div className="books-page">
        <div className="books-intro">
          <h1>{pageTitle}</h1>
          <p className="books-count">There are {scopedBooks.length} books.</p>
        </div>      
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
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="To Read">To Read</option>
            <option value="Reading">Reading</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Finished</option>
          </select>
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

      <div className="books-grid">
        {selectedStatus === "To Read" && !loading && (
          <button className="book-card add-book-card" onClick={() => navigate("/add-book")}>
            <div className="add-book-plus">+</div>
            <p className="book-title add-book-title">Add Book</p>
          </button>
        )}

        {sortedBooks.length > 0 ? (
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
                  {selectedStatus === "Completed" && (
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
          selectedStatus === "To Read" ? (
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