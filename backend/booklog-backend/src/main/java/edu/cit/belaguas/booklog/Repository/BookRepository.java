package edu.cit.belaguas.booklog.Repository;

import edu.cit.belaguas.booklog.Model.Book;
import edu.cit.belaguas.booklog.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {

    Page<Book> findByUser(User user, Pageable pageable);

    List<Book> findByUserOrderByCreatedAtDesc(User user);

    List<Book> findByUserAndStatusOrderByCreatedAtDesc(User user, String status);

    Optional<Book> findByBookIdAndUser(Long bookId, User user);

    long countByUser(User user);

    Page<Book> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    Page<Book> findByAuthorContainingIgnoreCase(String author, Pageable pageable);

    Page<Book> findByStatus(String status, Pageable pageable);
}
