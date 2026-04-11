import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Notes.css";
import Sidebar from "./Sidebar";
import PageLoader from "./PageLoader";
import { getUserBooks, updateBook } from "../services/BookService";
import { toAbsoluteMediaUrl } from "../utils/mediaUrl";

const PLACEHOLDER_COVER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='180'><rect width='100%25' height='100%25' fill='%23e5e7eb'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='14'>No Cover</text></svg>";

const Notes = ({ onLogout }) => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cardFilter, setCardFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showNoteMenu, setShowNoteMenu] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [editingBookId, setEditingBookId] = useState(null);
  const [showDeleteNoteModal, setShowDeleteNoteModal] = useState(false);
  const [deleteNoteConfirmCode, setDeleteNoteConfirmCode] = useState("");
  const [deleteNoteCodeInput, setDeleteNoteCodeInput] = useState("");
  const [deleteNoteCodeError, setDeleteNoteCodeError] = useState("");
  const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState(null);
  const [pendingDeleteBookId, setPendingDeleteBookId] = useState(null);
  const [actionToast, setActionToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showActionToast = (message, type = "success", duration = 1200) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setActionToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setActionToast(null);
    }, duration);
  };

  const loadBooks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const backendBooks = await getUserBooks();
        const transformed = backendBooks.map((book) => ({
          id: book.bookId,
          bookId: book.bookId,
          title: book.title,
          author: book.author || "Unknown Author",
          image: toAbsoluteMediaUrl(book.coverImageUrl) || PLACEHOLDER_COVER,
          notes: Array.isArray(book.notes)
            ? book.notes.map((note, noteIndex) => ({
                id: note.id || `${book.bookId}-${noteIndex}`,
                text: note.text || "",
                date: note.date || new Date().toISOString(),
                isFavorited: Boolean(note.isFavorited)
              }))
            : []
        }));
        localStorage.setItem("userBooks", JSON.stringify(transformed));
        setBooks(transformed);
      } else {
        const savedBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
        const normalized = savedBooks.map((book) => ({
          id: book.id || book.bookId,
          bookId: book.bookId || book.id,
          title: book.title,
          author: book.author || (Array.isArray(book.authors) && book.authors.length > 0 ? book.authors[0] : "Unknown Author"),
          image: toAbsoluteMediaUrl(book.image) || PLACEHOLDER_COVER,
          notes: Array.isArray(book.notes)
            ? book.notes.map((note, noteIndex) => ({
                id: note.id || `${book.bookId || book.id}-${noteIndex}`,
                text: note.text || "",
                date: note.date || new Date().toISOString(),
                isFavorited: Boolean(note.isFavorited)
              }))
            : []
        }));
        setBooks(normalized);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
      const savedBooks = JSON.parse(localStorage.getItem("userBooks")) || [];
      setBooks(savedBooks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const flattenedNotes = useMemo(() => {
    return books.flatMap((book) =>
      (book.notes || []).map((note, index) => ({
        uid: `${book.bookId || book.id}-${note.id || index}`,
        noteId: note.id,
        bookId: book.bookId || book.id,
        title: book.title,
        author: book.author || "Unknown Author",
        image: book.image || PLACEHOLDER_COVER,
        text: note.text || "",
        date: note.date || new Date().toISOString(),
        isFavorited: Boolean(note.isFavorited)
      }))
    );
  }, [books]);

  const likedCount = useMemo(
    () => flattenedNotes.filter((note) => note.isFavorited).length,
    [flattenedNotes]
  );

  const visibleNotes = useMemo(() => {
    let list = [...flattenedNotes];

    if (cardFilter === "liked") {
      list = list.filter((note) => note.isFavorited);
    }

    if (query.trim()) {
      const normalizedQuery = query.trim().toLowerCase();
      list = list.filter((note) => {
        return (
          note.text.toLowerCase().includes(normalizedQuery) ||
          note.title.toLowerCase().includes(normalizedQuery) ||
          note.author.toLowerCase().includes(normalizedQuery)
        );
      });
    }

    list.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [cardFilter, flattenedNotes, query, sortOrder]);

  // Close note menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNoteMenu !== null && !event.target.closest('.note-menu-container')) {
        setShowNoteMenu(null);
      }
    };

    if (showNoteMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNoteMenu]);

  const formatDateTime = (dateText) => {
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const handleToggleLike = async (targetNote) => {
    const targetBook = books.find((book) => String(book.bookId || book.id) === String(targetNote.bookId));
    if (!targetBook) {
      return;
    }

    const updatedNotes = (targetBook.notes || []).map((note) => {
      if (String(note.id) === String(targetNote.noteId)) {
        return { ...note, isFavorited: !note.isFavorited };
      }
      return note;
    });

    const updatedBooks = books.map((book) => {
      if (String(book.bookId || book.id) === String(targetNote.bookId)) {
        return { ...book, notes: updatedNotes };
      }
      return book;
    });

    setBooks(updatedBooks);
    localStorage.setItem("userBooks", JSON.stringify(updatedBooks));

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await updateBook(targetBook.bookId || targetBook.id, {
          notes: updatedNotes.map((note) => ({
            id: typeof note.id === "number" ? note.id : null,
            text: note.text,
            date: note.date,
            isFavorited: Boolean(note.isFavorited)
          }))
        });
      }
    } catch (error) {
      console.error("Failed to update note like:", error);
      loadBooks();
    }
  };

  const handleCopy = async (noteText) => {
    try {
      await navigator.clipboard.writeText(noteText);
      showActionToast("Note copied to clipboard.", "success", 1700);
    } catch (error) {
      console.error("Failed to copy note:", error);
      showActionToast("Unable to copy note.", "error", 2200);
    }
  };

  const handleEditNote = (note, bookId) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.text);
    setEditingBookId(bookId);
    setShowNoteMenu(null);
  };

  const handleSaveNote = async () => {
    if (!editingNoteText.trim()) {
      return;
    }

    const targetBook = books.find((b) => String(b.bookId) === String(editingBookId));
    if (!targetBook) return;

    const updatedNotes = (targetBook.notes || []).map((note) => {
      if (String(note.id) === String(editingNoteId)) {
        return { ...note, text: editingNoteText.trim() };
      }
      return note;
    });

    const updatedBooks = books.map((book) => {
      if (String(book.bookId) === String(editingBookId)) {
        return { ...book, notes: updatedNotes };
      }
      return book;
    });

    setBooks(updatedBooks);
    localStorage.setItem("userBooks", JSON.stringify(updatedBooks));

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await updateBook(editingBookId, {
          notes: updatedNotes.map((note) => ({
            id: typeof note.id === "number" ? note.id : null,
            text: note.text,
            date: note.date,
            isFavorited: Boolean(note.isFavorited)
          }))
        });
      }
    } catch (error) {
      console.error("Failed to update note:", error);
    }

    setEditingNoteId(null);
    setEditingNoteText("");
    setEditingBookId(null);
  };

  const handleDeleteNote = (noteId, bookId) => {
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    setDeleteNoteConfirmCode(generatedCode);
    setDeleteNoteCodeInput("");
    setDeleteNoteCodeError("");
    setPendingDeleteNoteId(noteId);
    setPendingDeleteBookId(bookId);
    setShowDeleteNoteModal(true);
    setShowNoteMenu(null);
  };

  const closeDeleteNoteModal = () => {
    setShowDeleteNoteModal(false);
    setDeleteNoteCodeInput("");
    setDeleteNoteCodeError("");
  };

  const confirmDeleteNote = async () => {
    if (deleteNoteCodeInput.trim() !== deleteNoteConfirmCode) {
      setDeleteNoteCodeError("Incorrect number. Please try again.");
      return;
    }

    const targetBook = books.find((b) => String(b.bookId) === String(pendingDeleteBookId));
    if (!targetBook) {
      closeDeleteNoteModal();
      return;
    }

    const updatedNotes = (targetBook.notes || []).filter((note) => String(note.id) !== String(pendingDeleteNoteId));

    const updatedBooks = books.map((book) => {
      if (String(book.bookId) === String(pendingDeleteBookId)) {
        return { ...book, notes: updatedNotes };
      }
      return book;
    });

    setBooks(updatedBooks);
    localStorage.setItem("userBooks", JSON.stringify(updatedBooks));

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await updateBook(pendingDeleteBookId, {
          notes: updatedNotes.map((note) => ({
            id: typeof note.id === "number" ? note.id : null,
            text: note.text,
            date: note.date,
            isFavorited: Boolean(note.isFavorited)
          }))
        });
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
      showActionToast("Failed to delete note. Please try again.", "error", 2400);
    }

    closeDeleteNoteModal();
    showActionToast("Note deleted successfully.", "success", 1700);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar activePage="notes" onLogout={onLogout} />
        <main className="notes-page notes-loading">
          <PageLoader message="Loading your notes..." />
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar activePage="notes" onLogout={onLogout} />
      <main className="notes-page">
        <section className="notes-hero">
          <div>
            <h1>Notes</h1>
            <p>You have written {flattenedNotes.length} {flattenedNotes.length === 1 ? "note" : "notes"}!</p>
          </div>
          <div className="notes-search-wrap">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes, book, author"
              aria-label="Search notes"
            />
          </div>
        </section>

        <section className="notes-summary-grid">
          <button
            type="button"
            className={`notes-summary-card ${cardFilter === "all" ? "active" : ""}`}
            onClick={() => setCardFilter("all")}
          >
            <h3>All notes</h3>
            <p>{flattenedNotes.length} {flattenedNotes.length === 1 ? "note" : "notes"}</p>
          </button>

          <button
            type="button"
            className={`notes-summary-card ${cardFilter === "liked" ? "active" : ""}`}
            onClick={() => setCardFilter("liked")}
          >
            <h3>Liked notes</h3>
            <p>{likedCount} {likedCount === 1 ? "note" : "notes"}</p>
          </button>
        </section>

        {visibleNotes.length > 0 && (
          <section className="notes-toolbar">
            <span className="notes-sort-label">Sort</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-label="Sort notes by date"
            >
              <option value="newest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>
          </section>
        )}

        <section className="notes-list">
          {visibleNotes.length === 0 ? (
            <div className="notes-empty-card">
              <h3>No notes found</h3>
              <p>Try a different filter or add notes from a Reading or Completed book.</p>
            </div>
          ) : (
            visibleNotes.map((note) => (
              <article key={note.uid} className="notes-note-card">
                <div className="note-menu-container">
                  <button
                    type="button"
                    className="note-menu-btn"
                    aria-label="Open note options"
                    onClick={() => setShowNoteMenu(showNoteMenu === note.uid ? null : note.uid)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="5" r="2"></circle>
                      <circle cx="12" cy="12" r="2"></circle>
                      <circle cx="12" cy="19" r="2"></circle>
                    </svg>
                  </button>
                  {showNoteMenu === note.uid && (
                    <div className="note-menu-dropdown">
                      <button type="button" onClick={() => handleEditNote(note, note.bookId)}>Edit</button>
                      <button type="button" onClick={() => handleDeleteNote(note.id, note.bookId)}>Delete</button>
                    </div>
                  )}
                </div>

                <div className="notes-note-top">
                  <img
                    src={note.image || PLACEHOLDER_COVER}
                    alt={note.title}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = PLACEHOLDER_COVER;
                    }}
                  />
                  <div className="notes-note-meta">
                    <h3>{note.title}</h3>
                    <p className="notes-author">{note.author}</p>
                    <p className="notes-date">{formatDateTime(note.date)}</p>
                  </div>
                </div>

                {editingNoteId === note.id && editingBookId === note.bookId ? (
                  <div className="notes-edit-mode">
                    <textarea
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      className="notes-edit-textarea"
                    />
                    <div className="notes-edit-actions">
                      <button 
                        type="button" 
                        className="notes-edit-save"
                        onClick={handleSaveNote}
                      >
                        Save
                      </button>
                      <button 
                        type="button" 
                        className="notes-edit-cancel"
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingNoteText("");
                          setEditingBookId(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="notes-body">{note.text}</p>
                )}

                <div className="notes-actions-row">
                  <button
                    type="button"
                    className={`notes-icon-btn ${note.isFavorited ? "is-active" : ""}`}
                    aria-label={note.isFavorited ? "Unlike note" : "Like note"}
                    onClick={() => handleToggleLike(note)}
                  >
                    {note.isFavorited ? "♥" : "♡"}
                  </button>
                  <button
                    type="button"
                    className="notes-icon-btn"
                    aria-label="Copy note"
                    onClick={() => handleCopy(note.text)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {/* Delete Note Confirmation Modal */}
      {showDeleteNoteModal && (
        <div className="delete-modal-overlay" onClick={closeDeleteNoteModal}>
          <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete this note?</h2>
            <p className="delete-modal-warning">
              This note will be removed permanently.
              <br />
              Are you sure you want to delete it?
            </p>
            <p className="delete-modal-code-label">Enter this number to confirm:</p>
            <div className="delete-modal-code">{deleteNoteConfirmCode}</div>

            <label htmlFor="delete-note-code-input" className="delete-modal-input-label">
              Please enter the number above.
            </label>
            <input
              id="delete-note-code-input"
              type="text"
              inputMode="numeric"
              value={deleteNoteCodeInput}
              onChange={(e) => {
                setDeleteNoteCodeInput(e.target.value.replace(/[^0-9]/g, ""));
                if (deleteNoteCodeError) {
                  setDeleteNoteCodeError("");
                }
              }}
              className="delete-modal-input"
              placeholder="Enter code"
              maxLength={6}
            />

            {deleteNoteCodeError ? <p className="delete-modal-error">{deleteNoteCodeError}</p> : null}

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel-btn"
                onClick={closeDeleteNoteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={confirmDeleteNote}
              >
                Delete it.
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Toast */}
      {actionToast && (
        <div className={`action-toast ${actionToast.type}`}>
          {actionToast.message}
        </div>
      )}
    </div>
  );
};

export default Notes;
