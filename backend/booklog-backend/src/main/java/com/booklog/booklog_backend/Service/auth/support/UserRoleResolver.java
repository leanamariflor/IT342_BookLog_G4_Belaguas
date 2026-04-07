package com.booklog.booklog_backend.Service.auth.support;

import com.booklog.booklog_backend.Model.Role;
import com.booklog.booklog_backend.Model.User;
import com.booklog.booklog_backend.Repository.RoleRepository;
import com.booklog.booklog_backend.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Service
public class UserRoleResolver {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    @Value("${app.security.admin-email:}")
    private String adminEmail;

    public UserRoleResolver(RoleRepository roleRepository, UserRepository userRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
    }

    public Set<Role> resolveRolesForEmail(String email) {
        if (adminEmail != null && !adminEmail.isBlank() && adminEmail.equalsIgnoreCase(email)) {
            return new HashSet<>(Arrays.asList(getDefaultUserRole(), getAdminRole()));
        }
        return new HashSet<>(Collections.singletonList(getDefaultUserRole()));
    }

    public void ensureDefaultRoleIfMissing(User user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            user.setRoles(new HashSet<>(Collections.singletonList(getDefaultUserRole())));
            userRepository.save(user);
        }
    }

    private Role getDefaultUserRole() {
        return roleRepository.findByRoleName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Default role ROLE_USER is not configured"));
    }

    private Role getAdminRole() {
        return roleRepository.findByRoleName("ROLE_ADMIN")
                .orElseThrow(() -> new RuntimeException("Default role ROLE_ADMIN is not configured"));
    }
}
