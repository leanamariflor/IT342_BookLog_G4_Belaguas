package edu.cit.belaguas.booklog.Service;

import edu.cit.belaguas.booklog.Model.BookNote;
import edu.cit.belaguas.booklog.Model.Book;
import edu.cit.belaguas.booklog.Repository.BookNoteRepository;
import edu.cit.belaguas.booklog.Repository.BookRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BookNoteService {

    private final BookNoteRepository bookNoteRepository;
    private final BookRepository bookRepository;

    public BookNoteService(BookNoteRepository bookNoteRepository, BookRepository bookRepository) {
        this.bookNoteRepository = bookNoteRepository;
        this.bookRepository = bookRepository;
    }

    public BookNote getNoteById(Long noteId) {
        return bookNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Book note not found with id: " + noteId));
    }

    public BookNote getNoteById(Long noteId, Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));
        
        return bookNoteRepository.findByNoteIdAndBook(noteId, book)
                .orElseThrow(() -> new RuntimeException("Book note not found with id: " + noteId + " for book: " + bookId));
    }

    public Page<BookNote> getNotesByBook(Long bookId, Pageable pageable) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));
        
        return bookNoteRepository.findByBook(book, pageable);
    }

    public BookNote createNote(Long bookId, String noteContent) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));
        
        BookNote note = new BookNote(noteContent, book);
        return bookNoteRepository.save(note);
    }

    public BookNote updateNote(Long noteId, Long bookId, String noteContent) {
        BookNote note = getNoteById(noteId, bookId);
        note.setNoteContent(noteContent);
        return bookNoteRepository.save(note);
    }

    public void deleteNote(Long noteId, Long bookId) {
        BookNote note = getNoteById(noteId, bookId);
        bookNoteRepository.delete(note);
    }

    public long getBookNoteCount(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));
        
        return bookNoteRepository.countByBook(book);
    }
}
