package com.booklog.booklog_backend.Controller;

import com.booklog.booklog_backend.Dto.LoginRequest;
import com.booklog.booklog_backend.Dto.OAuthCallbackRequest;
import com.booklog.booklog_backend.Dto.RegisterRequest;
import com.booklog.booklog_backend.Dto.UserResponse;
import com.booklog.booklog_backend.Service.AuthService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public UserResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public UserResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/oauth/callback")
    public UserResponse handleOAuthCallback(@RequestBody OAuthCallbackRequest request) {
        return authService.handleSupabaseOAuth(request);
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName());
    }

    @PostMapping("/logout")
    public Map<String, String> logout() {
        return Map.of("message", "Logout successful");
    }
}