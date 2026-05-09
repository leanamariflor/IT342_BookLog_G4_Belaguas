package com.booklog.mobile.feature.auth.network

import com.booklog.mobile.feature.auth.data.LoginRequest
import com.booklog.mobile.feature.auth.data.OAuthCallbackRequest
import com.booklog.mobile.feature.auth.data.RegisterRequest
import com.booklog.mobile.feature.auth.data.UserResponse
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
