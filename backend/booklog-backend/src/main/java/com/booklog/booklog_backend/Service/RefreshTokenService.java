package com.booklog.booklog_backend.Service;

import com.booklog.booklog_backend.Model.RefreshToken;
import com.booklog.booklog_backend.Model.User;
import com.booklog.booklog_backend.Repository.RefreshTokenRepository;
import com.booklog.booklog_backend.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, 
                             UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    public RefreshToken createRefreshToken(Long userId, String token, LocalDateTime expiryDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        RefreshToken refreshToken = new RefreshToken(token, expiryDate, user);
        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken getRefreshToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));
    }

    public RefreshToken validateRefreshToken(String token) {
        RefreshToken refreshToken = getRefreshToken(token);
        
        if (refreshToken.isExpired()) {
            deleteRefreshToken(token);
            throw new RuntimeException("Refresh token has expired");
        }
        
        return refreshToken;
    }

    public boolean tokenExists(String token) {
        return refreshTokenRepository.findByToken(token).isPresent();
    }

    public void deleteRefreshToken(String token) {
        refreshTokenRepository.deleteByToken(token);
    }

    public void deleteUserRefreshTokens(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        refreshTokenRepository.deleteByUser(user);
    }

    public long getUserTokenCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        return refreshTokenRepository.countByUser(user);
    }

    public void cleanExpiredTokens() {
        refreshTokenRepository.findAll().stream()
                .filter(RefreshToken::isExpired)
                .forEach(token -> refreshTokenRepository.deleteByToken(token.getToken()));
    }
}
