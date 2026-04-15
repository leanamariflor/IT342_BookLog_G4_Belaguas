package com.booklog.booklog_backend.Dto;

import com.booklog.booklog_backend.Model.Book;
import com.booklog.booklog_backend.Model.BookNote;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

public class BookResponse {

    private Long bookId;
    private String title;
    private String author;
    private String status;
    private String description;
    private Integer rating;
    private String coverImageUrl;
    private String review;
    private LocalDate dateStarted;
    private LocalDate dateCompleted;
    private String attachmentOriginalName;
    private String attachmentContentType;
    private String attachmentUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BookNotePayload> notes;

    public static BookResponse fromEntity(Book book) {
        BookResponse response = new BookResponse();
        response.setBookId(book.getBookId());
        response.setTitle(book.getTitle());
        response.setAuthor(book.getAuthor());
        response.setStatus(book.getStatus());
        response.setDescription(book.getDescription());
        response.setRating(book.getRating());
        response.setCoverImageUrl(book.getCoverImageUrl());
        response.setReview(book.getReview());
        response.setDateStarted(book.getDateStarted());
        response.setDateCompleted(book.getDateCompleted());
        response.setAttachmentOriginalName(book.getAttachmentOriginalName());
        response.setAttachmentContentType(book.getAttachmentContentType());
        response.setAttachmentUrl(book.getAttachmentPath() != null ? "/api/books/" + book.getBookId() + "/attachment" : null);
        response.setCreatedAt(book.getCreatedAt());
        response.setUpdatedAt(book.getUpdatedAt());
        response.setNotes(book.getNotes().stream()
                .sorted(Comparator.comparing(BookNote::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(note -> {
                    BookNotePayload payload = new BookNotePayload();
                    payload.setId(note.getNoteId());
                    payload.setText(note.getNoteContent());
                    payload.setDate(note.getCreatedAt() == null ? null : note.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                    payload.setIsFavorited(Boolean.TRUE.equals(note.getIsFavorited()));
                    return payload;
                })
                .toList());
        return response;
    }

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }

    public String getReview() {
        return review;
    }

    public void setReview(String review) {
        this.review = review;
    }

    public LocalDate getDateStarted() {
        return dateStarted;
    }

    public void setDateStarted(LocalDate dateStarted) {
        this.dateStarted = dateStarted;
    }

    public LocalDate getDateCompleted() {
        return dateCompleted;
    }

    public void setDateCompleted(LocalDate dateCompleted) {
        this.dateCompleted = dateCompleted;
    }

    public String getAttachmentOriginalName() {
        return attachmentOriginalName;
    }

    public void setAttachmentOriginalName(String attachmentOriginalName) {
        this.attachmentOriginalName = attachmentOriginalName;
    }

    public String getAttachmentContentType() {
        return attachmentContentType;
    }

    public void setAttachmentContentType(String attachmentContentType) {
        this.attachmentContentType = attachmentContentType;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<BookNotePayload> getNotes() {
        return notes;
    }

    public void setNotes(List<BookNotePayload> notes) {
        this.notes = notes;
    }
}
