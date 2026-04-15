package edu.cit.belaguas.booklog.Repository;

import edu.cit.belaguas.booklog.Model.BookNote;
import edu.cit.belaguas.booklog.Model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface BookNoteRepository extends JpaRepository<BookNote, Long> {

    Page<BookNote> findByBook(Book book, Pageable pageable);

    Optional<BookNote> findByNoteIdAndBook(Long noteId, Book book);

    long countByBook(Book book);
}
