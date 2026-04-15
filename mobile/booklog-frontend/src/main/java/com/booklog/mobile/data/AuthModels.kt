package com.booklog.mobile.data

data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
)

data class LoginRequest(
    val email: String,
    val password: String,
)

data class OAuthCallbackRequest(
    val email: String,
    val firstName: String,
    val lastName: String,
    val profileImage: String? = null,
    val provider: String,
)

data class UserResponse(
    val userId: Long? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String? = null,
    val profileImage: String? = null,
    val provider: String? = null,
    val token: String? = null,
    val roles: List<String>? = null,
    val message: String? = null,
)
