package com.booklog.mobile.session

import android.content.Context
import com.booklog.mobile.data.UserResponse

class SessionManager(context: Context) {

    private val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

    fun saveUser(user: UserResponse) {
        preferences.edit()
            .putString(KEY_TOKEN, user.token)
            .putLong(KEY_USER_ID, user.userId ?: -1L)
            .putString(KEY_FIRST_NAME, user.firstName)
            .putString(KEY_LAST_NAME, user.lastName)
            .putString(KEY_EMAIL, user.email)
            .putString(KEY_PROFILE_IMAGE, user.profileImage)
            .apply()
    }

    fun isLoggedIn(): Boolean {
        return !preferences.getString(KEY_TOKEN, null).isNullOrBlank()
    }

    fun getDisplayName(): String {
        val firstName = preferences.getString(KEY_FIRST_NAME, null).orEmpty()
        val lastName = preferences.getString(KEY_LAST_NAME, null).orEmpty()
        val fullName = listOf(firstName, lastName)
            .filter { it.isNotBlank() }
            .joinToString(" ")

        return if (fullName.isBlank()) {
            "BookLog User"
        } else {
            fullName
        }
    }

    fun getEmail(): String {
        return preferences.getString(KEY_EMAIL, "") ?: ""
    }

    fun getToken(): String {
        return preferences.getString(KEY_TOKEN, "") ?: ""
    }

    fun clear() {
        preferences.edit().clear().apply()
    }

    private companion object {
        private const val PREFERENCES_NAME = "booklog_session"
        private const val KEY_TOKEN = "token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_FIRST_NAME = "first_name"
        private const val KEY_LAST_NAME = "last_name"
        private const val KEY_EMAIL = "email"
        private const val KEY_PROFILE_IMAGE = "profile_image"
    }
}
