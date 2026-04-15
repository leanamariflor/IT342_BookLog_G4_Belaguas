package com.booklog.booklog_backend.Service;

import com.booklog.booklog_backend.Dto.LoginRequest;
import com.booklog.booklog_backend.Dto.OAuthCallbackRequest;
import com.booklog.booklog_backend.Dto.RegisterRequest;
import com.booklog.booklog_backend.Dto.UserResponse;
import com.booklog.booklog_backend.Model.Role;
import com.booklog.booklog_backend.Model.User;
import com.booklog.booklog_backend.Repository.UserRepository;
import com.booklog.booklog_backend.Service.auth.factory.UserResponseFactory;
import com.booklog.booklog_backend.Service.auth.support.UserRoleResolver;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private static final int OAUTH_PROVIDER_MAX_LENGTH = 50;
    private static final int PROFILE_IMAGE_MAX_LENGTH = 50;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserRoleResolver userRoleResolver;
    private final UserResponseFactory userResponseFactory;
    private final ApplicationEventPublisher eventPublisher;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       UserRoleResolver userRoleResolver,
                       UserResponseFactory userResponseFactory,
                       ApplicationEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userRoleResolver = userRoleResolver;
        this.userResponseFactory = userResponseFactory;
        this.eventPublisher = eventPublisher;
    }

    public UserResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        AuthOutcome outcome = processAuthentication(AuthType.REGISTER, request);
        eventPublisher.publishEvent(new UserRegisteredEvent(outcome.user().getEmail(), "EMAIL_PASSWORD"));

        return userResponseFactory.buildAuthenticatedResponse(
                outcome.user(),
                jwtService.generateToken(outcome.user()),
                "User registered successfully"
        );
    }

    public UserResponse login(LoginRequest request) {
        AuthOutcome outcome = processAuthentication(AuthType.LOGIN, request);
        return userResponseFactory.buildAuthenticatedResponse(
                outcome.user(),
                jwtService.generateToken(outcome.user()),
                "Login successful"
        );
    }

    public UserResponse handleSupabaseOAuth(OAuthCallbackRequest request) {
        AuthOutcome outcome = processAuthentication(AuthType.OAUTH, request);

        if (outcome.newlyCreated()) {
            eventPublisher.publishEvent(new UserRegisteredEvent(outcome.user().getEmail(), "GOOGLE_OAUTH"));
        }

        return userResponseFactory.buildAuthenticatedResponse(
                outcome.user(),
                jwtService.generateToken(outcome.user()),
                "OAuth login successful"
        );
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        userRoleResolver.ensureDefaultRoleIfMissing(user);

        return userResponseFactory.buildProfileResponse(user, "Current user fetched");
    }

    private AuthOutcome processAuthentication(AuthType authType, Object payload) {
        AuthProcessor processor = getProcessor(authType);
        return processor.authenticate(payload);
    }

    // Factory Method: select the concrete strategy based on requested auth flow.
    private AuthProcessor getProcessor(AuthType authType) {
        return switch (authType) {
            case REGISTER -> this::registerWithEmailPassword;
            case LOGIN -> this::loginWithEmailPassword;
            case OAUTH -> this::loginWithOAuth;
        };
    }

    // Adapter: map external OAuth callback fields into a normalized internal record.
    private OAuthUserData adaptOAuthRequest(OAuthCallbackRequest request) {
        return new OAuthUserData(
                request.getEmail(),
                request.getFirstName(),
                request.getLastName(),
                normalizeForColumn(request.getProvider(), OAUTH_PROVIDER_MAX_LENGTH),
                normalizeForColumn(request.getProfileImage(), PROFILE_IMAGE_MAX_LENGTH)
        );
    }

    private AuthOutcome registerWithEmailPassword(Object payload) {
        RegisterRequest request = (RegisterRequest) payload;

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFirstName(),
                request.getLastName()
        );

        user.setRoles(userRoleResolver.resolveRolesForEmail(request.getEmail()));
        userRepository.save(user);
        return new AuthOutcome(user, true);
    }

    private AuthOutcome loginWithEmailPassword(Object payload) {
        LoginRequest request = (LoginRequest) payload;

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        userRoleResolver.ensureDefaultRoleIfMissing(user);
        return new AuthOutcome(user, false);
    }

    private AuthOutcome loginWithOAuth(Object payload) {
        OAuthCallbackRequest request = (OAuthCallbackRequest) payload;
        OAuthUserData oauthData = adaptOAuthRequest(request);

        final boolean[] created = {false};

        User user = userRepository.findByEmail(oauthData.email())
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(oauthData.email());
                    newUser.setFirstName(oauthData.firstName());
                    newUser.setLastName(oauthData.lastName());
                    newUser.setProfileImage(oauthData.profileImage());
                    newUser.setOauthProvider(oauthData.provider());
                    newUser.setPassword("");
                    newUser.setRoles(userRoleResolver.resolveRolesForEmail(oauthData.email()));
                    created[0] = true;
                    return userRepository.save(newUser);
                });

        userRoleResolver.ensureDefaultRoleIfMissing(user);

        boolean needsUpdate = false;
        if (user.getOauthProvider() == null || !user.getOauthProvider().equals(oauthData.provider())) {
            user.setOauthProvider(oauthData.provider());
            needsUpdate = true;
        }
        if (oauthData.profileImage() != null && !oauthData.profileImage().isEmpty() &&
                (user.getProfileImage() == null || !user.getProfileImage().equals(oauthData.profileImage()))) {
            user.setProfileImage(oauthData.profileImage());
            needsUpdate = true;
        }
        if (user.getFirstName() == null && oauthData.firstName() != null) {
            user.setFirstName(oauthData.firstName());
            needsUpdate = true;
        }
        if (user.getLastName() == null && oauthData.lastName() != null) {
            user.setLastName(oauthData.lastName());
            needsUpdate = true;
        }

        if (needsUpdate) {
            userRepository.save(user);
        }

        return new AuthOutcome(user, created[0]);
    }

    private String normalizeForColumn(String value, int maxLength) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }

    private enum AuthType {
        REGISTER,
        LOGIN,
        OAUTH
    }

    @FunctionalInterface
    private interface AuthProcessor {
        AuthOutcome authenticate(Object payload);
    }

    public record UserRegisteredEvent(String email, String provider) {
    }

    private record OAuthUserData(String email, String firstName, String lastName, String provider, String profileImage) {
    }

    private record AuthOutcome(User user, boolean newlyCreated) {
    }
}