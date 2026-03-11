package edu.cit.belaguas.booklog.Model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_logs")
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "emailID")
    private Long emailId;

    @Column(name = "email_type", nullable = false, length = 255)
    private String emailType;

    @Column(name = "status", length = 255)
    private String status;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "userID")
    private User user;

    // Constructors
    public EmailLog() {
        this.sentAt = LocalDateTime.now();
    }

    public EmailLog(String emailType, String status) {
        this.emailType = emailType;
        this.status = status;
        this.sentAt = LocalDateTime.now();
    }

    public EmailLog(String emailType, String status, User user) {
        this(emailType, status);
        this.user = user;
    }

    // Getters and Setters
    public Long getEmailId() {
        return emailId;
    }

    public void setEmailId(Long emailId) {
        this.emailId = emailId;
    }

    public String getEmailType() {
        return emailType;
    }

    public void setEmailType(String emailType) {
        this.emailType = emailType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
