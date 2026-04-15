package com.booklog.booklog_backend.Repository;

import com.booklog.booklog_backend.Model.BookNote;
import com.booklog.booklog_backend.Model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface BookNoteRepository extends JpaRepository<BookNote, Long> {

    Page<BookNote> findByBook(Book book, Pageable pageable);

    Optional<BookNote> findByNoteIdAndBook(Long noteId, Book book);

    long countByBook(Book book);
}
