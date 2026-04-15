package com.booklog.booklog_backend.Repository;

import com.booklog.booklog_backend.Model.EmailLog;
import com.booklog.booklog_backend.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {

    Page<EmailLog> findByUser(User user, Pageable pageable);

    Page<EmailLog> findByEmailType(String emailType, Pageable pageable);

    Page<EmailLog> findByStatus(String status, Pageable pageable);

    long countByUserAndStatus(User user, String status);
}
