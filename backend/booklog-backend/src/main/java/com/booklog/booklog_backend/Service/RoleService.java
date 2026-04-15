package com.booklog.booklog_backend.Service;

import com.booklog.booklog_backend.Model.Role;
import com.booklog.booklog_backend.Repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public Role getRoleById(Long roleId) {
        return roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));
    }

    public Role getRoleByName(String roleName) {
        return roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found with name: " + roleName));
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public Role createRole(String roleName) {
        if (roleRepository.existsByRoleName(roleName)) {
            throw new RuntimeException("Role already exists: " + roleName);
        }
        Role role = new Role(roleName);
        return roleRepository.save(role);
    }

    public Role updateRole(Long roleId, String roleName) {
        Role role = getRoleById(roleId);
        
        if (!role.getRoleName().equals(roleName) && roleRepository.existsByRoleName(roleName)) {
            throw new RuntimeException("Role name already exists: " + roleName);
        }
        
        role.setRoleName(roleName);
        return roleRepository.save(role);
    }

    public void deleteRole(Long roleId) {
        Role role = getRoleById(roleId);
        roleRepository.delete(role);
    }

    public boolean roleExists(String roleName) {
        return roleRepository.existsByRoleName(roleName);
    }
}
