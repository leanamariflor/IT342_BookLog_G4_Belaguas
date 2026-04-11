package com.booklog.booklog_backend.Service;

import com.booklog.booklog_backend.Dto.BookCreateRequest;
import com.booklog.booklog_backend.Dto.BookNotePayload;
import com.booklog.booklog_backend.Dto.BookUpdateRequest;
import com.booklog.booklog_backend.Model.Book;
import com.booklog.booklog_backend.Model.BookNote;
import com.booklog.booklog_backend.Model.User;
import com.booklog.booklog_backend.Repository.BookRepository;
import com.booklog.booklog_backend.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class BookCrudService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public BookCrudService(BookRepository bookRepository, UserRepository userRepository) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    public Book createBook(String email, BookCreateRequest request) {
        User user = getUserByEmail(email);

        Book book = new Book();
        book.setUser(user);
        book.setTitle(request.getTitle().trim());
        book.setAuthor(trimToNull(request.getAuthor()));
        book.setStatus(normalizeStatus(request.getStatus()));
        book.setDescription(trimToNull(request.getDescription()));
        book.setRating(request.getRating());
        book.setCoverImageUrl(trimToNull(request.getCoverImageUrl()));
        book.setReview(trimToNull(request.getReview()));
        book.setDateStarted(request.getDateStarted());
        book.setDateCompleted(request.getDateCompleted());

        return bookRepository.save(book);
    }

    public List<Book> getBooks(String email, String status) {
        User user = getUserByEmail(email);
        if (status == null || status.isBlank()) {
            return bookRepository.findByUserOrderByCreatedAtDesc(user);
        }
        return bookRepository.findByUserAndStatusOrderByCreatedAtDesc(user, normalizeStatus(status));
    }

    public Book getBookById(String email, Long bookId) {
        User user = getUserByEmail(email);
        return bookRepository.findByBookIdAndUser(bookId, user)
                .orElseThrow(() -> new RuntimeException("Book not found"));
    }

    public Book updateBook(String email, Long bookId, BookUpdateRequest request) {
        Book book = getBookById(email, bookId);

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            book.setTitle(request.getTitle().trim());
        }

        if (request.getAuthor() != null) {
            book.setAuthor(trimToNull(request.getAuthor()));
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            book.setStatus(normalizeStatus(request.getStatus()));
        }

        if (request.getDescription() != null) {
            book.setDescription(trimToNull(request.getDescription()));
        }

        if (request.getRating() != null) {
            book.setRating(request.getRating());
        }

        if (request.getCoverImageUrl() != null) {
            book.setCoverImageUrl(trimToNull(request.getCoverImageUrl()));
        }

        if (request.getReview() != null) {
            book.setReview(trimToNull(request.getReview()));
        }

        if (request.getDateStarted() != null) {
            book.setDateStarted(request.getDateStarted());
        }

        if (request.getDateCompleted() != null) {
            book.setDateCompleted(request.getDateCompleted());
        }

        if (request.getNotes() != null) {
            book.getNotes().clear();
            for (BookNotePayload notePayload : request.getNotes()) {
                if (notePayload == null) {
                    continue;
                }

                String trimmedText = trimToNull(notePayload.getText());
                if (trimmedText == null) {
                    continue;
                }

                BookNote note = new BookNote();
                note.setBook(book);
                note.setNoteContent(trimmedText);
                note.setCreatedAt(parseDateOrNow(notePayload.getDate()));
                note.setIsFavorited(Boolean.TRUE.equals(notePayload.getIsFavorited()));
                book.getNotes().add(note);
            }
        }

        return bookRepository.save(book);
    }

    public void deleteBook(String email, Long bookId) {
        Book book = getBookById(email, bookId);
        deleteAttachmentIfExists(book.getAttachmentPath());
        bookRepository.delete(book);
    }

    public Book uploadAttachment(String email, Long bookId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }

        Book book = getBookById(email, bookId);

        try {
            Path uploadBasePath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadBasePath);

            String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            String storedFileName = UUID.randomUUID() + "_" + safeName;
            Path targetPath = uploadBasePath.resolve(storedFileName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            deleteAttachmentIfExists(book.getAttachmentPath());

            book.setAttachmentPath(targetPath.toString());
            book.setAttachmentOriginalName(originalName);
            book.setAttachmentContentType(file.getContentType());
            return bookRepository.save(book);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public Resource getAttachment(String email, Long bookId) {
        Book book = getBookById(email, bookId);
        if (book.getAttachmentPath() == null || book.getAttachmentPath().isBlank()) {
            throw new RuntimeException("No attachment found for this book");
        }

        Resource resource = new FileSystemResource(book.getAttachmentPath());
        if (!resource.exists()) {
            throw new RuntimeException("Attachment file not found on server");
        }

        return resource;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "To Read";
        }

        String normalized = status.trim();
        return switch (normalized.toLowerCase()) {
            case "to read", "toread" -> "To Read";
            case "reading" -> "Reading";
            case "completed" -> "Completed";
            case "on hold", "onhold" -> "On Hold";
            default -> normalized;
        };
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private LocalDateTime parseDateOrNow(String value) {
        if (value == null || value.isBlank()) {
            return LocalDateTime.now();
        }

        try {
            return LocalDateTime.parse(value);
        } catch (Exception ignored) {
            try {
                return LocalDateTime.ofInstant(Instant.parse(value), ZoneOffset.UTC);
            } catch (Exception ignoredAgain) {
                return LocalDateTime.now();
            }
        }
    }

    private void deleteAttachmentIfExists(String attachmentPath) {
        if (attachmentPath == null || attachmentPath.isBlank()) {
            return;
        }

        try {
            Files.deleteIfExists(Paths.get(attachmentPath));
        } catch (IOException ignored) {
            // Keep business flow working even if old file cleanup fails.
        }
    }
}
