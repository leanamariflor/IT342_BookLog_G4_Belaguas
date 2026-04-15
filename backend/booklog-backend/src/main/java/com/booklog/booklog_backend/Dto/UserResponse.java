package com.booklog.booklog_backend.Dto;

import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

public class UserResponse {

    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String profileImage;
    private LocalDateTime createdAt;
    private String provider;
    private String username;
    private String location;
    private String bio;
    private Map<Integer, Integer> readingGoals;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Map<Integer, Integer> getReadingGoals() {
        return readingGoals;
    }

    public void setReadingGoals(Map<Integer, Integer> readingGoals) {
        this.readingGoals = readingGoals;
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
