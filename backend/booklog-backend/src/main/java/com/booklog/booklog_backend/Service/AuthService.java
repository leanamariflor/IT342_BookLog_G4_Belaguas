package com.booklog.booklog_backend.Service;

import com.booklog.booklog_backend.Dto.LoginRequest;
import com.booklog.booklog_backend.Dto.OAuthCallbackRequest;
import com.booklog.booklog_backend.Dto.ProfileUpdateRequest;
import com.booklog.booklog_backend.Dto.RegisterRequest;
import com.booklog.booklog_backend.Dto.UserResponse;
import com.booklog.booklog_backend.Model.User;
import com.booklog.booklog_backend.Repository.UserRepository;
import com.booklog.booklog_backend.Service.auth.factory.UserResponseFactory;
import com.booklog.booklog_backend.Service.auth.support.UserRoleResolver;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class AuthService {

    private static final int OAUTH_PROVIDER_MAX_LENGTH = 50;
    private static final int PROFILE_IMAGE_MAX_LENGTH = 500;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserRoleResolver userRoleResolver;
    private final UserResponseFactory userResponseFactory;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

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

    public UserResponse updateCurrentUser(String email, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFirstName() != null) {
            user.setFirstName(trimToNull(request.getFirstName()));
        }
        if (request.getLastName() != null) {
            user.setLastName(trimToNull(request.getLastName()));
        }

        userRepository.save(user);
        userRoleResolver.ensureDefaultRoleIfMissing(user);
        return userResponseFactory.buildProfileResponse(user, "Profile updated successfully");
    }

    public UserResponse updateCurrentUserProfileImage(String email, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            Path uploadBasePath = Paths.get(uploadDir, "profile-images").toAbsolutePath().normalize();
            Files.createDirectories(uploadBasePath);

            String originalName = file.getOriginalFilename() == null ? "profile-image" : file.getOriginalFilename();
            String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            String storedFileName = UUID.randomUUID() + "_" + safeName;
            Path targetPath = uploadBasePath.resolve(storedFileName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            deleteExistingProfileImage(user.getProfileImage());
            user.setProfileImage("profiles/" + storedFileName);
            userRepository.save(user);
            userRoleResolver.ensureDefaultRoleIfMissing(user);

            return userResponseFactory.buildProfileResponse(user, "Profile image updated successfully");
        } catch (IOException e) {
            throw new RuntimeException("Failed to store profile image", e);
        }
    }

    public Resource getCurrentUserProfileImage(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getProfileImage() == null || !user.getProfileImage().startsWith("profiles/")) {
            throw new RuntimeException("No profile image found");
        }

        String storedFileName = user.getProfileImage().substring("profiles/".length());
        Path imagePath = Paths.get(uploadDir, "profile-images", storedFileName).toAbsolutePath().normalize();
        Resource resource = new FileSystemResource(imagePath);

        if (!resource.exists()) {
            throw new RuntimeException("Profile image file not found");
        }

        return resource;
    }

    private AuthOutcome processAuthentication(AuthType authType, Object payload) {
        AuthProcessor processor = getProcessor(authType);
        return processor.authenticate(payload);
    }

    private AuthProcessor getProcessor(AuthType authType) {
        return switch (authType) {
            case REGISTER -> this::registerWithEmailPassword;
            case LOGIN -> this::loginWithEmailPassword;
            case OAUTH -> this::loginWithOAuth;
        };
    }

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
        boolean hasUploadedProfileImage = user.getProfileImage() != null && user.getProfileImage().startsWith("profiles/");
        if (oauthData.profileImage() != null && !oauthData.profileImage().isEmpty() &&
                !hasUploadedProfileImage &&
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

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void deleteExistingProfileImage(String profileImage) {
        if (profileImage == null || !profileImage.startsWith("profiles/")) {
            return;
        }

        String storedFileName = profileImage.substring("profiles/".length());
        Path imagePath = Paths.get(uploadDir, "profile-images", storedFileName).toAbsolutePath().normalize();

        try {
            Files.deleteIfExists(imagePath);
        } catch (IOException ignored) {
            // Keep profile updates working even if cleanup fails.
        }
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
