package com.booklog.booklog_backend.Dto;

import java.util.Map;

public class ProfileUpdateRequest {

    private String firstName;
    private String lastName;
    private String username;
    private String location;
    private String bio;
    private Map<Integer, Integer> readingGoals;

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
}
