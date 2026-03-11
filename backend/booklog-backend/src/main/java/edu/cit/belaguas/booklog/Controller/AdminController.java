package edu.cit.belaguas.booklog.Controller;

import edu.cit.belaguas.booklog.Model.Role;
import edu.cit.belaguas.booklog.Service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final RoleService roleService;

    public AdminController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping("/roles")
    public List<Role> getRoles() {
        return roleService.getAllRoles();
    }

    @PostMapping("/roles")
    public ResponseEntity<Role> createRole(@RequestBody Map<String, String> payload) {
        String roleName = payload.getOrDefault("roleName", "").trim();
        if (roleName.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String normalizedRoleName = roleName.startsWith("ROLE_") ? roleName.toUpperCase() : "ROLE_" + roleName.toUpperCase();
        Role role = roleService.createRole(normalizedRoleName);
        return ResponseEntity.ok(role);
    }
}
