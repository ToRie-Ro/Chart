package com.sabaychat.android

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val SabayDarkColors = darkColorScheme(
    primary = Color(0xFF1D6BFF),
    secondary = Color(0xFF0F4CC9),
    background = Color(0xFF0B0F1A),
    surface = Color(0xFF111C2D),
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
)

@Composable
fun SabayChatTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = SabayDarkColors,
        content = content
    )
}
