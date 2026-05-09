package com.booklog.booklog_backend;

import com.booklog.booklog_backend.feature.auth.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String registerAndGetToken(String email) throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setEmail(email);
        req.setPassword("password123");
        req.setFirstName("Test");
        req.setLastName("User");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }

    @Test
    void registerUser_WithValidData_ShouldReturnSuccess() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("reg_" + System.currentTimeMillis() + "@example.com");
        req.setPassword("password123");
        req.setFirstName("Test");
        req.setLastName("User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.email").exists())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    void loginUser_WithValidCredentials_ShouldReturnToken() throws Exception {
        String email = "login_" + System.currentTimeMillis() + "@example.com";

        RegisterRequest req = new RegisterRequest();
        req.setEmail(email);
        req.setPassword("password123");
        req.setFirstName("Login");
        req.setLastName("Test");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().is2xxSuccessful());

        String loginBody = "{\"email\":\"" + email + "\",\"password\":\"password123\"}";
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void getMe_WithValidToken_ShouldReturnCurrentUser() throws Exception {
        String email = "me_" + System.currentTimeMillis() + "@example.com";
        String token = registerAndGetToken(email);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.email").value(email));
    }


    @Test
    void logout_ShouldReturnSuccessMessage() throws Exception {
        String email = "logout_" + System.currentTimeMillis() + "@example.com";
        String token = registerAndGetToken(email);

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.message").value("Logout successful"));
    }
}