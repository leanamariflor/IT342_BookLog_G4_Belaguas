package com.booklog.booklog_backend.Controller;

import com.booklog.booklog_backend.Dto.UserResponse;
import com.booklog.booklog_backend.Service.AuthService;
import com.booklog.booklog_backend.Service.CustomUserDetailsService;
import com.booklog.booklog_backend.Service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserProfileController.class);

    private final AuthService authService;
    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;

    public UserProfileController(AuthService authService,
                                 JwtService jwtService,
                                 CustomUserDetailsService customUserDetailsService) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.customUserDetailsService = customUserDetailsService;
    }

    @PostMapping(value = "/me/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse updateProfileImage(Authentication authentication,
                                           HttpServletRequest request,
                                           @RequestParam("file") MultipartFile file) {
        return authService.updateCurrentUserProfileImage(resolveAuthenticatedEmail(authentication, request), file);
    }

    @GetMapping("/me/profile-image")
    public ResponseEntity<Resource> getProfileImage(Authentication authentication,
                                                    HttpServletRequest request) {
        Resource resource = authService.getCurrentUserProfileImage(resolveAuthenticatedEmail(authentication, request));
        return ResponseEntity.status(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=profile-image")
                .body(resource);
    }

    private String resolveAuthenticatedEmail(Authentication authentication, HttpServletRequest request) {
        if (authentication != null && authentication.getName() != null && !authentication.getName().isBlank()) {
            LOGGER.debug("Resolved email from Authentication principal: {}", authentication.getName());
            return authentication.getName();
        }

        String authHeader = request.getHeader("Authorization");
        LOGGER.debug("Authentication principal missing; Authorization header present: {}", authHeader != null && !authHeader.isBlank());
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
            LOGGER.debug("Extracted email from JWT fallback: {}", email);
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
            if (!jwtService.isTokenValid(jwt, userDetails)) {
                LOGGER.warn("JWT fallback validation failed for email: {}", email);
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid bearer token");
            }
            return email;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            LOGGER.warn("JWT fallback failed", ex);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid bearer token");
        }
    }
}