package com.booklog.mobile.network

import com.booklog.mobile.data.LoginRequest
import com.booklog.mobile.data.OAuthCallbackRequest
import com.booklog.mobile.data.RegisterRequest
import com.booklog.mobile.data.UserResponse
import retrofit2.Response
import java.io.IOException

class AuthRepository(
    private val service: AuthServiceApi,
) {

    suspend fun register(firstName: String, lastName: String, email: String, password: String): Result<UserResponse> {
        return execute { service.register(RegisterRequest(firstName, lastName, email, password)) }
    }

    suspend fun login(email: String, password: String): Result<UserResponse> {
        return execute { service.login(LoginRequest(email, password)) }
    }

    suspend fun loginWithGoogle(
        email: String,
        firstName: String,
        lastName: String,
        profileImage: String?,
    ): Result<UserResponse> {
        return execute {
            service.oauthCallback(
                OAuthCallbackRequest(
                    email = email,
                    firstName = firstName,
                    lastName = lastName,
                    profileImage = profileImage,
                    provider = "google"
                )
            )
        }
    }

    private suspend fun execute(call: suspend () -> Response<UserResponse>): Result<UserResponse> {
        return try {
            val response = call()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Result.success(body)
                } else {
                    Result.failure(IllegalStateException("Server returned an empty response."))
                }
            } else {
                Result.failure(IllegalStateException(parseError(response)))
            }
        } catch (exception: IOException) {
            Result.failure(IllegalStateException("Network error. Check your backend connection."))
        } catch (exception: Exception) {
            Result.failure(IllegalStateException(exception.message ?: "Unexpected authentication error."))
        }
    }

    private fun parseError(response: Response<UserResponse>): String {
        val rawError = response.errorBody()?.string()?.trim().orEmpty()
        if (rawError.isNotEmpty()) {
            return rawError
        }

        return when (response.code()) {
            400 -> "Invalid request. Please check your inputs."
            401 -> "Invalid login credentials."
            409 -> "An account with this email already exists."
            else -> "Request failed with status ${response.code()}."
        }
    }
}
