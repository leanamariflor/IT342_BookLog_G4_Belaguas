package edu.cit.belaguas.booklog.Model;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "roleID")
    private Long roleId;

    @Column(name = "roleName", nullable = false, length = 50)
    private String roleName;

    @ManyToMany(mappedBy = "roles", fetch = jakarta.persistence.FetchType.LAZY)
    private Set<User> users = new HashSet<>();

    // Constructors
    public Role() {}

    public Role(String roleName) {
        this.roleName = roleName;
    }

    // Getters and Setters
    public Long getRoleId() {
        return roleId;
    }

    public void setRoleId(Long roleId) {
        this.roleId = roleId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public Set<User> getUsers() {
        return users;
    }

    public void setUsers(Set<User> users) {
        this.users = users;
    }
}
