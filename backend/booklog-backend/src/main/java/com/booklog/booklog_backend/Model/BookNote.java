package com.booklog.booklog_backend.Model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_notes")
public class BookNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "note_id")
    private Long noteId;

    @Column(name = "note_content", columnDefinition = "TEXT", nullable = false)
    private String noteContent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "bookID", nullable = false)
    private Book book;

    // Constructors
    public BookNote() {
        this.createdAt = LocalDateTime.now();
    }

    public BookNote(String noteContent) {
        this.noteContent = noteContent;
        this.createdAt = LocalDateTime.now();
    }

    public BookNote(String noteContent, Book book) {
        this(noteContent);
        this.book = book;
    }

    // Getters and Setters
    public Long getNoteId() {
        return noteId;
    }

    public void setNoteId(Long noteId) {
        this.noteId = noteId;
    }

    public String getNoteContent() {
        return noteContent;
    }

    public void setNoteContent(String noteContent) {
        this.noteContent = noteContent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Book getBook() {
        return book;
    }

    public void setBook(Book book) {
        this.book = book;
    }
}
