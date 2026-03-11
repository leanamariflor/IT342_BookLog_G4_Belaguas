package edu.cit.belaguas.booklog.Config;

import edu.cit.belaguas.booklog.Dto.UserResponse;
import edu.cit.belaguas.booklog.Service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Value("${app.oauth2.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private final AuthService authService;

    public OAuth2AuthenticationSuccessHandler(@Lazy AuthService authService) {
        this.authService = authService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof OAuth2User oAuth2User)) {
            response.sendRedirect(frontendUrl + "/auth/callback?error=oauth2_principal_invalid");
            return;
        }

        try {
            UserResponse authResponse = authService.authenticateWithGoogleOAuth2User(oAuth2User);
            if (authResponse == null || authResponse.getToken() == null || authResponse.getToken().isBlank()) {
                throw new IllegalArgumentException("No token received from server");
            }
            String encodedToken = URLEncoder.encode(authResponse.getToken(), StandardCharsets.UTF_8);
            response.sendRedirect(frontendUrl + "/auth/callback?token=" + encodedToken);
        } catch (Exception ex) {
            String encodedMessage = URLEncoder.encode(ex.getMessage(), StandardCharsets.UTF_8);
            response.sendRedirect(frontendUrl + "/auth/callback?error=" + encodedMessage);
        }
    }
}
