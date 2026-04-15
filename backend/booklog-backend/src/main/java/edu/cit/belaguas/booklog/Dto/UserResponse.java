package edu.cit.belaguas.booklog.Dto;

import java.util.List;

public class UserResponse {

    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String profileImage;
    private String provider;
    private String token;
    private List<String> roles;
    private String message;

    public UserResponse() {}

    public UserResponse(Long userId, String firstName, String lastName, String email, String profileImage, String message) {
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.profileImage = profileImage;
        this.message = message;
    }

    public UserResponse(Long userId, String firstName, String lastName, String email, String profileImage, String provider, String token, String message) {
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.profileImage = profileImage;
        this.provider = provider;
        this.token = token;
        this.message = message;
    }

    public UserResponse(Long userId, String firstName, String lastName, String email, String profileImage, String provider, String token, List<String> roles, String message) {
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.profileImage = profileImage;
        this.provider = provider;
        this.token = token;
        this.roles = roles;
        this.message = message;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
}
