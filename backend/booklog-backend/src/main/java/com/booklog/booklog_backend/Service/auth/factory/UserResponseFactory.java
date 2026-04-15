package com.booklog.booklog_backend.Service.auth.factory;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.booklog.booklog_backend.Dto.UserResponse;
import com.booklog.booklog_backend.Model.Role;
import com.booklog.booklog_backend.Model.User;
import com.booklog.booklog_backend.Service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class UserResponseFactory {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserResponseFactory.class);
    private final ObjectMapper objectMapper;

    public UserResponseFactory(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public UserResponse buildAuthenticatedResponse(User user, String token, String message) {
        UserResponse response = new UserResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getProfileImage(),
                user.getOauthProvider(),
                token,
                getRoleNames(user),
                message
        );
            enrichProfileMetadata(response, user);
            return response;
    }

    public UserResponse buildProfileResponse(User user, String message) {
            UserResponse response = new UserResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getProfileImage(),
                user.getOauthProvider(),
                null,
                getRoleNames(user),
                message
        );
        enrichProfileMetadata(response, user);
        return response;
    }

    private void enrichProfileMetadata(UserResponse response, User user) {
        response.setCreatedAt(user.getCreatedAt());
        response.setUsername(user.getUsername());
        response.setLocation(user.getLocation());
        response.setBio(user.getBio());
        response.setReadingGoals(parseReadingGoals(user.getReadingGoalsJson()));
    }

    private Map<Integer, Integer> parseReadingGoals(String readingGoalsJson) {
        if (readingGoalsJson == null || readingGoalsJson.isBlank()) {
            return new HashMap<>();
        }

        try {
            Map<Integer, Integer> parsed = objectMapper.readValue(
                    readingGoalsJson,
                    new TypeReference<Map<Integer, Integer>>() {
                    }
            );
            return parsed == null ? new HashMap<>() : parsed;
        } catch (Exception ex) {
            LOGGER.warn("Unable to parse reading goals JSON", ex);
            return new HashMap<>();
        }
    }

    private List<String> getRoleNames(User user) {
        return user.getRoles().stream()
                .map(Role::getRoleName)
                .toList();
    }

    @EventListener
    public void onUserRegistered(AuthService.UserRegisteredEvent event) {
        LOGGER.info("User registered event received. email={}, provider={}", event.email(), event.provider());
    }
}
