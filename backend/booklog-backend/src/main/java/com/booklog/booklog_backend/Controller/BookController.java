package com.booklog.booklog_backend.Controller;

import com.booklog.booklog_backend.Dto.BookCreateRequest;
import com.booklog.booklog_backend.Dto.BookResponse;
import com.booklog.booklog_backend.Dto.BookSearchResult;
import com.booklog.booklog_backend.Dto.BookUpdateRequest;
import com.booklog.booklog_backend.Model.Book;
import com.booklog.booklog_backend.Service.BookCrudService;
import com.booklog.booklog_backend.Service.GoogleBooksService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URLConnection;
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

    @GetMapping("/proxy-cover")
    public ResponseEntity<byte[]> proxyCover(Authentication authentication,
                                             @RequestParam("url") String targetUrl) {
        try {
            URI uri = URI.create(targetUrl);
            String scheme = uri.getScheme();
            String host = uri.getHost();

            if (scheme == null || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                return ResponseEntity.badRequest().body(new byte[0]);
            }

            // Restrict proxying to Google Books cover host to avoid SSRF abuse.
            if (host == null || !"books.google.com".equalsIgnoreCase(host)) {
                return ResponseEntity.badRequest().body(new byte[0]);
            }

            URLConnection connection = uri.toURL().openConnection();
            if (connection instanceof HttpURLConnection httpConnection) {
                httpConnection.setRequestMethod("GET");
                httpConnection.setConnectTimeout(8000);
                httpConnection.setReadTimeout(12000);
                httpConnection.setRequestProperty("User-Agent", "BookLog/1.0");
            }

            String contentType = connection.getContentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = MediaType.IMAGE_JPEG_VALUE;
            }

            byte[] payload;
            try (InputStream inputStream = connection.getInputStream()) {
                payload = inputStream.readAllBytes();
            }

            MediaType mediaType;
            try {
                mediaType = MediaType.parseMediaType(contentType);
            } catch (Exception parseError) {
                mediaType = MediaType.IMAGE_JPEG;
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .body(payload);
        } catch (IllegalArgumentException invalidUri) {
            return ResponseEntity.badRequest().body(new byte[0]);
        } catch (IOException ioError) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new byte[0]);
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
