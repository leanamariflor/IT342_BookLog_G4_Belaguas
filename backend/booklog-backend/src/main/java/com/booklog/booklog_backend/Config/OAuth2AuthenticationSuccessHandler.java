package com.booklog.booklog_backend.Config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Value("${app.oauth2.authorized-redirect-uri:http://localhost:5173/oauth2/redirect}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        if (response.isCommitted()) {
            logger.debug("Response has already been committed. Unable to redirect.");
            return;
        }

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        // Extract user information
        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");
        String picture = oAuth2User.getAttribute("picture");

        // Build redirect URL with user data
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("email", URLEncoder.encode(email != null ? email : "", StandardCharsets.UTF_8))
                .queryParam("firstName", URLEncoder.encode(firstName != null ? firstName : "", StandardCharsets.UTF_8))
                .queryParam("lastName", URLEncoder.encode(lastName != null ? lastName : "", StandardCharsets.UTF_8))
                .queryParam("picture", URLEncoder.encode(picture != null ? picture : "", StandardCharsets.UTF_8))
                .queryParam("provider", "google")
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
