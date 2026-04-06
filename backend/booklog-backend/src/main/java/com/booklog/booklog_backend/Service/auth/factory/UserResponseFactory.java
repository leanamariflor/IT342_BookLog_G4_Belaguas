package com.booklog.booklog_backend.Service.auth.factory;

import com.booklog.booklog_backend.Dto.UserResponse;
import com.booklog.booklog_backend.Model.Role;
import com.booklog.booklog_backend.Model.User;
import com.booklog.booklog_backend.Service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UserResponseFactory {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserResponseFactory.class);

    public UserResponse buildAuthenticatedResponse(User user, String token, String message) {
        return new UserResponse(
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
    }

    public UserResponse buildProfileResponse(User user, String message) {
        return new UserResponse(
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
