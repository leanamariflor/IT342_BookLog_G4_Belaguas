package edu.cit.belaguas.booklog.Dto;

import edu.cit.belaguas.booklog.Model.Book;

import java.time.LocalDateTime;

public class BookResponse {

    private Long bookId;
    private String title;
    private String author;
    private String status;
    private String description;
    private Integer rating;
    private String coverImageUrl;
    private String attachmentOriginalName;
    private String attachmentContentType;
    private String attachmentUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BookResponse fromEntity(Book book) {
        BookResponse response = new BookResponse();
        response.setBookId(book.getBookId());
        response.setTitle(book.getTitle());
        response.setAuthor(book.getAuthor());
        response.setStatus(book.getStatus());
        response.setDescription(book.getDescription());
        response.setRating(book.getRating());
        response.setCoverImageUrl(book.getCoverImageUrl());
        response.setAttachmentOriginalName(book.getAttachmentOriginalName());
        response.setAttachmentContentType(book.getAttachmentContentType());
        response.setAttachmentUrl(book.getAttachmentPath() != null ? "/api/books/" + book.getBookId() + "/attachment" : null);
        response.setCreatedAt(book.getCreatedAt());
        response.setUpdatedAt(book.getUpdatedAt());
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
}
