package edu.cit.belaguas.booklog.Service;

import edu.cit.belaguas.booklog.Dto.BookSearchResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class GoogleBooksService {

    private static final String GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes?q=";
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Value("${google.books.api.key:}")
    private String apiKey;
    
    private final ObjectMapper objectMapper;

    public GoogleBooksService() {
        this.objectMapper = new ObjectMapper();
    }

    public List<BookSearchResult> searchBooks(String query, int page) {
        List<BookSearchResult> results = new ArrayList<>();
        
        try {
            // URL encode the query properly
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            int startIndex = page * 20; // 20 results per page
            String url = GOOGLE_BOOKS_API_URL + encodedQuery + "&startIndex=" + startIndex + "&maxResults=20";
            
            // Add API key if configured
            if (apiKey != null && !apiKey.isEmpty()) {
                url += "&key=" + apiKey;
            }
            
            System.out.println("Calling Google Books API: " + url);
            
            // Make the API call
            String response = restTemplate.getForObject(url, String.class);
            
            if (response == null || response.isEmpty()) {
                System.out.println("Empty response from Google Books API");
                return results;
            }
            
            System.out.println("Response received, parsing JSON...");
            
            // Parse the JSON response
            JsonNode root = objectMapper.readTree(response);
            JsonNode items = root.get("items");
            
            if (items != null && items.isArray()) {
                System.out.println("Found " + items.size() + " books");
                for (JsonNode item : items) {
                    try {
                        BookSearchResult book = parseBookItem(item);
                        if (book != null) {
                            results.add(book);
                        }
                    } catch (Exception e) {
                        System.out.println("Error parsing book item: " + e.getMessage());
                        // Continue with the next book
                    }
                }
            } else {
                System.out.println("No items found in response");
            }
            
            return results;
        } catch (Exception e) {
            System.err.println("Error searching books: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to search books: " + e.getMessage(), e);
        }
    }

    private BookSearchResult parseBookItem(JsonNode item) {
        BookSearchResult book = new BookSearchResult();
        
        // Get book ID
        if (item.has("id")) {
            book.setId(item.get("id").asText());
        }
        
        JsonNode volumeInfo = item.get("volumeInfo");
        if (volumeInfo == null) {
            return null;
        }
        
        // Get title
        if (volumeInfo.has("title")) {
            book.setTitle(volumeInfo.get("title").asText());
        }
        
        // Get authors
        if (volumeInfo.has("authors")) {
            List<String> authors = new ArrayList<>();
            for (JsonNode author : volumeInfo.get("authors")) {
                authors.add(author.asText());
            }
            book.setAuthors(authors);
        }
        
        // Get publisher
        if (volumeInfo.has("publisher")) {
            book.setPublisher(volumeInfo.get("publisher").asText());
        }
        
        // Get published date
        if (volumeInfo.has("publishedDate")) {
            book.setPublishedDate(volumeInfo.get("publishedDate").asText());
        }
        
        // Get description
        if (volumeInfo.has("description")) {
            book.setDescription(volumeInfo.get("description").asText());
        }
        
        // Get page count
        if (volumeInfo.has("pageCount")) {
            book.setPageCount(volumeInfo.get("pageCount").asInt());
        }
        
        // Get categories
        if (volumeInfo.has("categories")) {
            List<String> categories = new ArrayList<>();
            for (JsonNode category : volumeInfo.get("categories")) {
                categories.add(category.asText());
            }
            book.setCategories(categories);
        }
        
        // Get thumbnail image
        if (volumeInfo.has("imageLinks")) {
            JsonNode imageLinks = volumeInfo.get("imageLinks");
            if (imageLinks.has("thumbnail")) {
                book.setThumbnail(imageLinks.get("thumbnail").asText().replace("http:", "https:"));
            } else if (imageLinks.has("smallThumbnail")) {
                book.setThumbnail(imageLinks.get("smallThumbnail").asText().replace("http:", "https:"));
            }
        }
        
        // Get preview link
        if (volumeInfo.has("previewLink")) {
            book.setPreviewLink(volumeInfo.get("previewLink").asText());
        }
        
        // Get ISBN
        if (volumeInfo.has("industryIdentifiers")) {
            List<String> isbnList = new ArrayList<>();
            for (JsonNode identifier : volumeInfo.get("industryIdentifiers")) {
                if (identifier.has("identifier")) {
                    isbnList.add(identifier.get("identifier").asText());
                }
            }
            book.setIsbn(isbnList);
        }
        
        return book;
    }
}
