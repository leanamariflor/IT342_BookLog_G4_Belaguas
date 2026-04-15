package edu.cit.belaguas.booklog.Service;

import edu.cit.belaguas.booklog.Model.User;
import edu.cit.belaguas.booklog.Repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final int OAUTH_PROVIDER_MAX_LENGTH = 50;
    private static final int PROFILE_IMAGE_MAX_LENGTH = 50;

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // Get provider (google)
        String provider = userRequest.getClientRegistration().getRegistrationId();
        
        // Extract user information
        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");
        String picture = oAuth2User.getAttribute("picture");

        String normalizedProvider = normalizeForColumn(provider, OAUTH_PROVIDER_MAX_LENGTH);
        String normalizedPicture = normalizeForColumn(picture, PROFILE_IMAGE_MAX_LENGTH);

        // Check if user exists, if not create new user
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setFirstName(firstName);
                    newUser.setLastName(lastName);
                    newUser.setProfileImage(normalizedPicture);
                    newUser.setOauthProvider(normalizedProvider);
                    newUser.setPassword(""); // Empty password for OAuth users
                    return userRepository.save(newUser);
                });

        // Update existing user if needed
        if (user.getOauthProvider() == null || !user.getOauthProvider().equals(normalizedProvider)) {
            user.setOauthProvider(normalizedProvider);
        }
        if (user.getProfileImage() == null || !user.getProfileImage().equals(normalizedPicture)) {
            user.setProfileImage(normalizedPicture);
        }
        userRepository.save(user);

        return oAuth2User;
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
