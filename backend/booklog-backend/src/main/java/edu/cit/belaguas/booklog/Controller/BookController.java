package edu.cit.belaguas.booklog.Controller;

import edu.cit.belaguas.booklog.Dto.BookCreateRequest;
import edu.cit.belaguas.booklog.Dto.BookResponse;
import edu.cit.belaguas.booklog.Dto.BookSearchResult;
import edu.cit.belaguas.booklog.Dto.BookUpdateRequest;
import edu.cit.belaguas.booklog.Model.Book;
import edu.cit.belaguas.booklog.Service.BookCrudService;
import edu.cit.belaguas.booklog.Service.GoogleBooksService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final GoogleBooksService googleBooksService;
    private final BookCrudService bookCrudService;

    public BookController(GoogleBooksService googleBooksService, BookCrudService bookCrudService) {
        this.googleBooksService = googleBooksService;
        this.bookCrudService = bookCrudService;
    }

    @PostMapping
    public ResponseEntity<BookResponse> createBook(Authentication authentication,
                                                   @Valid @RequestBody BookCreateRequest request) {
        Book saved = bookCrudService.createBook(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(BookResponse.fromEntity(saved));
    }

    @GetMapping
    public List<BookResponse> getBooks(Authentication authentication,
                                       @RequestParam(required = false) String status) {
        return bookCrudService.getBooks(authentication.getName(), status)
                .stream()
                .map(BookResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{bookId}")
    public BookResponse getBookById(Authentication authentication, @PathVariable Long bookId) {
        return BookResponse.fromEntity(bookCrudService.getBookById(authentication.getName(), bookId));
    }

    @PutMapping("/{bookId}")
    public BookResponse updateBook(Authentication authentication,
                                   @PathVariable Long bookId,
                                   @Valid @RequestBody BookUpdateRequest request) {
        Book updated = bookCrudService.updateBook(authentication.getName(), bookId, request);
        return BookResponse.fromEntity(updated);
    }

    @DeleteMapping("/{bookId}")
    public Map<String, String> deleteBook(Authentication authentication, @PathVariable Long bookId) {
        bookCrudService.deleteBook(authentication.getName(), bookId);
        return Map.of("message", "Book deleted successfully");
    }

    @PostMapping(value = "/{bookId}/attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BookResponse uploadAttachment(Authentication authentication,
                                         @PathVariable Long bookId,
                                         @RequestParam("file") MultipartFile file) {
        Book updated = bookCrudService.uploadAttachment(authentication.getName(), bookId, file);
        return BookResponse.fromEntity(updated);
    }

    @GetMapping("/{bookId}/attachment")
    public ResponseEntity<Resource> downloadAttachment(Authentication authentication,
                                                       @PathVariable Long bookId) {
        Book book = bookCrudService.getBookById(authentication.getName(), bookId);
        Resource resource = bookCrudService.getAttachment(authentication.getName(), bookId);

        String contentType = book.getAttachmentContentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM_VALUE
                : book.getAttachmentContentType();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + (book.getAttachmentOriginalName() == null ? "attachment" : book.getAttachmentOriginalName()) + "\"")
                .body(resource);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchBooks(@RequestParam String query, @RequestParam(defaultValue = "0") int page) {
        try {
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Query parameter is required");
            }
            
            System.out.println("Searching for: " + query + " (page: " + page + ")");
            List<BookSearchResult> results = googleBooksService.searchBooks(query, page);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            System.err.println("Error in BookController: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error searching books: " + e.getMessage());
        }
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage() == null ? "Unexpected server error" : ex.getMessage();
        HttpStatus status = message.toLowerCase().contains("not found")
                ? HttpStatus.NOT_FOUND
                : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
