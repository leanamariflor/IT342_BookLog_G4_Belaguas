package edu.cit.belaguas.booklog.Service;

import edu.cit.belaguas.booklog.Dto.LoginRequest;
import edu.cit.belaguas.booklog.Dto.OAuthCallbackRequest;
import edu.cit.belaguas.booklog.Dto.RegisterRequest;
import edu.cit.belaguas.booklog.Dto.UserResponse;
import edu.cit.belaguas.booklog.Model.Role;
import edu.cit.belaguas.booklog.Model.User;
import edu.cit.belaguas.booklog.Repository.RoleRepository;
import edu.cit.belaguas.booklog.Repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AuthService {

    private static final int OAUTH_PROVIDER_MAX_LENGTH = 50;
    private static final int PROFILE_IMAGE_MAX_LENGTH = 50;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${app.security.admin-email:}")
    private String adminEmail;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public UserResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFirstName(),
                request.getLastName()
        );

        user.setRoles(getRolesForEmail(request.getEmail()));

        userRepository.save(user);

        String token = jwtService.generateToken(user);

        return new UserResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getProfileImage(),
            user.getOauthProvider(),
            token,
            getRoleNames(user),
                "User registered successfully"
        );
    }

    public UserResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        ensureDefaultRoleIfMissing(user);

        String token = jwtService.generateToken(user);

        return new UserResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getProfileImage(),
                user.getOauthProvider(),
                token,
                getRoleNames(user),
                "Login successful"
        );
    }

    public UserResponse handleSupabaseOAuth(OAuthCallbackRequest request) {
        String normalizedProvider = normalizeForColumn(request.getProvider(), OAUTH_PROVIDER_MAX_LENGTH);
        String normalizedProfileImage = normalizeForColumn(request.getProfileImage(), PROFILE_IMAGE_MAX_LENGTH);

        // Find or create user based on email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(request.getEmail());
                    newUser.setFirstName(request.getFirstName());
                    newUser.setLastName(request.getLastName());
                    newUser.setProfileImage(normalizedProfileImage);
                    newUser.setOauthProvider(normalizedProvider);
                    newUser.setPassword(""); // Empty password for OAuth users
                    newUser.setRoles(getRolesForEmail(request.getEmail()));
                    return userRepository.save(newUser);
                });

        ensureDefaultRoleIfMissing(user);

        // Update existing user if needed
        boolean needsUpdate = false;
        
        if (user.getOauthProvider() == null || !user.getOauthProvider().equals(normalizedProvider)) {
            user.setOauthProvider(normalizedProvider);
            needsUpdate = true;
        }
        
        if (normalizedProfileImage != null && !normalizedProfileImage.isEmpty() &&
            (user.getProfileImage() == null || !user.getProfileImage().equals(normalizedProfileImage))) {
            user.setProfileImage(normalizedProfileImage);
            needsUpdate = true;
        }
        
        if (user.getFirstName() == null && request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
            needsUpdate = true;
        }
        
        if (user.getLastName() == null && request.getLastName() != null) {
            user.setLastName(request.getLastName());
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user);
        
        return new UserResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getProfileImage(),
                normalizedProvider,
                token,
                getRoleNames(user),
                "OAuth login successful"
        );
    }

    public UserResponse authenticateWithGoogleOAuth2User(OAuth2User oAuth2User) {
        if (oAuth2User == null) {
            throw new IllegalArgumentException("OAuth2 user is missing");
        }

        String email = oAuth2User.getAttribute("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("OAuth2 email is missing");
        }

        OAuthCallbackRequest request = new OAuthCallbackRequest();
        request.setEmail(email);
        request.setFirstName(oAuth2User.getAttribute("given_name"));
        request.setLastName(oAuth2User.getAttribute("family_name"));
        request.setProfileImage(oAuth2User.getAttribute("picture"));
        request.setProvider("google");

        return handleSupabaseOAuth(request);
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ensureDefaultRoleIfMissing(user);

        return new UserResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getProfileImage(),
                user.getOauthProvider(),
                null,
                getRoleNames(user),
                "Current user fetched"
        );
    }

    private Role getDefaultUserRole() {
        return roleRepository.findByRoleName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Default role ROLE_USER is not configured"));
    }

    private Role getAdminRole() {
        return roleRepository.findByRoleName("ROLE_ADMIN")
                .orElseThrow(() -> new RuntimeException("Default role ROLE_ADMIN is not configured"));
    }

    private Set<Role> getRolesForEmail(String email) {
        if (adminEmail != null && !adminEmail.isBlank() && adminEmail.equalsIgnoreCase(email)) {
            return new HashSet<>(Arrays.asList(getDefaultUserRole(), getAdminRole()));
        }
        return new HashSet<>(Collections.singletonList(getDefaultUserRole()));
    }

    private void ensureDefaultRoleIfMissing(User user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            user.setRoles(new HashSet<>(Collections.singletonList(getDefaultUserRole())));
            userRepository.save(user);
        }
    }

    private List<String> getRoleNames(User user) {
        return user.getRoles().stream()
                .map(Role::getRoleName)
                .toList();
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
}