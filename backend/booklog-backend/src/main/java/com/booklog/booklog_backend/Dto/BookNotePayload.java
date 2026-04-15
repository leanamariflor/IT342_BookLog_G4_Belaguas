package com.booklog.booklog_backend.Dto;

import jakarta.validation.constraints.Size;

public class BookNotePayload {

    private Long id;

    @Size(max = 5000, message = "Note text must be at most 5000 characters")
    private String text;

    private String date;

    private Boolean isFavorited;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public Boolean getIsFavorited() {
        return isFavorited;
    }

    public void setIsFavorited(Boolean isFavorited) {
        this.isFavorited = isFavorited;
    }
}
