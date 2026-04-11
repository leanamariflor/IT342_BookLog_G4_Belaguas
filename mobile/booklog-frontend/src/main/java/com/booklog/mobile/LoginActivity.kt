package com.booklog.mobile

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.booklog.mobile.databinding.ActivityLoginBinding
import com.booklog.mobile.network.ApiClient
import com.booklog.mobile.network.AuthRepository
import com.booklog.mobile.session.SessionManager
import com.booklog.mobile.ui.AppToast
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var sessionManager: SessionManager
    private val repository by lazy { AuthRepository(ApiClient.authService) }

    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val data = result.data
        if (data == null) {
            setLoading(false)
            showStatus("Google sign-in was cancelled.")
            return@registerForActivityResult
        }

        val task = GoogleSignIn.getSignedInAccountFromIntent(data)
        try {
            val account = task.getResult(ApiException::class.java)
            if (account == null || account.email.isNullOrBlank()) {
                setLoading(false)
                showStatus("Google account not available.")
                return@registerForActivityResult
            }

            val firstName = account.givenName ?: account.displayName.firstNameFallback()
            val lastName = account.familyName ?: account.displayName.lastNameFallback()

            lifecycleScope.launch {
                val result = repository.loginWithGoogle(
                    email = account.email.orEmpty(),
                    firstName = firstName,
                    lastName = lastName,
                    profileImage = account.photoUrl?.toString()
                )

                setLoading(false)

                result.fold(
                    onSuccess = { response ->
                        sessionManager.saveUser(response)
                        AppToast.show(
                            this@LoginActivity,
                            response.message ?: "Google login successful",
                            type = AppToast.Type.SUCCESS
                        )
                        goToHome()
                    },
                    onFailure = { throwable ->
                        showStatus(throwable.message ?: "Google login failed")
                    }
                )
            }
        } catch (exception: ApiException) {
            setLoading(false)
            showStatus(exception.message ?: "Google sign-in failed.")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        sessionManager = SessionManager(this)
        if (sessionManager.isLoggedIn()) {
            goToHome()
            return
        }

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.loginButton.setOnClickListener {
            attemptLogin()
        }

        binding.registerButton.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        binding.googleButton.setOnClickListener {
            startGoogleLogin()
        }

        binding.emailEditText.setText(intent.getStringExtra(EXTRA_EMAIL).orEmpty())
        intent.getStringExtra(EXTRA_MESSAGE)?.let {
            binding.statusTextView.text = it
            AppToast.show(this, it, type = AppToast.Type.SUCCESS)
        }
    }

    private fun attemptLogin() {
        clearErrors()

        val email = binding.emailEditText.text?.toString()?.trim().orEmpty()
        val password = binding.passwordEditText.text?.toString().orEmpty()

        var isValid = true

        if (email.isBlank() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.emailInputLayout.error = "Enter a valid email address"
            isValid = false
        }

        if (password.isBlank()) {
            binding.passwordInputLayout.error = "Password is required"
            isValid = false
        }

        if (!isValid) {
            return
        }

        setLoading(true)

        lifecycleScope.launch {
            val result = repository.login(email, password)
            setLoading(false)

            result.fold(
                onSuccess = { response ->
                    sessionManager.saveUser(response)
                    AppToast.show(
                        this@LoginActivity,
                        response.message ?: "Login successful",
                        type = AppToast.Type.SUCCESS
                    )
                    goToHome()
                },
                onFailure = { throwable ->
                    showStatus(throwable.message ?: "Login failed")
                }
            )
        }
    }

    private fun clearErrors() {
        binding.emailInputLayout.error = null
        binding.passwordInputLayout.error = null
        binding.statusTextView.text = ""
    }

    private fun startGoogleLogin() {
        clearErrors()
        setLoading(true)

        val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .build()

        val client = GoogleSignIn.getClient(this, options)
        googleSignInLauncher.launch(client.signInIntent)
    }

    private fun showStatus(message: String) {
        binding.statusTextView.text = message
        AppToast.show(this, message, type = AppToast.Type.ERROR)
    }

    private fun setLoading(isLoading: Boolean) {
        binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        binding.loginButton.isEnabled = !isLoading
        binding.googleButton.isEnabled = !isLoading
        binding.registerButton.isEnabled = !isLoading
    }

    private fun goToHome() {
        startActivity(Intent(this, HomeActivity::class.java))
        finishAffinity()
    }

    companion object {
        const val EXTRA_EMAIL = "extra_email"
        const val EXTRA_MESSAGE = "extra_message"
    }
}

private fun String?.firstNameFallback(): String {
    return this.orEmpty().trim().split(" ").firstOrNull().orEmpty().ifBlank { "Reader" }
}

private fun String?.lastNameFallback(): String {
    return this.orEmpty().trim().split(" ").drop(1).joinToString(" ").trim()
}
