import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../css/BookDetails.css";
import book2Icon from "../assets/book2.png";
import api from "../api/axios";
import { deleteBook, getBookById, updateBook } from "../services/BookService";

const BookDetails = ({ onLogout }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const PLACEHOLDER_COVER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><rect width='100%25' height='100%25' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='20'>No Cover</text></svg>";

  const [status, setStatus] = useState("Reading");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [book, setBook] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempStatus, setTempStatus] = useState("Reading");
  const [tempRating, setTempRating] = useState(0);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState([]);
  const [currentNoteText, setCurrentNoteText] = useState("");
  const [showNoteMenu, setShowNoteMenu] = useState(null);
  const [showReadStartModal, setShowReadStartModal] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [attachmentActionLoading, setAttachmentActionLoading] = useState(false);
  const reviewTextareaRef = useRef(null);

  // Format date from YYYY-MM-DD to "Month DD, YYYY"
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  };

  // Calculate days between start date and today
  const calculateDaysReading = (startDate) => {
    if (!startDate) return 1;
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  useEffect(() => {
    const loadBook = async () => {
      const savedBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
      const fromLocal = savedBooks.find((b) => String(b.id) === String(id) || String(b.bookId) === String(id));

      const mapBackendBook = (backendBook) => ({
        id: backendBook.bookId,
        bookId: backendBook.bookId,
        title: backendBook.title,
        author: backendBook.author,
        authors: backendBook.author ? [backendBook.author] : [],
        description: backendBook.description || "No description available",
        image: backendBook.attachmentUrl || backendBook.coverImageUrl || PLACEHOLDER_COVER,
        status: backendBook.status || "To Read",
        rating: backendBook.rating || 0,
        review: fromLocal?.review || "",
        notes: fromLocal?.notes || [],
        dateAdded: backendBook.createdAt ? new Date(backendBook.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        dateUpdated: backendBook.updatedAt ? new Date(backendBook.updatedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        dateStarted: fromLocal?.dateStarted || null,
        dateCompleted: fromLocal?.dateCompleted || null,
        coverImageUrl: backendBook.coverImageUrl || null,
        attachmentUrl: backendBook.attachmentUrl || null,
        attachmentOriginalName: backendBook.attachmentOriginalName || null,
        attachmentContentType: backendBook.attachmentContentType || null
      });

      try {
        const token = localStorage.getItem("token");
        if (token) {
          const backendBook = await getBookById(id);
          const mappedBook = mapBackendBook(backendBook);
          setBook(mappedBook);
          setStatus(mappedBook.status || "To Read");
          setRating(mappedBook.rating || 0);
          setReview(mappedBook.review || "");
          setNotes(mappedBook.notes || []);
          setTempStatus(mappedBook.status || "To Read");
          setTempRating(mappedBook.rating || 0);
          setIsDescriptionExpanded(false);
          return;
        }
      } catch (error) {
        console.error("Error loading book details from backend:", error);
      }

      const fallbackBook = fromLocal || {
        id,
        bookId: Number(id),
        title: "Unknown Book",
        authors: [],
        description: "No description available",
        image: PLACEHOLDER_COVER,
        status: "To Read",
        rating: 0,
        review: "",
        notes: []
      };

      setBook(fallbackBook);
      setStatus(fallbackBook.status || "To Read");
      setRating(fallbackBook.rating || 0);
      setReview(fallbackBook.review || "");
      setNotes(Array.isArray(fallbackBook.notes) ? fallbackBook.notes : []);
      setTempStatus(fallbackBook.status || "To Read");
      setTempRating(fallbackBook.rating || 0);
      setIsDescriptionExpanded(false);
    };

    loadBook();
  }, [id]);

  // Close note menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNoteMenu !== null && !event.target.closest('.note-menu-container')) {
        setShowNoteMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNoteMenu]);

  const saveBookChanges = (overrides = {}) => {
    const savedBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
    const updated = savedBooks.map((b) => {
      if (String(b.id) === String(id) || String(b.bookId) === String(id)) {
        return {
          ...b,
          status,
          rating,
          review,
          dateUpdated: new Date().toISOString().split("T")[0],
          ...overrides,
        };
      }
      return b;
    });

    localStorage.setItem("userBooks", JSON.stringify(updated));
  };

  const handleUpdate = async () => {
    const today = new Date().toISOString().split("T")[0];
    const statusChangeOverrides = {};
    
    // If status is changing to Reading, set dateStarted
    if (tempStatus === "Reading" && status !== "Reading") {
      statusChangeOverrides.dateStarted = today;
    }
    
    // If status is changing to Completed, set dateCompleted
    if (tempStatus === "Completed" && status !== "Completed") {
      statusChangeOverrides.dateCompleted = today;
    }
    
    // Ensure completed books have dates (fallback for existing books without dates)
    if (tempStatus === "Completed" || status === "Completed") {
      if (!book.dateStarted) {
        statusChangeOverrides.dateStarted = book.dateUpdated || today;
      }
      if (!book.dateCompleted) {
        statusChangeOverrides.dateCompleted = today;
      }
    }
    
    try {
      const token = localStorage.getItem("token");
      const backendBookId = book?.bookId || Number(id);
      
      // Call backend API if token exists
      if (token && backendBookId) {
        await updateBook(backendBookId, {
          status: tempStatus,
          rating: tempRating,
          ...statusChangeOverrides
        });
      }
      
      setStatus(tempStatus);
      setRating(tempRating);
      saveBookChanges({ status: tempStatus, rating: tempRating, ...statusChangeOverrides });
      
      // Update local book state with new dates
      setBook(prev => ({
        ...prev,
        status: tempStatus,
        rating: tempRating,
        ...statusChangeOverrides
      }));
      
      alert("Book updated successfully!");
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating book:", error);
      alert("Failed to update book. Please try again.");
    }
  };

  const handleReadAgain = async () => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const token = localStorage.getItem("token");
      const backendBookId = book?.bookId || Number(id);
      
      // Call backend API if token exists
      if (token && backendBookId) {
        await updateBook(backendBookId, {
          status: "Reading",
          dateUpdated: today
        });
      }
      
      setStatus("Reading");
      saveBookChanges({ status: "Reading", dateUpdated: today });
      setBook((prev) => ({ ...prev, status: "Reading", dateUpdated: today }));
      alert("Book moved to Reading. Happy re-reading!");
    } catch (error) {
      console.error("Error moving book to reading:", error);
      alert("Failed to update book. Please try again.");
    }
  };

  const handleReadStart = () => {
    setShowReadStartModal(true);
  };

  const handleConfirmReadStart = async () => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const token = localStorage.getItem("token");
      const backendBookId = book?.bookId || Number(id);
      
      // Call backend API if token exists
      if (token && backendBookId) {
        await updateBook(backendBookId, {
          status: "Reading",
          dateStarted: selectedStartDate,
          dateUpdated: today
        });
      }
      
      setStatus("Reading");
      saveBookChanges({ status: "Reading", dateStarted: selectedStartDate, dateUpdated: today });
      setBook((prev) => ({ ...prev, status: "Reading", dateStarted: selectedStartDate, dateUpdated: today }));
      setShowReadStartModal(false);
      alert("Happy reading! Book moved to Reading.");
    } catch (error) {
      console.error("Error starting to read:", error);
      alert("Failed to update book. Please try again.");
    }
  };

  const handleCloseReadStartModal = () => {
    setShowReadStartModal(false);
  };

  const handleNotesButton = () => {
    setCurrentNoteText("");
    setShowNotesModal(true);
  };

  const handleSaveNotes = () => {
    if (!currentNoteText.trim()) {
      alert("Note cannot be empty!");
      return;
    }

    const newNote = {
      id: Date.now(),
      text: currentNoteText,
      date: new Date().toISOString(),
      isFavorited: false
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    saveBookChanges({ notes: updatedNotes });
    setBook((prev) => ({ ...prev, notes: updatedNotes }));
    setCurrentNoteText("");
    setShowNotesModal(false);
    alert("Note added successfully!");
  };

  const handleCloseNotesModal = () => {
    setCurrentNoteText("");
    setShowNotesModal(false);
  };

  const handleCopyNote = (noteText) => {
    navigator.clipboard.writeText(noteText);
    alert("Note copied to clipboard!");
  };

  const handleDeleteNote = (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      saveBookChanges({ notes: updatedNotes });
      setBook((prev) => ({ ...prev, notes: updatedNotes }));
      setShowNoteMenu(null);
      alert("Note deleted successfully!");
    }
  };

  const handleToggleFavorite = (noteId) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, isFavorited: !note.isFavorited } : note
    );
    setNotes(updatedNotes);
    saveBookChanges({ notes: updatedNotes });
    setBook((prev) => ({ ...prev, notes: updatedNotes }));
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this book?")) {
      return;
    }

    const runDelete = async () => {
      try {
        const token = localStorage.getItem("token");
        const backendBookId = book?.bookId || Number(id);

        if (token && backendBookId) {
          await deleteBook(backendBookId);
        }

        // Keep local cache in sync whether online or offline.
        const savedBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
        const backendIdText = String(backendBookId ?? "");
        const routeIdText = String(id);
        const filtered = savedBooks.filter((b) => {
          const localIdText = String(b.id ?? "");
          const localBookIdText = String(b.bookId ?? "");

          return (
            localIdText !== routeIdText &&
            localBookIdText !== routeIdText &&
            localIdText !== backendIdText &&
            localBookIdText !== backendIdText
          );
        });
        localStorage.setItem("userBooks", JSON.stringify(filtered));

        alert("Book deleted!");

        if (status === "To Read") {
          navigate("/to-read");
          return;
        }

        if (status === "Reading") {
          navigate("/reading");
          return;
        }

        navigate("/books");
      } catch (deleteError) {
        console.error("Delete error:", deleteError);
        alert(deleteError.response?.data?.message || "Failed to delete this book.");
      }
    };

    runDelete();
  };

  const fetchAttachmentBlob = async () => {
    if (!book?.bookId) {
      throw new Error("No attachment found for this book.");
    }

    const response = await api.get(`/books/${book.bookId}/attachment`, {
      responseType: "blob"
    });

    return response.data;
  };

  const handleViewAttachment = async () => {
    try {
      setAttachmentActionLoading(true);
      const attachmentBlob = await fetchAttachmentBlob();
      const objectUrl = URL.createObjectURL(attachmentBlob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (attachmentError) {
      console.error("Attachment view error:", attachmentError);
      alert("Unable to open attachment.");
    } finally {
      setAttachmentActionLoading(false);
    }
  };

  const handleDownloadAttachment = async () => {
    try {
      setAttachmentActionLoading(true);
      const attachmentBlob = await fetchAttachmentBlob();
      const objectUrl = URL.createObjectURL(attachmentBlob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = book.attachmentOriginalName || `${book.title || "book"}-attachment`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (attachmentError) {
      console.error("Attachment download error:", attachmentError);
      alert("Unable to download attachment.");
    } finally {
      setAttachmentActionLoading(false);
    }
  };

  if (!book) {
    return (
      <div className="dashboard-container">
        <Sidebar activePage="books" onLogout={onLogout} />
        <div className="book-details-page">Loading...</div>
      </div>
    );
  }

  // Handle both book.author and book.authors
  const authorName = book.author || (book.authors && book.authors.length > 0 ? book.authors.join(", ") : "Unknown Author");
  const descriptionText = book.description || "No description available";
  const shouldShowDescriptionToggle = descriptionText.length > 280;
  const hasAttachment = Boolean(book?.bookId && (book?.attachmentUrl || book?.attachmentOriginalName));

  return (
    <div className="dashboard-container">
      <Sidebar activePage="books" onLogout={onLogout} />

      <div className="book-details-page">

        <div className="book-details-top">
          <div className="back-link" onClick={() => navigate(-1)}>
            ← Back to Books
          </div>

          <div className="book-details-header">
            <button className="heart-btn">♡</button>
            <div className="menu-container">
              <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>⋯</button>
              {showMenu && (
                <div className="menu-dropdown">
                  <button onClick={() => { setIsEditMode(true); setShowMenu(false); }}>Edit this book</button>
                  <button onClick={() => { handleDelete(); setShowMenu(false); }}>Delete this book</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="book-details-card">

          <div className="book-top-section">
            <div className="book-left-section">
              <img
                src={book.image || PLACEHOLDER_COVER}
                alt={book.title}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = PLACEHOLDER_COVER;
                }}
              />
              {status === "Completed" && (
                <div className="rating-display">
                  <div className="detailed-star">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`detail-star ${star <= rating ? "filled" : ""}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="book-info">
              <h1>{book.title}</h1>
              <h3>{authorName}</h3>
              <p className={isDescriptionExpanded ? "description-text expanded" : "description-text collapsed"}>
                {descriptionText}
              </p>
              {shouldShowDescriptionToggle && (
                <button
                  type="button"
                  className="description-toggle"
                  onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                >
                  {isDescriptionExpanded ? "Show less" : "Show more"}
                </button>
              )}

              <div className="status-notes-container">
                <span className="status-badge">{status}</span>
                {(status === "Reading" || status === "Completed") && (
                  <button className="notes-button" onClick={handleNotesButton} title="Add notes">
                    <svg className="notes-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 11H15M9 15H12M13 3H8.2C7.0799 3 6.51984 3 6.09202 3.21799C5.71569 3.40973 5.40973 3.71569 5.21799 4.09202C5 4.51984 5 5.0799 5 6.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.0799 21 8.2 21H15.8C16.9201 21 17.4802 21 17.908 20.782C18.2843 20.5903 18.5903 20.2843 18.782 19.908C19 19.4802 19 18.9201 19 17.8V9M13 3L19 9M13 3V7.4C13 7.96005 13 8.24008 13.109 8.45399C13.2049 8.64215 13.3578 8.79513 13.546 8.89101C13.7599 9 14.0399 9 14.6 9H19" 
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>

              {hasAttachment && (
                <div className="attachment-actions">
                  <span className="attachment-file-name">
                    {book.attachmentOriginalName || "Attachment available"}
                  </span>
                  <div className="attachment-buttons">
                    <button
                      type="button"
                      className="attachment-btn"
                      onClick={handleViewAttachment}
                      disabled={attachmentActionLoading}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="attachment-btn"
                      onClick={handleDownloadAttachment}
                      disabled={attachmentActionLoading}
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <hr />


          <div className="update-section">
            {status === "To Read" && !isEditMode && (
              <button type="button" className="read-start-btn" onClick={handleReadStart}>
                <img src={book2Icon} alt="Book" className="read-start-icon" />
                Read Start!
              </button>
            )}

            {status === "Reading" && !isEditMode && (
              <div className="reading-progress-card">
                <div className="reading-dates">
                  <span className="reading-from">
                    From {book.dateStarted ? formatDate(book.dateStarted) : "Start date"}
                  </span>
                </div>
                <div className="reading-days">
                  Day {book.dateStarted ? calculateDaysReading(book.dateStarted) : 0}
                </div>
              </div>
            )}

            {status === "Completed" && !isEditMode && (
              <div className="completed-section">
                <div className="completed-actions">
                  <button type="button" className="completed-action-btn read-again-btn" onClick={handleReadAgain}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1 1.64-8.46"></path>
                    </svg>
                    Read Again
                  </button>
                </div>
                <div className="completed-review-card">
                  <div className="date-range">
                    {book.dateStarted && book.dateCompleted 
                      ? `${formatDate(book.dateStarted)} - ${formatDate(book.dateCompleted)}`
                      : "Start date - End date"
                    }
                  </div>
                  <p className="review-text">{review || "No review added yet..."}</p>
                </div>
              </div>
            )}

            {status !== "Completed" && isEditMode && (
              <div className="section-row">
                <div className="section-column">
                  <label>Update Status</label>

                  <select
                    value={tempStatus}
                    onChange={(e) => setTempStatus(e.target.value)}
                  >
                    <option>To Read</option>
                    <option>Reading</option>
                    <option>Completed</option>
                    <option>On Hold</option>
                  </select>
                </div>

                <div className="section-column">
                  <label>Rating</label>
                  <div className="detailed-star">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`detail-star ${star <= tempRating ? "filled" : ""}`}
                        onClick={() => setTempRating(star)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {status === "Completed" && isEditMode && (
              <div className="section-row">
                <div className="section-column" style={{flex: 1}}>
                  <label>Rating</label>
                  <div className="detailed-star">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`detail-star ${star <= tempRating ? "filled" : ""}`}
                        onClick={() => setTempRating(star)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

                  {isEditMode && (
                    <div className="review-section">
                      <label>Write a review of the book</label>
                      <textarea
                        ref={reviewTextareaRef}
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Write your review about this book..."
                        rows="4"
                      ></textarea>
                    </div>
                  )}

            {isEditMode && (
              <button className="update-btn" onClick={handleUpdate}>
                Update Status
              </button>
            )}

            {/* Notes Section - Only show if notes exist */}
            {notes.length > 0 && (
              <div className="notes-section">
                <div className="notes-main-header">
                  <h3>New notes</h3>
                </div>
                <div className="notes-divider"></div>
                <div className="notes-count">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</div>
                
                {notes.map((note) => (
                  <div key={note.id} className="note-card">
                    <div className="note-card-header">
                      <span className="note-date">
                        {new Date(note.date).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric', 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })}
                      </span>
                      <div className="note-menu-container">
                        <button className="note-menu-btn" onClick={() => setShowNoteMenu(showNoteMenu === note.id ? null : note.id)}>⋯</button>
                        {showNoteMenu === note.id && (
                          <div className="note-menu-dropdown">
                            <button onClick={() => handleDeleteNote(note.id)}>Delete this note</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="note-content">
                      <p>{note.text}</p>
                    </div>
                    <div className="note-actions">
                      <button 
                        className={`note-action-btn ${note.isFavorited ? 'favorited' : ''}`} 
                        onClick={() => handleToggleFavorite(note.id)}
                      >
                        {note.isFavorited ? '♥' : '♡'}
                      </button>
                      <button className="note-action-btn" onClick={() => handleCopyNote(note.text)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Read Start Date Picker Modal */}
      {showReadStartModal && (
        <div className="read-start-modal-overlay" onClick={handleCloseReadStartModal}>
          <div className="read-start-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Read Start!</h2>
            <div className="read-start-modal-body">
              <label>Start reading date</label>
              <input
                type="date"
                value={selectedStartDate}
                onChange={(e) => setSelectedStartDate(e.target.value)}
                className="date-input"
              />
              <span className="date-display">{new Date(selectedStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <button className="read-start-confirm-btn" onClick={handleConfirmReadStart}>
              ✓
            </button>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="modal-overlay" onClick={handleCloseNotesModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Notes</h2>
              <button className="modal-close" onClick={handleCloseNotesModal}>×</button>
            </div>
            <div className="modal-body">
              <textarea
                className="notes-textarea"
                value={currentNoteText}
                onChange={(e) => setCurrentNoteText(e.target.value)}
                placeholder="Write your notes here..."
                rows="10"
              ></textarea>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel-btn" onClick={handleCloseNotesModal}>
                Cancel
              </button>
              <button className="modal-btn save-btn" onClick={handleSaveNotes}>
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetails;