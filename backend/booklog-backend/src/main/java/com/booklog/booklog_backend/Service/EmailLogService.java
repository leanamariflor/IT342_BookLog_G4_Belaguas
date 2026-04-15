package com.booklog.booklog_backend.Service;

import com.booklog.booklog_backend.Model.EmailLog;
import com.booklog.booklog_backend.Model.User;
import com.booklog.booklog_backend.Repository.EmailLogRepository;
import com.booklog.booklog_backend.Repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class EmailLogService {

    private final EmailLogRepository emailLogRepository;
    private final UserRepository userRepository;

    public EmailLogService(EmailLogRepository emailLogRepository, UserRepository userRepository) {
        this.emailLogRepository = emailLogRepository;
        this.userRepository = userRepository;
    }

    public EmailLog getEmailLogById(Long emailId) {
        return emailLogRepository.findById(emailId)
                .orElseThrow(() -> new RuntimeException("Email log not found with id: " + emailId));
    }

    public Page<EmailLog> getEmailLogsByUser(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        return emailLogRepository.findByUser(user, pageable);
    }

    public Page<EmailLog> getEmailLogsByType(String emailType, Pageable pageable) {
        return emailLogRepository.findByEmailType(emailType, pageable);
    }

    public Page<EmailLog> getEmailLogsByStatus(String status, Pageable pageable) {
        return emailLogRepository.findByStatus(status, pageable);
    }

    public EmailLog createEmailLog(Long userId, String emailType, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        EmailLog emailLog = new EmailLog(emailType, status, user);
        return emailLogRepository.save(emailLog);
    }

    public EmailLog createEmailLog(String emailType, String status) {
        EmailLog emailLog = new EmailLog(emailType, status);
        return emailLogRepository.save(emailLog);
    }

    public EmailLog updateEmailLog(Long emailId, String status) {
        EmailLog emailLog = getEmailLogById(emailId);
        emailLog.setStatus(status);
        return emailLogRepository.save(emailLog);
    }

    public void deleteEmailLog(Long emailId) {
        EmailLog emailLog = getEmailLogById(emailId);
        emailLogRepository.delete(emailLog);
    }

    public long getUserSentEmailCount(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        return emailLogRepository.countByUserAndStatus(user, status);
    }
}
