import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import PageLoader from "./PageLoader";
import "../css/BookDetails.css";
import book2Icon from "../assets/book2.png";
import api from "../api/axios";
import { deleteBook, getBookById, updateBook } from "../services/BookService";
import { toAbsoluteMediaUrl } from "../utils/mediaUrl";

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
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteSortOrder, setNoteSortOrder] = useState("newest");
  const [showNoteMenu, setShowNoteMenu] = useState(null);
  const [notePendingDeleteId, setNotePendingDeleteId] = useState(null);
  const [showDeleteNoteModal, setShowDeleteNoteModal] = useState(false);
  const [showReadStartModal, setShowReadStartModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState("");
  const [deleteCodeInput, setDeleteCodeInput] = useState("");
  const [deleteCodeError, setDeleteCodeError] = useState("");
  const [isDeletingBook, setIsDeletingBook] = useState(false);
  const [actionToast, setActionToast] = useState(null);
  const [selectedStartDate, setSelectedStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [attachmentActionLoading, setAttachmentActionLoading] = useState(false);
  const [coverObjectUrl, setCoverObjectUrl] = useState(null);
  const reviewTextareaRef = useRef(null);
  const toastTimerRef = useRef(null);
  const postDeleteNavigateTimerRef = useRef(null);

  const showActionToast = (message, type = "success", duration = 1200, options = {}) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setActionToast({ message, type, ...options });
    toastTimerRef.current = setTimeout(() => {
      setActionToast(null);
    }, duration);
  };

  // Format date from YYYY-MM-DD to "Month DD, YYYY"
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  };

  // Get current date-time in local timezone with offset
  const getLocalDateTime = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now - offsetMs);
    return localDate.toISOString();
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
        image: toAbsoluteMediaUrl(backendBook.attachmentUrl || backendBook.coverImageUrl) || PLACEHOLDER_COVER,
        status: backendBook.status || "To Read",
        rating: backendBook.rating || 0,
        review: backendBook.review || fromLocal?.review || "",
        notes: Array.isArray(backendBook.notes)
          ? backendBook.notes.map((note) => ({
              id: note.id || Date.now() + Math.random(),
              text: note.text || "",
              date: note.date || new Date().toISOString(),
              isFavorited: Boolean(note.isFavorited)
            }))
          : (fromLocal?.notes || []),
        dateAdded: backendBook.createdAt ? new Date(backendBook.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        dateUpdated: backendBook.updatedAt ? new Date(backendBook.updatedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        dateStarted: backendBook.dateStarted || fromLocal?.dateStarted || null,
        dateCompleted: backendBook.dateCompleted || fromLocal?.dateCompleted || null,
        coverImageUrl: toAbsoluteMediaUrl(backendBook.coverImageUrl) || null,
        attachmentUrl: toAbsoluteMediaUrl(backendBook.attachmentUrl) || null,
        attachmentOriginalName: backendBook.attachmentOriginalName || null,
        attachmentContentType: backendBook.attachmentContentType || null,
        sourceType: fromLocal?.sourceType || (backendBook.attachmentOriginalName ? "manual" : "search")
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

      fallbackBook.image = toAbsoluteMediaUrl(fallbackBook.image) || PLACEHOLDER_COVER;
      fallbackBook.coverImageUrl = toAbsoluteMediaUrl(fallbackBook.coverImageUrl) || null;
      fallbackBook.attachmentUrl = toAbsoluteMediaUrl(fallbackBook.attachmentUrl) || null;
      fallbackBook.sourceType = fallbackBook.sourceType || (fallbackBook.attachmentOriginalName ? "manual" : "search");

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

  useEffect(() => {
    let objectUrl = null;

    const loadCoverFromAttachment = async () => {
      if (!book?.bookId || !book?.attachmentUrl) {
        setCoverObjectUrl(null);
        return;
      }

      try {
        const response = await api.get(`/books/${book.bookId}/attachment`, {
          responseType: "blob"
        });
        objectUrl = URL.createObjectURL(response.data);
        setCoverObjectUrl(objectUrl);
      } catch (error) {
        console.error("Failed to load cover from attachment:", error);
        setCoverObjectUrl(null);
      }
    };

    loadCoverFromAttachment();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [book?.bookId, book?.attachmentUrl]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (postDeleteNavigateTimerRef.current) {
        clearTimeout(postDeleteNavigateTimerRef.current);
      }
    };
  }, []);

  const handleDeleteSuccessOk = () => {
    if (!actionToast?.route) {
      setActionToast(null);
      return;
    }

    if (postDeleteNavigateTimerRef.current) {
      clearTimeout(postDeleteNavigateTimerRef.current);
    }
    setActionToast(null);
    navigate(actionToast.route);
  };

  const persistNotesToBackend = async (nextNotes) => {
    const token = localStorage.getItem("token");
    const backendBookId = book?.bookId || Number(id);
    if (!token || !backendBookId) {
      return;
    }

    await updateBook(backendBookId, {
      notes: nextNotes.map((note) => ({
        id: typeof note.id === "number" ? note.id : null,
        text: note.text,
        date: note.date,
        isFavorited: Boolean(note.isFavorited)
      }))
    });
  };

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
    let statusChangeOverrides = {};

    // Only set dateStarted/dateCompleted if status is actually changing
    if (tempStatus !== status) {
      if (tempStatus === "Reading" && status !== "Reading") {
        // Only set dateStarted if not already set
        if (!book.dateStarted) {
          statusChangeOverrides.dateStarted = today;
        }
      }
      if (tempStatus === "Completed" && status !== "Completed") {
        // Only set dateCompleted if not already set
        if (!book.dateCompleted) {
          statusChangeOverrides.dateCompleted = today;
        }
        // Also set dateStarted if not set (for legacy books)
        if (!book.dateStarted) {
          statusChangeOverrides.dateStarted = today;
        }
      }
    }

    try {
      const token = localStorage.getItem("token");
      const backendBookId = book?.bookId || Number(id);

      // Normalize status for backend (ensure exact string)
      let normalizedStatus = tempStatus;
      if (tempStatus.toLowerCase() === "on hold" || tempStatus === "On Hold") {
        normalizedStatus = "On Hold"; // Change this if your backend expects a different value
      }

      // Debug log
      console.log("Updating book with ID:", backendBookId, "Status:", normalizedStatus);

      // Call backend API if token exists and backendBookId is a valid number
      if (token && backendBookId && typeof backendBookId === 'number' && !isNaN(backendBookId)) {
        await updateBook(backendBookId, {
          status: normalizedStatus,
          rating: tempRating,
          review,
          ...statusChangeOverrides
        });
      } else {
        console.error("Invalid backendBookId or missing token", backendBookId, token);
      }

      setStatus(normalizedStatus);
      setRating(tempRating);
      saveBookChanges({ status: normalizedStatus, rating: tempRating, review, ...statusChangeOverrides });

      // Update local book state with new dates
      setBook(prev => ({
        ...prev,
        status: normalizedStatus,
        rating: tempRating,
        review,
        ...statusChangeOverrides
      }));

      showActionToast("Book updated successfully.", "success", 1800);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating book:", error);
      showActionToast("Failed to update book. Please try again.", "error", 2400);
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
      showActionToast("Book moved to Reading. Happy re-reading!", "success", 2200);
    } catch (error) {
      console.error("Error moving book to reading:", error);
      showActionToast("Failed to update book. Please try again.", "error", 2400);
    }
  };

  const handleReadStart = () => {
    setSelectedStartDate(book?.dateStarted || new Date().toISOString().split("T")[0]);
    setShowReadStartModal(true);
  };

  const handleConfirmReadStart = async () => {
    try {
      const token = localStorage.getItem("token");
      const backendBookId = book?.bookId || Number(id);
      // Use the selectedStartDate for both dateStarted and dateUpdated
      if (token && backendBookId) {
        await updateBook(backendBookId, {
          status: "Reading",
          dateStarted: selectedStartDate,
          dateUpdated: selectedStartDate
        });
      }
      setStatus("Reading");
      saveBookChanges({ status: "Reading", dateStarted: selectedStartDate, dateUpdated: selectedStartDate });
      setBook((prev) => ({ ...prev, status: "Reading", dateStarted: selectedStartDate, dateUpdated: selectedStartDate }));
      setShowReadStartModal(false);
      showActionToast("Happy reading! Book moved to Reading.", "success", 2200);
    } catch (error) {
      console.error("Error starting to read:", error);
      showActionToast("Failed to update book. Please try again.", "error", 2400);
    }
  };

  const handleCloseReadStartModal = () => {
    setShowReadStartModal(false);
  };

  const handleNotesButton = () => {
    if (!canManageNotes) {
      showActionToast("Only Reading and Completed books can have notes.", "warning", 2200);
      return;
    }
    setEditingNoteId(null);
    setCurrentNoteText("");
    setShowNotesModal(true);
  };

  const handleEditNote = (note) => {
    if (!canManageNotes) {
      showActionToast("Only Reading and Completed books can have notes.", "warning", 2200);
      return;
    }

    setShowNoteMenu(null);
    setEditingNoteId(note.id);
    setCurrentNoteText(note.text || "");
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (!canManageNotes) {
      showActionToast("Only Reading and Completed books can have notes.", "warning", 2200);
      return;
    }

    if (!currentNoteText.trim()) {
      showActionToast("Note cannot be empty.", "error", 2200);
      return;
    }

    const updatedNotes = editingNoteId
      ? notes.map((note) =>
          note.id === editingNoteId
            ? { ...note, text: currentNoteText.trim() }
            : note
        )
      : [
          ...notes,
          {
            id: Date.now(),
            text: currentNoteText.trim(),
            date: getLocalDateTime(),
            isFavorited: false
          }
        ];
    try {
      await persistNotesToBackend(updatedNotes);
      setNotes(updatedNotes);
      saveBookChanges({ notes: updatedNotes });
      setBook((prev) => ({ ...prev, notes: updatedNotes }));
      setEditingNoteId(null);
      setCurrentNoteText("");
      setShowNotesModal(false);
      showActionToast(editingNoteId ? "Note updated successfully." : "Note added successfully.", "success", 1800);
    } catch (error) {
      console.error("Failed to save note:", error);
      showActionToast(editingNoteId ? "Failed to update note. Please try again." : "Failed to save note. Please try again.", "error", 2400);
    }
  };

  const handleCloseNotesModal = () => {
    setEditingNoteId(null);
    setCurrentNoteText("");
    setShowNotesModal(false);
  };

  const handleCopyNote = async (noteText) => {
    try {
      await navigator.clipboard.writeText(noteText);
      showActionToast("Note copied to clipboard.", "success", 1700);
    } catch (clipboardError) {
      console.error("Failed to copy note:", clipboardError);
      showActionToast("Unable to copy note.", "error", 2200);
    }
  };

  const handleDeleteNote = (noteId) => {
    if (!canManageNotes) {
      showActionToast("Only Reading and Completed books can have notes.", "warning", 2200);
      return;
    }
    setShowNoteMenu(null);
    setNotePendingDeleteId(noteId);
    setShowDeleteNoteModal(true);
  };

  const closeDeleteNoteModal = () => {
    setShowDeleteNoteModal(false);
    setNotePendingDeleteId(null);
  };

  const confirmDeleteNote = async () => {
    if (!canManageNotes) {
      closeDeleteNoteModal();
      showActionToast("Only Reading and Completed books can have notes.", "warning", 2200);
      return;
    }

    if (!notePendingDeleteId) {
      closeDeleteNoteModal();
      return;
    }

    const updatedNotes = notes.filter((note) => note.id !== notePendingDeleteId);
    try {
      await persistNotesToBackend(updatedNotes);
      setNotes(updatedNotes);
      saveBookChanges({ notes: updatedNotes });
      setBook((prev) => ({ ...prev, notes: updatedNotes }));
      closeDeleteNoteModal();
      showActionToast("Note deleted successfully.", "success", 1800);
    } catch (error) {
      console.error("Failed to delete note:", error);
      showActionToast("Failed to delete note. Please try again.", "error", 2400);
    }
  };

  const handleToggleFavorite = async (noteId) => {
    if (!canManageNotes) {
      showActionToast("Only Reading and Completed books can have notes.", "warning", 2200);
      return;
    }

    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, isFavorited: !note.isFavorited } : note
    );
    try {
      await persistNotesToBackend(updatedNotes);
      setNotes(updatedNotes);
      saveBookChanges({ notes: updatedNotes });
      setBook((prev) => ({ ...prev, notes: updatedNotes }));
    } catch (error) {
      console.error("Failed to update note favorite:", error);
      showActionToast("Failed to update note. Please try again.", "error", 2400);
    }
  };

  const handleDelete = () => {
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    setDeleteConfirmCode(generatedCode);
    setDeleteCodeInput("");
    setDeleteCodeError("");
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeletingBook) {
      return;
    }
    setShowDeleteModal(false);
    setDeleteCodeInput("");
    setDeleteCodeError("");
  };

  const runDelete = async () => {
    try {
      setIsDeletingBook(true);
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

      setShowDeleteModal(false);
      const redirectRoute = status === "To Read" ? "/to-read" : status === "Reading" ? "/reading" : "/books";
      showActionToast("Book deleted.", "success", 2400, { showOk: true, route: redirectRoute });

      postDeleteNavigateTimerRef.current = setTimeout(() => {
        navigate(redirectRoute);
      }, 2400);
    } catch (deleteError) {
      console.error("Delete error:", deleteError);
      setDeleteCodeError(deleteError.response?.data?.message || "Failed to delete this book.");
    } finally {
      setIsDeletingBook(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteCodeInput.trim() !== deleteConfirmCode) {
      setDeleteCodeError("Code does not match. Please enter the number exactly.");
      return;
    }

    setDeleteCodeError("");
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
      showActionToast("Unable to open attachment.", "error", 2200);
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
      showActionToast("Unable to download attachment.", "error", 2200);
    } finally {
      setAttachmentActionLoading(false);
    }
  };

  const sortedNotes = [...notes]
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  if (noteSortOrder === "newest") {
    sortedNotes.reverse();
  }

  if (!book) {
    return (
      <div className="dashboard-container">
        <Sidebar activePage="books" onLogout={onLogout} />
        <div className="book-details-page">
          <PageLoader message="Loading book details..." />
        </div>
      </div>
    );
  }

  // Handle both book.author and book.authors
  const authorName = book.author || (book.authors && book.authors.length > 0 ? book.authors.join(", ") : "Unknown Author");
  const descriptionText = book.description || "No description available";
  const shouldShowDescriptionToggle = descriptionText.length > 280;
  const canManageNotes = status === "Reading" || status === "Completed";
  const hasAttachment = Boolean(
    book?.bookId &&
    (book?.attachmentUrl || book?.attachmentOriginalName) &&
    book?.sourceType !== "manual"
  );
  const readingProgressStartDate = book?.dateAdded || book?.dateStarted || null;

  return (
    <div className="dashboard-container">
      <Sidebar activePage="books" onLogout={onLogout} />

      <div className="book-details-page">

        {actionToast && (
          <div className={`book-action-toast ${actionToast.type}`} role="status" aria-live="polite">
            <span>{actionToast.message}</span>
            {actionToast.showOk ? (
              <button type="button" className="book-action-toast-ok" onClick={handleDeleteSuccessOk}>
                OK
              </button>
            ) : null}
          </div>
        )}

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
                  <button
                    onClick={() => {
                      if (status === "To Read") {
                        navigate("/add-book", {
                          state: {
                            editBook: {
                              id: book.id,
                              bookId: book.bookId,
                              title: book.title,
                              author: book.author || (book.authors && book.authors.length > 0 ? book.authors.join(", ") : ""),
                              authors: book.authors,
                              description: book.description,
                              status: book.status,
                              image: coverObjectUrl || book.image,
                              coverImageUrl: book.coverImageUrl,
                              attachmentUrl: book.attachmentUrl,
                              sourceType: book.sourceType || "manual"
                            }
                          }
                        });
                      } else {
                        setIsEditMode(true);
                      }
                      setShowMenu(false);
                    }}
                  >
                    Edit this book
                  </button>
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
                src={
                  coverObjectUrl ||
                  (book.image && book.image.includes('books.google.com/books/content')
                    ? `http://localhost:8080/api/proxy-image?url=${encodeURIComponent(book.image)}`
                    : book.image) ||
                  PLACEHOLDER_COVER
                }
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
                {canManageNotes && (
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
                    From {readingProgressStartDate ? formatDate(readingProgressStartDate) : "Start date"}
                  </span>
                </div>
                <div className="reading-days">
                  Day {readingProgressStartDate ? calculateDaysReading(readingProgressStartDate) : 0}
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

            {/* Notes Section - Only show if notes exist and not in edit mode */}
            {notes.length > 0 && !isEditMode && (
              <div className="notes-section">
                <div className="notes-main-header">
                  <h3>Notes</h3>
                  <select
                    className="notes-sort-select"
                    value={noteSortOrder}
                    onChange={(event) => setNoteSortOrder(event.target.value)}
                    aria-label="Sort notes"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
                <div className="notes-divider"></div>
                <div className="notes-count">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</div>
                
                {sortedNotes.map((note) => (
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
                      {canManageNotes ? (
                        <div className="note-menu-container">
                          <button className="note-menu-btn" onClick={() => setShowNoteMenu(showNoteMenu === note.id ? null : note.id)}>⋯</button>
                          {showNoteMenu === note.id && (
                            <div className="note-menu-dropdown">
                              <button onClick={() => handleEditNote(note)}>Edit this note</button>
                              <button onClick={() => handleDeleteNote(note.id)}>Delete this note</button>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <div className="note-content">
                      <p>{note.text}</p>
                    </div>
                    {canManageNotes ? (
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
                    ) : null}
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
      {showNotesModal && canManageNotes && (
        <div className="modal-overlay" onClick={handleCloseNotesModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingNoteId ? "Edit Note" : "Add Notes"}</h2>
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
                {editingNoteId ? "Save Changes" : "Save Notes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="delete-modal-overlay" onClick={handleCloseDeleteModal}>
          <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Sure to delete this book?</h2>
            <p className="delete-modal-warning">
              Not only the book but also the notes it contains will be deleted.
              <br />
              Are you sure you want to delete it?
            </p>
            <p className="delete-modal-code-label">Enter this number to confirm:</p>
            <div className="delete-modal-code">{deleteConfirmCode}</div>

            <label htmlFor="delete-code-input" className="delete-modal-input-label">
              Please enter the number above.
            </label>
            <input
              id="delete-code-input"
              type="text"
              inputMode="numeric"
              value={deleteCodeInput}
              onChange={(e) => {
                setDeleteCodeInput(e.target.value.replace(/[^0-9]/g, ""));
                if (deleteCodeError) {
                  setDeleteCodeError("");
                }
              }}
              className="delete-modal-input"
              placeholder="Enter code"
              maxLength={6}
              disabled={isDeletingBook}
            />

            {deleteCodeError ? <p className="delete-modal-error">{deleteCodeError}</p> : null}

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel-btn"
                onClick={handleCloseDeleteModal}
                disabled={isDeletingBook}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={isDeletingBook}
              >
                {isDeletingBook ? "Deleting..." : "Delete it."}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteNoteModal && (
        <div className="delete-modal-overlay" onClick={closeDeleteNoteModal}>
          <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete this note?</h2>
            <p className="delete-modal-warning">
              This note will be removed permanently.
            </p>
            <div className="delete-modal-actions">
              <button type="button" className="delete-cancel-btn" onClick={closeDeleteNoteModal}>
                Cancel
              </button>
              <button type="button" className="delete-confirm-btn" onClick={confirmDeleteNote}>
                Delete note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetails;