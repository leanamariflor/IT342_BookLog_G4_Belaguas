package com.booklog.booklog_backend;

import com.booklog.booklog_backend.feature.auth.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class BookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        String email = "booktest_" + System.currentTimeMillis() + "@example.com";

        RegisterRequest req = new RegisterRequest();
        req.setEmail(email);
        req.setPassword("password123");
        req.setFirstName("Book");
        req.setLastName("Tester");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        token = objectMapper.readTree(body).get("token").asText();
    }

    @Test
    void createBook_WithValidData_ShouldReturnCreated() throws Exception {
        String bookJson = "{\"title\":\"Test Book\",\"author\":\"Test Author\",\"status\":\"Reading\"}";

        mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Test Book"))
                .andExpect(jsonPath("$.author").value("Test Author"));
    }

    @Test
    void createBook_WithMissingTitle_ShouldReturnBadRequest() throws Exception {
        String bookJson = "{\"author\":\"Test Author\",\"status\":\"Reading\"}";

        mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getBooks_WithValidToken_ShouldReturnList() throws Exception {
        mockMvc.perform(get("/api/books")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    void getBooks_WithoutToken_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/books"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void updateBook_WithValidData_ShouldReturnUpdatedBook() throws Exception {
        String bookJson = "{\"title\":\"Original Title\",\"author\":\"Author\",\"status\":\"Reading\"}";

        MvcResult createResult = mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson))
                .andExpect(status().isCreated())
                .andReturn();

        Long bookId = objectMapper.readTree(
                createResult.getResponse().getContentAsString()
        ).get("bookId").asLong();

        String updateJson = "{\"title\":\"Updated Title\",\"status\":\"Completed\"}";

        mockMvc.perform(put("/api/books/" + bookId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.title").value("Updated Title"));
    }

    @Test
    void deleteBook_WithValidToken_ShouldReturnSuccessMessage() throws Exception {
        String bookJson = "{\"title\":\"Book To Delete\",\"author\":\"Author\",\"status\":\"Reading\"}";

        MvcResult createResult = mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson))
                .andExpect(status().isCreated())
                .andReturn();

        Long bookId = objectMapper.readTree(
                createResult.getResponse().getContentAsString()
        ).get("bookId").asLong();

        mockMvc.perform(delete("/api/books/" + bookId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.message").value("Book deleted successfully"));
    }

    @Test
    void searchBooks_WithValidQuery_ShouldReturnResults() throws Exception {
        mockMvc.perform(get("/api/books/search")
                        .header("Authorization", "Bearer " + token)
                        .param("query", "Harry Potter"))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    void searchBooks_WithEmptyQuery_ShouldReturnBadRequest() throws Exception {
        mockMvc.perform(get("/api/books/search")
                        .header("Authorization", "Bearer " + token)
                        .param("query", ""))
                .andExpect(status().isBadRequest());
    }
}