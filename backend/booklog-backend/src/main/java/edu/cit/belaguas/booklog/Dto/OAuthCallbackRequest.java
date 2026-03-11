package edu.cit.belaguas.booklog.Dto;

public class OAuthCallbackRequest {
    
    private String supabaseAccessToken;
    private String email;
    private String firstName;
    private String lastName;
    private String profileImage;
    private String provider;

    public OAuthCallbackRequest() {}

    public String getSupabaseAccessToken() {
        return supabaseAccessToken;
    }

    public void setSupabaseAccessToken(String supabaseAccessToken) {
        this.supabaseAccessToken = supabaseAccessToken;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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
}
