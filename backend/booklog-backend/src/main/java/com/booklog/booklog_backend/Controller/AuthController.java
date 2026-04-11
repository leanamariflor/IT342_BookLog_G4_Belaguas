package com.booklog.booklog_backend.Controller;

import com.booklog.booklog_backend.Dto.LoginRequest;
import com.booklog.booklog_backend.Dto.ProfileUpdateRequest;
import com.booklog.booklog_backend.Dto.OAuthCallbackRequest;
import com.booklog.booklog_backend.Dto.RegisterRequest;
import com.booklog.booklog_backend.Dto.UserResponse;
import com.booklog.booklog_backend.Service.AuthService;
import com.booklog.booklog_backend.Service.CustomUserDetailsService;
import com.booklog.booklog_backend.Service.JwtService;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;

    public AuthController(AuthService authService,
                          JwtService jwtService,
                          CustomUserDetailsService customUserDetailsService) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.customUserDetailsService = customUserDetailsService;
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

    @PutMapping("/me")
    public UserResponse updateMe(Authentication authentication,
                                 @RequestBody ProfileUpdateRequest request) {
        return authService.updateCurrentUser(authentication.getName(), request);
    }

    @PostMapping(value = "/me/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse updateProfileImage(Authentication authentication,
                                           HttpServletRequest request,
                                           @RequestParam("file") MultipartFile file) {
        String email = resolveAuthenticatedEmail(authentication, request);
        return authService.updateCurrentUserProfileImage(email, file);
    }

    @GetMapping("/me/profile-image")
    public ResponseEntity<Resource> getProfileImage(Authentication authentication,
                                                    HttpServletRequest request) {
        String email = resolveAuthenticatedEmail(authentication, request);
        Resource resource = authService.getCurrentUserProfileImage(email);

        return ResponseEntity.status(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=profile-image")
                .body(resource);
    }

    private String resolveAuthenticatedEmail(Authentication authentication, HttpServletRequest request) {
        if (authentication != null && authentication.getName() != null && !authentication.getName().isBlank()) {
            return authentication.getName();
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || authHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing authorization header");
        }

        String normalized = authHeader.trim();
        if (normalized.length() < 8 || !normalized.regionMatches(true, 0, "Bearer ", 0, 7)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authorization header");
        }

        String jwt = normalized.substring(7).trim();
        if (jwt.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
        }

        try {
            String email = jwtService.extractUsername(jwt);
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
            if (!jwtService.isTokenValid(jwt, userDetails)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid bearer token");
            }
            return email;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid bearer token");
        }
    }

    @PostMapping("/logout")
    public Map<String, String> logout() {
        return Map.of("message", "Logout successful");
    }
}