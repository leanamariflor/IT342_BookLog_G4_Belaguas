package com.booklog.booklog_backend.Service;

import com.booklog.booklog_backend.Model.Book;
import com.booklog.booklog_backend.Model.User;
import com.booklog.booklog_backend.Repository.BookRepository;
import com.booklog.booklog_backend.Repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BookService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    public BookService(BookRepository bookRepository, UserRepository userRepository) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    public Book getBookById(Long bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));
    }

    public Book getBookById(Long bookId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        return bookRepository.findByBookIdAndUser(bookId, user)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId + " for user: " + userId));
    }

    public Page<Book> getBooksByUser(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        return bookRepository.findByUser(user, pageable);
    }

    public Page<Book> searchBooksByTitle(String title, Pageable pageable) {
        return bookRepository.findByTitleContainingIgnoreCase(title, pageable);
    }

    public Page<Book> searchBooksByAuthor(String author, Pageable pageable) {
        return bookRepository.findByAuthorContainingIgnoreCase(author, pageable);
    }

    public Page<Book> searchBooksByStatus(String status, Pageable pageable) {
        return bookRepository.findByStatus(status, pageable);
    }

    public Book createBook(Long userId, Book book) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        book.setUser(user);
        return bookRepository.save(book);
    }

    public Book updateBook(Long bookId, Long userId, Book bookDetails) {
        Book book = getBookById(bookId, userId);
        
        if (bookDetails.getTitle() != null) {
            book.setTitle(bookDetails.getTitle());
        }
        if (bookDetails.getAuthor() != null) {
            book.setAuthor(bookDetails.getAuthor());
        }
        if (bookDetails.getStatus() != null) {
            book.setStatus(bookDetails.getStatus());
        }
        if (bookDetails.getDescription() != null) {
            book.setDescription(bookDetails.getDescription());
        }
        if (bookDetails.getRating() != null) {
            book.setRating(bookDetails.getRating());
        }
        
        return bookRepository.save(book);
    }

    public void deleteBook(Long bookId, Long userId) {
        Book book = getBookById(bookId, userId);
        bookRepository.delete(book);
    }

    public long getUserBookCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        return bookRepository.countByUser(user);
    }
}
