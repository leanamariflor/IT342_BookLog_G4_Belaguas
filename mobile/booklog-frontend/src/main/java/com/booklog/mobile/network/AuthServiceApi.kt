package com.booklog.mobile.network

import com.booklog.mobile.data.LoginRequest
import com.booklog.mobile.data.OAuthCallbackRequest
import com.booklog.mobile.data.RegisterRequest
import com.booklog.mobile.data.UserResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthServiceApi {

    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<UserResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<UserResponse>

    @POST("api/auth/oauth/callback")
    suspend fun oauthCallback(@Body request: OAuthCallbackRequest): Response<UserResponse>
}
