package com.sabaychat.android

import android.os.Bundle
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONArray

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            var showChat by remember { mutableStateOf(false) }
            SabayChatTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    if (showChat) {
                        ChatScreen()
                    } else {
                        WelcomeScreen(onAuthenticated = { showChat = true })
                    }
                }
            }
        }
    }
}

@Composable
fun WelcomeScreen(onAuthenticated: () -> Unit) {
    var registerMode by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text("SabayChart", fontSize = 32.sp, style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(24.dp))
        if (registerMode) {
            OutlinedTextField(name, { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(12.dp))
        }
        OutlinedTextField(email, { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(password, { password = it }, label = { Text("Password") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(16.dp))
        Button(
            onClick = {
                loading = true
                status = ""
                scope.launch {
                    val result = authenticate(registerMode, name, email, password)
                    loading = false
                    if (result == null) onAuthenticated() else status = result
                }
            },
            enabled = !loading,
            modifier = Modifier.fillMaxWidth()
        ) { Text(if (loading) "Please wait..." else if (registerMode) "Create account" else "Login") }
        Spacer(Modifier.height(8.dp))
        Button(onClick = { registerMode = !registerMode; status = "" }, modifier = Modifier.fillMaxWidth()) {
            Text(if (registerMode) "Back to login" else "Create account")
        }
        if (status.isNotEmpty()) Text(status, modifier = Modifier.padding(top = 12.dp))
    }
}

@Composable
private fun ChatScreen() {
    var chats by remember { mutableStateOf<List<Pair<String, String>>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    LaunchedEffect(Unit) {
        try {
            chats = loadConversations()
            if (chats.isEmpty()) error = "No conversations yet."
        } catch (_: Exception) {
            error = "Cannot connect to the server."
        } finally {
            loading = false
        }
    }
    Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp, vertical = 24.dp)
    ) {
        Text("SabayChart", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(16.dp))
        Text("All Chats", color = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(12.dp))
        if (loading) {
            Text("Loading your chats...")
        } else if (error.isNotEmpty()) {
            Text(error)
        } else {
            chats.forEach { (name, message) ->
                Column(modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp)) {
                    Text(name, style = MaterialTheme.typography.titleMedium)
                    Text(message, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}

private fun loadConversations(): List<Pair<String, String>> {
    val connection = URL("https://chart-ztyk.onrender.com/api/conversations").openConnection() as HttpURLConnection
    return try {
        connection.connectTimeout = 15000
        connection.readTimeout = 15000
        if (connection.responseCode !in 200..299) throw IllegalStateException()
        val json = connection.inputStream.bufferedReader().use { it.readText() }
        val array = JSONArray(json)
        List(array.length()) { index ->
            val item = array.getJSONObject(index)
            val lastMessage = item.optJSONObject("lastMessage")?.optString("text") ?: "No messages yet"
            item.optString("name", "Conversation") to lastMessage
        }
    } finally {
        connection.disconnect()
    }
}

private suspend fun authenticate(register: Boolean, name: String, email: String, password: String): String? = withContext(Dispatchers.IO) {
    if (email.isBlank() || password.isBlank() || (register && name.isBlank())) return@withContext "Complete all fields."
    if (register && password.length < 6) return@withContext "Password must be at least 6 characters."
    val connection = (URL("https://chart-ztyk.onrender.com/api/auth/${if (register) "register" else "login"}").openConnection() as HttpURLConnection)
    try {
        connection.requestMethod = "POST"
        connection.connectTimeout = 15000
        connection.readTimeout = 15000
        connection.doOutput = true
        connection.setRequestProperty("Content-Type", "application/json")
        val body = if (register) "{\"name\":\"${name.jsonEscape()}\",\"email\":\"${email.jsonEscape()}\",\"password\":\"${password.jsonEscape()}\"}" else "{\"email\":\"${email.jsonEscape()}\",\"password\":\"${password.jsonEscape()}\"}"
        connection.outputStream.use { it.write(body.toByteArray()) }
        if (connection.responseCode in 200..299) null else "Server error (${connection.responseCode})."
    } catch (_: Exception) {
        "Cannot connect to the server. Check your internet connection."
    } finally {
        connection.disconnect()
    }
}

private fun String.jsonEscape() = replace("\\", "\\\\").replace("\"", "\\\"")
