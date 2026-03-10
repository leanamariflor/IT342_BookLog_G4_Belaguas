import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../css/AddBooks.css";
import { createBook, getUserBooks, searchBooks, uploadBookAttachment } from "../services/BookService";

const AddBook = ({ onLogout }) => {
  const navigate = useNavigate();
  const PLACEHOLDER_COVER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><rect width='100%25' height='100%25' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='20'>No Cover</text></svg>";
  const [activeTab, setActiveTab] = useState("manual");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [addingBookKeys, setAddingBookKeys] = useState([]);
  const addingBookKeysRef = useRef(new Set());

  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualStatus, setManualStatus] = useState("To Read");
  const [manualDescription, setManualDescription] = useState("");
  const [manualImageFile, setManualImageFile] = useState(null);
  const [manualImagePreview, setManualImagePreview] = useState("");
  const manualImageInputRef = useRef(null);

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const normalizeText = (value) => (value || "").trim().toLowerCase();

  const hasDuplicateInList = (books, title, author) => {
    const normalizedTitle = normalizeText(title);
    const normalizedAuthor = normalizeText(author);

    return books.some((existingBook) => {
      const existingTitle = normalizeText(existingBook.title);
      const existingAuthor = normalizeText(
        existingBook.author ||
          (Array.isArray(existingBook.authors) ? existingBook.authors.join(", ") : "")
      );

      return existingTitle === normalizedTitle && existingAuthor === normalizedAuthor;
    });
  };

  const getBookCardKey = (bookTitle, authors) => {
    const authorText = Array.isArray(authors) && authors.length > 0 ? authors.join(", ") : "";
    return `${normalizeText(bookTitle)}|${normalizeText(authorText)}`;
  };

  const isBookBeingAdded = (book) => addingBookKeysRef.current.has(getBookCardKey(book.title, book.authors));

  const handleManualImageSelection = async (file) => {
    if (!file) {
      setManualImageFile(null);
      setManualImagePreview("");
      return;
    }

    setManualImageFile(file);
    const previewData = await fileToDataUrl(file);
    setManualImagePreview(previewData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isManualSubmitting) {
      return;
    }

    if (!manualTitle.trim()) {
      alert("Title is required.");
      return;
    }

    try {
      setIsManualSubmitting(true);
      let imageDataUrl = PLACEHOLDER_COVER;
      if (manualImageFile) {
        imageDataUrl = manualImagePreview || (await fileToDataUrl(manualImageFile));
      }

      let backendBook = null;
      let uploadedBook = null;
      const token = localStorage.getItem("token");

      // Persist to backend when authenticated so file upload requirement is met.
      if (token) {
        backendBook = await createBook({
          title: manualTitle,
          author: manualAuthor || null,
          status: manualStatus,
          description: manualDescription || null,
          rating: null,
          coverImageUrl: null
        });

        if (manualImageFile && backendBook?.bookId) {
          uploadedBook = await uploadBookAttachment(backendBook.bookId, manualImageFile);
        }
      }

      const savedBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
      if (hasDuplicateInList(savedBooks, manualTitle, manualAuthor)) {
        alert("This book is already in your collection.");
        return;
      }

      const now = new Date().toISOString().split("T")[0];
      const latestBookData = uploadedBook || backendBook;

      const newBook = {
        id: Date.now(),
        bookId: latestBookData?.bookId || null,
        title: manualTitle,
        image: latestBookData?.attachmentUrl || latestBookData?.coverImageUrl || imageDataUrl,
        authors: manualAuthor ? [manualAuthor] : [],
        description: manualDescription || "No description available",
        favorite: false,
        rating: 0,
        status: manualStatus,
        dateAdded: now,
        dateUpdated: now,
        attachmentUrl: latestBookData?.attachmentUrl || (latestBookData?.bookId ? `/api/books/${latestBookData.bookId}/attachment` : null),
        coverImageUrl: latestBookData?.coverImageUrl || null,
        attachmentOriginalName: latestBookData?.attachmentOriginalName || null,
        attachmentContentType: latestBookData?.attachmentContentType || null
      };

      savedBooks.push(newBook);
      localStorage.setItem("userBooks", JSON.stringify(savedBooks));

      setManualTitle("");
      setManualAuthor("");
      setManualStatus("To Read");
      setManualDescription("");
      setManualImageFile(null);
      setManualImagePreview("");

      alert("Book added successfully!");
      navigate("/books");
    } catch (submitError) {
      console.error("Manual add error:", submitError);
      alert(submitError.response?.data?.message || "Failed to add book. Please try again.");
    } finally {
      setIsManualSubmitting(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(0);
    
    try {
      const results = await searchBooks(searchQuery, 0);
      setSearchResults(results);
    } catch (err) {
      setError("Failed to search books. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage) => {
    if (newPage < 0) return;

    setLoading(true);
    setError(null);
    
    try {
      const results = await searchBooks(searchQuery, newPage);
      setSearchResults(results);
      setCurrentPage(newPage);
    } catch (err) {
      setError("Failed to load more books. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleAddBook = async (book) => {
    const authorText = book.authors && book.authors.length > 0 ? book.authors.join(", ") : "";
    const cardKey = getBookCardKey(book.title, book.authors);

    if (addingBookKeysRef.current.has(cardKey)) {
      return;
    }

    addingBookKeysRef.current.add(cardKey);
    setAddingBookKeys(Array.from(addingBookKeysRef.current));

    try {
      const token = localStorage.getItem("token");
      const savedBooks = JSON.parse(localStorage.getItem("userBooks")) || [];

      if (hasDuplicateInList(savedBooks, book.title, authorText)) {
        alert(`"${book.title}" is already in your collection.`);
        return;
      }

      if (token) {
        const backendBooks = await getUserBooks();
        if (hasDuplicateInList(backendBooks, book.title, authorText)) {
          alert(`"${book.title}" is already in your collection.`);
          return;
        }
      }
      
      // Save to backend database (authenticated users only)
      let backendBook = null;
      if (token) {
        backendBook = await createBook({
          title: book.title,
          author: book.authors && book.authors.length > 0 ? book.authors.join(", ") : null,
          status: "To Read",
          description: book.description || null,
          rating: null,
          coverImageUrl: book.thumbnail || null
        });
      }
      
      const now = new Date().toISOString().split('T')[0];
      
      // Create new book object with all necessary fields
      const newBook = {
        id: Date.now(), // Use timestamp as unique ID
        bookId: backendBook?.bookId || null,
        title: book.title,
        image: backendBook?.attachmentUrl || backendBook?.coverImageUrl || book.thumbnail || "https://picsum.photos/200/300?random=" + Date.now(),
        authors: book.authors || [],
        description: book.description || "No description available",
        publisher: book.publisher || "",
        publishedDate: book.publishedDate || "",
        favorite: false,
        rating: 0,
        status: "To Read",
        dateAdded: now,
        dateUpdated: now,
        coverImageUrl: backendBook?.coverImageUrl || book.thumbnail || null,
      };
      
      // Add to saved books and save to localStorage
      savedBooks.push(newBook);
      localStorage.setItem("userBooks", JSON.stringify(savedBooks));
      
      // Show success message
      alert(`"${book.title}" added to your collection!`);
    } catch (err) {
      console.error("Error adding book:", err);
      alert(err.response?.data?.message || "Failed to add book. Please try again.");
    } finally {
      addingBookKeysRef.current.delete(cardKey);
      setAddingBookKeys(Array.from(addingBookKeysRef.current));
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activePage="books" onLogout={onLogout} />

      <div className="add-book-page">

        <h1>Add Book</h1>

        {/* Tabs */}
        <div className="tab-buttons">
         

          <button
            className={activeTab === "search" ? "tab active" : "tab"}
            onClick={() => setActiveTab("search")}
          >
            Search Books
          </button>

           <button
            className={activeTab === "manual" ? "tab active" : "tab"}
            onClick={() => setActiveTab("manual")}
          >
            Manual Entry
          </button>
        </div>

       
        {/* Search Books */}
        {activeTab === "search" && (
          <div className="form-card search-card">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search by title, author, or ISBN..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                onClick={handleSearch} 
                className="search-btn"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="search-results">
              {searchResults.length > 0 && (
                <div>
                  <div className="results-grid">
                    {searchResults.map((book) => (
                      <div
                        key={book.id}
                        className="book-card"
                        onClick={() => handleAddBook(book)}
                        style={{
                          cursor: isBookBeingAdded(book) ? "not-allowed" : "pointer",
                          opacity: isBookBeingAdded(book) ? 0.65 : 1,
                          pointerEvents: isBookBeingAdded(book) ? "none" : "auto"
                        }}
                      >
                        <div className="book-image">
                          {book.thumbnail ? (
                            <img src={book.thumbnail} alt={book.title} />
                          ) : (
                            <div className="no-image">No Image</div>
                          )}
                        </div>
                        <div className="book-info">
                          <h3 className="book-title">{book.title}</h3>
                          {book.authors && book.authors.length > 0 && (
                            <p className="book-authors">
                              {book.authors.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="pagination-controls">
                    <button 
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0 || loading}
                    >
                      ← Previous
                    </button>
                    <span className="page-info">Page {currentPage + 1}</span>
                    <button 
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={loading || searchResults.length < 20}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {!loading && searchResults.length === 0 && searchQuery && (
                <p className="no-results">
                  No books found. Try a different search term.
                </p>
              )}
            </div>
          </div>
        )}
         {/* Manual Entry */}
        {activeTab === "manual" && (
          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <label>Book Photo / Attachment</label>
              <div className="manual-upload-box-container">
                <button
                  type="button"
                  className="manual-upload-box"
                  onClick={() => manualImageInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      manualImageInputRef.current?.click();
                    }
                  }}
                >
                  {manualImagePreview ? (
                    <img src={manualImagePreview} alt="Selected book" className="manual-upload-preview" />
                  ) : (
                    <div className="manual-upload-placeholder">
                      <span className="manual-upload-plus">+</span>
                      <span className="manual-upload-text">Click to add a cover or attachment</span>
                      <span className="manual-upload-subtext">Saved file can be viewed and downloaded in Book Details</span>
                    </div>
                  )}
                </button>
                {manualImagePreview && (
                  <div className="manual-upload-controls">
                    <button
                      type="button"
                      className="manual-upload-control-btn change-btn"
                      onClick={() => manualImageInputRef.current?.click()}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      className="manual-upload-control-btn remove-btn"
                      onClick={() => handleManualImageSelection(null)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={manualImageInputRef}
                className="manual-upload-input"
                type="file"
                accept="image/*"
                onChange={(e) => handleManualImageSelection(e.target.files?.[0] || null)}
              />

              <label>Title</label>
              <input
                type="text"
                placeholder="Book title"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
              />

              <label>Author</label>
              <input
                type="text"
                placeholder="Author name"
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value)}
              />

              <label>Status</label>
              <select value={manualStatus} onChange={(e) => setManualStatus(e.target.value)}>
                <option>To Read</option>
                <option>Reading</option>
                <option>Completed</option>
                <option>On Hold</option>
              </select>

              <label>Description</label>
              <textarea
                placeholder="Optional description"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
              ></textarea>

              <button type="submit" className="primary-btn" disabled={isManualSubmitting}>
                {isManualSubmitting ? "Adding..." : "Add Book"}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default AddBook;