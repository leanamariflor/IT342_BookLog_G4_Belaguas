package com.booklog.mobile.ui

import android.app.Activity
import android.view.Gravity
import android.view.LayoutInflater
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import com.booklog.mobile.R

object AppToast {

    enum class Type {
        SUCCESS,
        ERROR,
        INFO,
    }

    fun show(activity: Activity, message: String, type: Type = Type.INFO, isLong: Boolean = true) {
        val view = LayoutInflater.from(activity).inflate(R.layout.toast_app, null)

        val iconView = view.findViewById<ImageView>(R.id.toastIcon)
        val messageView = view.findViewById<TextView>(R.id.toastMessage)

        messageView.text = message

        val (backgroundRes, iconRes) = when (type) {
            Type.SUCCESS -> R.drawable.bg_toast_success to android.R.drawable.checkbox_on_background
            Type.ERROR -> R.drawable.bg_toast_error to android.R.drawable.ic_dialog_alert
            Type.INFO -> R.drawable.bg_toast_info to android.R.drawable.ic_dialog_info
        }

        view.background = ContextCompat.getDrawable(activity, backgroundRes)
        iconView.setImageResource(iconRes)
        iconView.setColorFilter(ContextCompat.getColor(activity, android.R.color.white))

        val toast = Toast(activity.applicationContext)
        toast.view = view
        toast.duration = if (isLong) Toast.LENGTH_LONG else Toast.LENGTH_SHORT
        toast.setGravity(Gravity.TOP or Gravity.CENTER_HORIZONTAL, 0, 140)
        toast.show()
    }
}
