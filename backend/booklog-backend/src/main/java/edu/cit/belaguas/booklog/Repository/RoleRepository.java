package edu.cit.belaguas.booklog.Repository;

import edu.cit.belaguas.booklog.Model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByRoleName(String roleName);

    boolean existsByRoleName(String roleName);
}
