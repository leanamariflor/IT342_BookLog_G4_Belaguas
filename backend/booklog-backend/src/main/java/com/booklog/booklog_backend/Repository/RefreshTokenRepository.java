package com.booklog.booklog_backend.Repository;

import com.booklog.booklog_backend.Model.RefreshToken;
import com.booklog.booklog_backend.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByUserAndToken(User user, String token);

    void deleteByUser(User user);

    void deleteByToken(String token);

    long countByUser(User user);
}
