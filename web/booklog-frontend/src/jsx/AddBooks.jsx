import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../css/AddBooks.css";
import { createBook, searchBooks, updateBook, uploadBookAttachment } from "../services/BookService";
import { toAbsoluteMediaUrl } from "../utils/mediaUrl";

const AddBook = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const PLACEHOLDER_COVER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><rect width='100%25' height='100%25' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='20'>No Cover</text></svg>";
  const [activeTab, setActiveTab] = useState("manual");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [prefilledFromSearch, setPrefilledFromSearch] = useState(false);

  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualStatus, setManualStatus] = useState("To Read");
  const [manualDescription, setManualDescription] = useState("");
  const [manualImageFile, setManualImageFile] = useState(null);
  const [manualImagePreview, setManualImagePreview] = useState("");
  const [manualCoverImageUrl, setManualCoverImageUrl] = useState("");
  const [toast, setToast] = useState(null);
  const [editingBookRef, setEditingBookRef] = useState(null);
  const manualImageInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const isEditingExistingBook = Boolean(editingBookRef);

  const showToast = (message, type = "info", duration = 2600, details = {}) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type, ...details });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const incomingEditBook = location.state?.editBook;
    if (!incomingEditBook) {
      return;
    }

    setEditingBookRef({
      id: incomingEditBook.id,
      bookId: incomingEditBook.bookId || null,
      status: incomingEditBook.status || "To Read",
      sourceType: incomingEditBook.sourceType || "manual",
    });
    setPrefilledFromSearch(false);
    setActiveTab("manual");
    setManualTitle(incomingEditBook.title || "");
    setManualAuthor(
      incomingEditBook.author ||
        (Array.isArray(incomingEditBook.authors) ? incomingEditBook.authors.join(", ") : "")
    );
    setManualStatus(incomingEditBook.status || "To Read");
    setManualDescription(incomingEditBook.description || "");
    setManualImageFile(null);

    const existingPreview =
      incomingEditBook.image ||
      toAbsoluteMediaUrl(incomingEditBook.coverImageUrl) ||
      PLACEHOLDER_COVER;

    setManualImagePreview(existingPreview);
    setManualCoverImageUrl(toAbsoluteMediaUrl(incomingEditBook.coverImageUrl) || "");
  }, [location.state, PLACEHOLDER_COVER]);

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

  const handleManualImageSelection = async (file) => {
    if (!file) {
      setManualImageFile(null);
      setManualImagePreview("");
      setManualCoverImageUrl("");
      return;
    }

    setManualImageFile(file);
    setManualCoverImageUrl("");
    const previewData = await fileToDataUrl(file);
    setManualImagePreview(previewData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isManualSubmitting) {
      return;
    }

    if (!manualTitle.trim()) {
      showToast("Title is required.", "warning");
      return;
    }

    try {
      setIsManualSubmitting(true);
      const savedBooks = JSON.parse(localStorage.getItem("userBooks")) || [];

      if (!isEditingExistingBook && hasDuplicateInList(savedBooks, manualTitle, manualAuthor)) {
        showToast("This book is already in your collection.", "warning");
        return;
      }

      let imageDataUrl = manualImagePreview || manualCoverImageUrl || PLACEHOLDER_COVER;
      if (manualImageFile && !manualImagePreview) {
        imageDataUrl = await fileToDataUrl(manualImageFile);
      }

      let backendBook = null;
      let uploadedBook = null;
      const token = localStorage.getItem("token");
      const backendTargetBookId = editingBookRef?.bookId || null;

      if (isEditingExistingBook) {
        if (token && backendTargetBookId) {
          backendBook = await updateBook(backendTargetBookId, {
            title: manualTitle,
            author: manualAuthor || null,
            status: manualStatus,
            description: manualDescription || null,
            coverImageUrl: manualImageFile ? null : manualCoverImageUrl || null
          });

          if (manualImageFile) {
            uploadedBook = await uploadBookAttachment(backendTargetBookId, manualImageFile);
          }
        }
      } else if (token) {
        backendBook = await createBook({
          title: manualTitle,
          author: manualAuthor || null,
          status: manualStatus,
          description: manualDescription || null,
          rating: null,
          coverImageUrl: manualImageFile ? null : manualCoverImageUrl || null
        });

        if (manualImageFile && backendBook?.bookId) {
          uploadedBook = await uploadBookAttachment(backendBook.bookId, manualImageFile);
        }
      }

      const now = new Date().toISOString().split("T")[0];
      const latestBookData = uploadedBook || backendBook;
      const persistedServerImage = toAbsoluteMediaUrl(latestBookData?.attachmentUrl || latestBookData?.coverImageUrl) || null;
      const persistedImage = token
        ? persistedServerImage || imageDataUrl || PLACEHOLDER_COVER
        : imageDataUrl || persistedServerImage || PLACEHOLDER_COVER;

      if (isEditingExistingBook) {
        const updatedBooks = savedBooks.map((existingBook) => {
          const sameId = String(existingBook.id) === String(editingBookRef.id);
          const sameBookId =
            editingBookRef.bookId && String(existingBook.bookId) === String(editingBookRef.bookId);

          if (!sameId && !sameBookId) {
            return existingBook;
          }

          return {
            ...existingBook,
            title: manualTitle,
            authors: manualAuthor ? [manualAuthor] : [],
            author: manualAuthor || null,
            description: manualDescription || "No description available",
            status: manualStatus,
            image: persistedImage,
            dateUpdated: now,
            bookId: latestBookData?.bookId || existingBook.bookId || editingBookRef.bookId || null,
            attachmentUrl: toAbsoluteMediaUrl(
              latestBookData?.attachmentUrl ||
                existingBook.attachmentUrl ||
                (latestBookData?.bookId ? `/api/books/${latestBookData.bookId}/attachment` : null)
            ),
            coverImageUrl: toAbsoluteMediaUrl(latestBookData?.coverImageUrl) || existingBook.coverImageUrl || null,
            attachmentOriginalName: latestBookData?.attachmentOriginalName || existingBook.attachmentOriginalName || null,
            attachmentContentType: latestBookData?.attachmentContentType || existingBook.attachmentContentType || null,
            sourceType: existingBook.sourceType || editingBookRef.sourceType || "manual"
          };
        });

        localStorage.setItem("userBooks", JSON.stringify(updatedBooks));
      } else {
        const newBook = {
          id: Date.now(),
          bookId: latestBookData?.bookId || null,
          title: manualTitle,
          image: persistedImage,
          authors: manualAuthor ? [manualAuthor] : [],
          description: manualDescription || "No description available",
          favorite: false,
          rating: 0,
          status: manualStatus,
          dateAdded: now,
          dateUpdated: now,
          attachmentUrl: toAbsoluteMediaUrl(latestBookData?.attachmentUrl || (latestBookData?.bookId ? `/api/books/${latestBookData.bookId}/attachment` : null)),
          coverImageUrl: toAbsoluteMediaUrl(latestBookData?.coverImageUrl) || null,
          attachmentOriginalName: latestBookData?.attachmentOriginalName || null,
          attachmentContentType: latestBookData?.attachmentContentType || null,
          sourceType: prefilledFromSearch ? "search" : "manual"
        };

        savedBooks.push(newBook);
        localStorage.setItem("userBooks", JSON.stringify(savedBooks));
      }

      setManualTitle("");
      setManualAuthor("");
      setManualStatus("To Read");
      setManualDescription("");
      setManualImageFile(null);
      setManualImagePreview("");
      setManualCoverImageUrl("");

      showToast(
        isEditingExistingBook ? "Book details updated." : "The book has been added.",
        "success",
        3800,
        {
          title: manualTitle,
          image: persistedImage
        }
      );

      if (isEditingExistingBook) {
        const detailsTarget = editingBookRef?.id || editingBookRef?.bookId;
        if (detailsTarget) {
          setTimeout(() => {
            navigate(`/books/${detailsTarget}`);
          }, 450);
        }
      } else if (prefilledFromSearch) {
        setActiveTab("search");
        setPrefilledFromSearch(false);
      }
    } catch (submitError) {
      console.error("Manual add error:", submitError);
      showToast(submitError.response?.data?.message || "Failed to add book. Please try again.", "error");
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

  const handlePrefillFromSearch = (book) => {
    setPrefilledFromSearch(true);
    setManualTitle(book.title || "");
    setManualAuthor(book.authors && book.authors.length > 0 ? book.authors.join(", ") : "");
    setManualStatus("To Read");
    setManualDescription(book.description || "");
    setManualImageFile(null);
    setManualCoverImageUrl(book.thumbnail || "");
    setManualImagePreview(book.thumbnail || "");
    setActiveTab("manual");
  };

  return (
    <div className="dashboard-container">
      <Sidebar activePage="books" onLogout={onLogout} />

      <div className="add-book-page">

        {toast && (
          <div className={`add-book-toast ${toast.type}`} role="status" aria-live="polite">
            {toast.image ? (
              <img
                src={toast.image}
                alt={toast.title || "Added book"}
                className="add-book-toast-cover"
              />
            ) : null}
            <div className="add-book-toast-content">
              {toast.title ? <h4>{toast.title}</h4> : null}
              <p>{toast.message}</p>
            </div>
            <button
              type="button"
              className="add-book-toast-close"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        )}

        <h1>{isEditingExistingBook ? "Edit Book" : "Add Book"}</h1>

        {/* Tabs */}
        {!isEditingExistingBook && (
        <div className="tab-buttons">
         

          <button
            className={activeTab === "search" ? "tab active" : "tab"}
            onClick={() => setActiveTab("search")}
          >
            Search Books
          </button>

           <button
            className={activeTab === "manual" ? "tab active" : "tab"}
            onClick={() => {
              setPrefilledFromSearch(false);
              setActiveTab("manual");
            }}
          >
            Manual Entry
          </button>
        </div>
        )}

       
        {/* Search Books */}
        {!isEditingExistingBook && activeTab === "search" && (
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
                        onClick={() => handlePrefillFromSearch(book)}
                        style={{ cursor: "pointer" }}
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
                      <span className="manual-upload-subtext">Add a file if you want a custom cover</span>
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
                {isManualSubmitting ? (isEditingExistingBook ? "Saving..." : "Adding...") : (isEditingExistingBook ? "Save Changes" : "Add Book")}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default AddBook;