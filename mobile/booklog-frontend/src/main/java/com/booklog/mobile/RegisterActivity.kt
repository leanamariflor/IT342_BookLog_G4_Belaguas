package com.booklog.mobile

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.booklog.mobile.databinding.ActivityRegisterBinding
import com.booklog.mobile.network.ApiClient
import com.booklog.mobile.network.AuthRepository
import com.booklog.mobile.session.SessionManager
import com.booklog.mobile.ui.AppToast
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var sessionManager: SessionManager
    private val repository by lazy { AuthRepository(ApiClient.authService) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        sessionManager = SessionManager(this)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.registerButton.setOnClickListener {
            attemptRegister()
        }

        binding.loginButton.setOnClickListener {
            finish()
        }

        binding.googleButton.setOnClickListener {
            AppToast.show(
                this,
                "Google sign up is available in web for now.",
                type = AppToast.Type.INFO
            )
        }
    }

    private fun attemptRegister() {
        clearErrors()

        val firstName = binding.firstNameEditText.text?.toString()?.trim().orEmpty()
        val lastName = binding.lastNameEditText.text?.toString()?.trim().orEmpty()
        val email = binding.emailEditText.text?.toString()?.trim().orEmpty()
        val password = binding.passwordEditText.text?.toString().orEmpty()
        val confirmPassword = binding.confirmPasswordEditText.text?.toString().orEmpty()

        var isValid = true

        if (firstName.isBlank()) {
            binding.firstNameInputLayout.error = "First name is required"
            isValid = false
        }

        if (lastName.isBlank()) {
            binding.lastNameInputLayout.error = "Last name is required"
            isValid = false
        }

        if (email.isBlank() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.emailInputLayout.error = "Enter a valid email address"
            isValid = false
        }

        if (password.length < 6) {
            binding.passwordInputLayout.error = "Password must be at least 6 characters"
            isValid = false
        }

        if (confirmPassword != password) {
            binding.confirmPasswordInputLayout.error = "Passwords do not match"
            isValid = false
        }

        if (!isValid) {
            return
        }

        setLoading(true)

        lifecycleScope.launch {
            val result = repository.register(firstName, lastName, email, password)
            setLoading(false)

            result.fold(
                onSuccess = { response ->
                    sessionManager.saveUser(response)

                    AppToast.show(
                        this@RegisterActivity,
                        response.message ?: "Registration successful",
                        type = AppToast.Type.SUCCESS
                    )

                    if (!response.token.isNullOrBlank()) {
                        val intent = Intent(this@RegisterActivity, HomeActivity::class.java)
                        startActivity(intent)
                        finishAffinity()
                    } else {
                        val intent = Intent(this@RegisterActivity, LoginActivity::class.java)
                        intent.putExtra(LoginActivity.EXTRA_EMAIL, email)
                        intent.putExtra(LoginActivity.EXTRA_MESSAGE, "Registration successful. Please log in.")
                        startActivity(intent)
                        finish()
                    }
                },
                onFailure = { throwable ->
                    showStatus(throwable.message ?: "Registration failed")
                }
            )
        }
    }

    private fun clearErrors() {
        binding.firstNameInputLayout.error = null
        binding.lastNameInputLayout.error = null
        binding.emailInputLayout.error = null
        binding.passwordInputLayout.error = null
        binding.confirmPasswordInputLayout.error = null
        binding.statusTextView.text = ""
    }

    private fun showStatus(message: String) {
        binding.statusTextView.text = message
        AppToast.show(this, message, type = AppToast.Type.ERROR)
    }

    private fun setLoading(isLoading: Boolean) {
        binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        binding.registerButton.isEnabled = !isLoading
        binding.googleButton.isEnabled = !isLoading
        binding.loginButton.isEnabled = !isLoading
    }
}
