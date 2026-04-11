package com.booklog.mobile

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.booklog.mobile.databinding.ActivityHomeBinding
import com.booklog.mobile.session.SessionManager

class HomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHomeBinding
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        sessionManager = SessionManager(this)
        if (!sessionManager.isLoggedIn()) {
            redirectToLogin()
            return
        }

        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val displayName = sessionManager.getDisplayName().ifBlank { "Reader" }

        binding.welcomeTitleTextView.text = "Welcome Back, ${firstName(displayName)}!"
        binding.avatarTextView.text = initials(displayName)
        binding.avatarTextView.contentDescription = "$displayName profile"

        binding.avatarTextView.setOnClickListener {
            sessionManager.clear()
            redirectToLogin()
        }

        binding.bottomNavigationView.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_dashboard -> true
                R.id.nav_books -> {
                    toastFeature("My Books")
                    true
                }

                R.id.nav_notes -> {
                    toastFeature("Notes")
                    true
                }

                R.id.nav_profile -> {
                    toastFeature("Profile")
                    true
                }

                else -> false
            }
        }
        binding.bottomNavigationView.selectedItemId = R.id.nav_dashboard
    }

    private fun redirectToLogin() {
        startActivity(Intent(this, LoginActivity::class.java))
        finishAffinity()
    }

    private fun firstName(name: String): String {
        return name.trim().split(" ").firstOrNull().orEmpty().ifBlank { "Reader" }
    }

    private fun initials(name: String): String {
        val parts = name.trim().split(" ").filter { it.isNotBlank() }
        if (parts.isEmpty()) return "BL"

        val first = parts.first().first().uppercaseChar()
        val second = parts.getOrNull(1)?.first()?.uppercaseChar()
        return if (second != null) "$first$second" else "$first"
    }

    private fun toastFeature(featureName: String) {
        Toast.makeText(this, "$featureName is coming soon.", Toast.LENGTH_SHORT).show()
    }
}
