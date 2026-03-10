package com.booklog.booklog_backend.Config;

import com.booklog.booklog_backend.Model.Role;
import com.booklog.booklog_backend.Repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RoleSeederConfig {

    @Bean
    CommandLineRunner seedDefaultRoles(RoleRepository roleRepository) {
        return args -> {
            createRoleIfMissing(roleRepository, "ROLE_USER");
            createRoleIfMissing(roleRepository, "ROLE_ADMIN");
        };
    }

    private void createRoleIfMissing(RoleRepository roleRepository, String roleName) {
        if (!roleRepository.existsByRoleName(roleName)) {
            roleRepository.save(new Role(roleName));
        }
    }
}
