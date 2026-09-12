package com.sabaychat.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bell
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Settings
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

private const val API_BASE_URL = "https://chart-ztyk.onrender.com"
private val Navy = Color(0xFF091326)
private val Blue = Color(0xFF176BFF)
private val Muted = Color(0xFF8490A5)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { SabayChatTheme { Surface(Modifier.fillMaxSize(), color = Navy) { AppRoot() } } }
    }
}

@Composable
private fun AppRoot() {
    val context = LocalContext.current
    val preferences = remember { context.getSharedPreferences("sabaychart_session", 0) }
    var authenticated by remember { mutableStateOf(preferences.getBoolean("authenticated", false)) }
    var profile by remember { mutableStateOf(UserProfile(preferences.getString("name", "Da Rea") ?: "Da Rea", preferences.getString("email", "") ?: "", preferences.getString("token", "") ?: "")) }
    if (authenticated) ChatHome(profile, onLogout = { preferences.edit().clear().apply(); authenticated = false })
    else AuthScreen { user -> preferences.edit().putBoolean("authenticated", true).putString("name", user.name).putString("email", user.email).putString("token", user.token).apply(); profile = user; authenticated = true }
}

@Composable
private fun AuthScreen(onAuthenticated: (UserProfile) -> Unit) {
    var register by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val keyboard = LocalSoftwareKeyboardController.current

    Column(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Blue, Color(0xFF102D7A)))).padding(24.dp), verticalArrangement = Arrangement.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            Text("SabayChart", color = Color.White, fontSize = 34.sp, style = MaterialTheme.typography.headlineLarge)
            Text("Connect with friends across Cambodia", color = Color.White.copy(alpha = .75f))
        }
        Spacer(Modifier.height(32.dp))
        Column(Modifier.fillMaxWidth().background(Color.White.copy(alpha = .1f), RoundedCornerShape(24.dp)).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(if (register) "Create account" else "Welcome back", color = Color.White, style = MaterialTheme.typography.headlineSmall)
            if (register) Field(name, { name = it }, "Name", KeyboardType.Text, ImeAction.Next)
            Field(email, { email = it }, "Email", KeyboardType.Email, ImeAction.Next)
            Field(password, { password = it }, "Password", KeyboardType.Password, ImeAction.Done, true, keyboard)
            if (status.isNotEmpty()) Text(status, color = Color.White.copy(alpha = .9f))
            Button(enabled = !loading, onClick = {
                keyboard?.hide(); loading = true; status = ""
                scope.launch {
                    val result = authenticate(register, name, email, password)
                    loading = false
                    if (result.second == null) onAuthenticated(result.first!!) else status = result.second!!
                }
            }, modifier = Modifier.fillMaxWidth()) { if (loading) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White) else Text(if (register) "Create account" else "Login") }
            TextButton(onClick = { register = !register; status = "" }, modifier = Modifier.fillMaxWidth()) { Text(if (register) "Back to login" else "Create account", color = Color.White) }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun Field(value: String, onValue: (String) -> Unit, label: String, type: KeyboardType, action: ImeAction, password: Boolean = false, keyboard: androidx.compose.ui.platform.SoftwareKeyboardController? = null) {
    OutlinedTextField(value, onValue, label = { Text(label) }, singleLine = true, keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = type, imeAction = action), keyboardActions = androidx.compose.foundation.text.KeyboardActions(onDone = { keyboard?.hide() }), visualTransformation = if (password) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None, modifier = Modifier.fillMaxWidth())
}

@Composable
private fun ChatHome(profile: UserProfile, onLogout: () -> Unit) {
    var chats by remember { mutableStateOf<List<Chat>>(emptyList()) }
    var search by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var showProfile by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf<Chat?>(null) }
    var tab by remember { mutableStateOf("Chats") }
    LaunchedEffect(Unit) { try { chats = loadChats(profile.token) } catch (_: Exception) { error = "Cannot connect to the server." }; loading = false }
    if (selected != null) { ConversationScreen(selected!!, profile.token, onBack = { selected = null }); return }
    if (showProfile) ProfileScreen(profile, onBack = { showProfile = false }, onLogout = onLogout)
    else if (tab != "Chats") UtilityScreen(tab) { tab = "Chats" }
    else Column(Modifier.fillMaxSize().background(Navy)) {
        Row(Modifier.fillMaxWidth().padding(20.dp), verticalAlignment = Alignment.CenterVertically) { Text("SabayChart", color = Color.White, style = MaterialTheme.typography.headlineSmall); Spacer(Modifier.weight(1f)); Icon(Icons.Default.Bell, "Notifications", tint = Color.White); Spacer(Modifier.width(12.dp)); IconButton(onClick = { showProfile = true }) { Icon(Icons.Default.Person, "Profile", tint = Color.White) } }
        Row(Modifier.padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) { Pill("All Chats", true); Pill("Personal", false); Pill("Groups", false) }
        Field(search, { search = it }, "Search chats, groups, and people...", KeyboardType.Text, ImeAction.Search)
        when { loading -> CircularProgressIndicator(Modifier.align(Alignment.CenterHorizontally).padding(32.dp), color = Blue); error.isNotEmpty() -> Text(error, color = Color.White, modifier = Modifier.padding(20.dp)); else -> LazyColumn(Modifier.weight(1f)) { items(chats.filter { it.name.contains(search, true) }) { chat -> ChatRow(chat) { selected = chat } } } }
        Row(Modifier.fillMaxWidth().background(Color(0xFF111C2D)).padding(vertical = 12.dp), horizontalArrangement = Arrangement.SpaceAround) { IconButton(onClick = { tab = "Chats" }) { Icon(Icons.Default.ChatBubble, "Chats", tint = Blue) }; IconButton(onClick = { tab = "Contacts" }) { Icon(Icons.Default.Person, "Contacts", tint = Muted) }; IconButton(onClick = { tab = "Calls" }) { Icon(Icons.Default.Phone, "Calls", tint = Muted) }; IconButton(onClick = { tab = "Settings" }) { Icon(Icons.Default.Settings, "Settings", tint = Muted) } }
    }
}

@Composable private fun Pill(text: String, active: Boolean) { Text(text, color = Color.White, fontSize = 12.sp, modifier = Modifier.background(if (active) Blue else Color(0xFF18253A), RoundedCornerShape(50)).padding(horizontal = 14.dp, vertical = 8.dp)) }
@Composable private fun ChatRow(chat: Chat, onClick: () -> Unit) { Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 20.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) { Text(chat.name.take(1).uppercase(), color = Color.White, modifier = Modifier.size(52.dp).background(Blue.copy(alpha = .35f), CircleShape).padding(16.dp)); Spacer(Modifier.width(14.dp)); Column { Text(chat.name, color = Color.White, style = MaterialTheme.typography.titleMedium); Text(chat.message, color = Muted, maxLines = 1) } } }

@Composable private fun ProfileScreen(profile: UserProfile, onBack: () -> Unit, onLogout: () -> Unit) { Column(Modifier.fillMaxSize().background(Navy).padding(24.dp)) { TextButton(onClick = onBack) { Text("Back", color = Blue) }; Spacer(Modifier.height(24.dp)); Text("Profile", color = Color.White, style = MaterialTheme.typography.headlineLarge); Spacer(Modifier.height(24.dp)); Text(profile.name, color = Color.White, style = MaterialTheme.typography.headlineSmall); Text(profile.email, color = Muted); Spacer(Modifier.height(24.dp)); Text("Account details", color = Muted); Spacer(Modifier.height(8.dp)); Text("Online", color = Color(0xFF52D39B)); Spacer(Modifier.height(32.dp)); Button(onClick = onLogout) { Text("Log out") } } }
@Composable private fun UtilityScreen(title: String, onBack: () -> Unit) { Column(Modifier.fillMaxSize().background(Navy).padding(24.dp)) { TextButton(onClick = onBack) { Text("Back to chats", color = Blue) }; Spacer(Modifier.height(24.dp)); Text(title, color = Color.White, style = MaterialTheme.typography.headlineLarge); Spacer(Modifier.height(18.dp)); when (title) { "Contacts" -> { Text("People you can chat with", color = Muted); Text("Da Rea", color = Color.White, modifier = Modifier.padding(top = 20.dp)); Text("Sokha Mean", color = Color.White, modifier = Modifier.padding(top = 14.dp)) }; "Calls" -> { Text("Your call history", color = Muted); Text("No calls yet", color = Color.White, modifier = Modifier.padding(top = 20.dp)) }; else -> { Text("Notifications", color = Color.White, modifier = Modifier.padding(top = 20.dp)); Text("Dark appearance", color = Color.White, modifier = Modifier.padding(top = 20.dp)); Text("Connected to SabayChart server", color = Color(0xFF52D39B), modifier = Modifier.padding(top = 20.dp)) } } } }

@Composable private fun ConversationScreen(chat: Chat, token: String, onBack: () -> Unit) { var draft by remember { mutableStateOf("") }; var messages by remember { mutableStateOf(listOf(chat.message)) }; var status by remember { mutableStateOf("") }; val keyboard = LocalSoftwareKeyboardController.current; val scope = rememberCoroutineScope(); LaunchedEffect(Unit) { try { messages = loadMessages(chat.id, token) } catch (_: Exception) { status = "Could not load message history." } }; Column(Modifier.fillMaxSize().background(Navy)) { TextButton(onClick = onBack) { Text("‹  ${chat.name}", color = Color.White) }; LazyColumn(Modifier.weight(1f).padding(20.dp)) { items(messages) { text -> Text(text, color = Color.White, modifier = Modifier.padding(vertical = 6.dp).background(Color(0xFF18253A), RoundedCornerShape(16.dp)).padding(12.dp)) } }; if (status.isNotEmpty()) Text(status, color = Color(0xFFFFB4AB), modifier = Modifier.padding(horizontal = 20.dp)); Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) { Field(draft, { draft = it }, "Type a message...", KeyboardType.Text, ImeAction.Done, keyboard = keyboard); Spacer(Modifier.width(8.dp)); Button(onClick = { val text = draft.trim(); if (text.isNotEmpty()) { keyboard?.hide(); draft = ""; scope.launch { val response = request("/api/messages/${chat.id}", "{\"text\":\"${text.jsonEscape()}\"}", token); if (response.first in 200..299) messages = messages + text else status = "Message was not saved." } } }) { Text("Send") } } } }

data class UserProfile(val name: String, val email: String, val token: String)
data class Chat(val id: String, val name: String, val message: String)

private suspend fun authenticate(register: Boolean, name: String, email: String, password: String): Pair<UserProfile?, String?> = withContext(Dispatchers.IO) { if (email.isBlank() || password.isBlank() || (register && name.isBlank())) return@withContext null to "Complete all fields."; if (register && password.length < 6) return@withContext null to "Password must be at least 6 characters."; val response = request("/api/auth/${if (register) "register" else "login"}", "{\"name\":\"${name.jsonEscape()}\",\"email\":\"${email.jsonEscape()}\",\"password\":\"${password.jsonEscape()}\"}"); if (response.first in 200..299) { val json = JSONObject(response.second); val user = json.getJSONObject("user"); UserProfile(user.optString("name"), user.optString("email"), json.optString("token")) to null } else null to "Server error (${response.first})." }
private suspend fun loadChats(token: String): List<Chat> = withContext(Dispatchers.IO) { val response = request("/api/conversations", null, token); if (response.first !in 200..299) throw IllegalStateException(); val array = JSONArray(response.second); List(array.length()) { val item = array.getJSONObject(it); Chat(item.optString("id"), item.optString("name", "Conversation"), item.optJSONObject("lastMessage")?.optString("text") ?: "No messages yet") } }
private suspend fun loadMessages(id: String, token: String): List<String> = withContext(Dispatchers.IO) { val response = request("/api/messages/$id", null, token); if (response.first !in 200..299) throw IllegalStateException(); val array = JSONArray(response.second); List(array.length()) { array.getJSONObject(it).optString("text") } }
private suspend fun request(path: String, body: String?, token: String? = null): Pair<Int, String> = withContext(Dispatchers.IO) { val connection = URL(API_BASE_URL + path).openConnection() as HttpURLConnection; try { connection.requestMethod = if (body == null) "GET" else "POST"; connection.connectTimeout = 15000; connection.readTimeout = 15000; token?.let { connection.setRequestProperty("Authorization", "Bearer $it") }; if (body != null) { connection.doOutput = true; connection.setRequestProperty("Content-Type", "application/json"); connection.outputStream.use { it.write(body.toByteArray()) } }; val responseCode = connection.responseCode; val stream = if (responseCode in 200..299) connection.inputStream else connection.errorStream; responseCode to (stream?.bufferedReader()?.use { it.readText() } ?: "") } finally { connection.disconnect() } }
private fun String.jsonEscape() = replace("\\", "\\\\").replace("\"", "\\\"")
