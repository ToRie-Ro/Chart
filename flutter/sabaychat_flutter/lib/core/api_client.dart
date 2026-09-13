import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/storage.dart';
import '../models/user.dart';
import '../models/chat.dart';
import '../models/message.dart';
import '../models/call.dart';

const _apiBase = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://chart-ztyk.onrender.com',
);

String get apiBaseUrl => _apiBase;

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;
  @override
  String toString() => message;
}

class ApiClient {
  String? _accessToken;
  String? _refreshToken;

  String? get accessToken => _accessToken;

  Future<void> loadTokens() async {
    _accessToken  = await AppStorage.instance.accessToken;
    _refreshToken = await AppStorage.instance.refreshToken;
  }

  bool get isAuthenticated => _accessToken != null;

  Future<AppUser> login(String email, String password) async {
    final res = await _post('/api/auth/login', {'email': email.trim(), 'password': password}, skipAuth: true);
    _saveSession(res);
    return AppUser.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<AppUser> register(String name, String email, String password) async {
    final res = await _post('/api/auth/register', {'name': name.trim(), 'email': email.trim(), 'password': password}, skipAuth: true);
    _saveSession(res);
    return AppUser.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    try {
      await http.post(Uri.parse('/api/auth/logout'), headers: _headers());
    } catch (_) {}
    _accessToken = null;
    _refreshToken = null;
    await AppStorage.instance.clearTokens();
  }

  void _saveSession(Map<String, dynamic> body) {
    _accessToken  = body['accessToken']?.toString() ?? body['token']?.toString();
    _refreshToken = body['refreshToken']?.toString();
    if (_accessToken != null && _refreshToken != null) {
      AppStorage.instance.saveTokens(accessToken: _accessToken!, refreshToken: _refreshToken!);
    }
    final userId = (body['user'] as Map<String, dynamic>?)?['id']?.toString();
    if (userId != null) AppStorage.instance.saveUserId(userId);
  }

  Future<bool> refreshTokens() async {
    final rt = _refreshToken;
    if (rt == null) return false;
    try {
      final res = await http.post(
        Uri.parse('/api/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': rt}),
      );
      if (res.statusCode != 200) return false;
      final body = _decode(res);
      _accessToken  = body['accessToken']?.toString() ?? body['token']?.toString();
      _refreshToken = body['refreshToken']?.toString();
      if (_accessToken != null && _refreshToken != null) {
        await AppStorage.instance.saveTokens(accessToken: _accessToken!, refreshToken: _refreshToken!);
      }
      return _accessToken != null;
    } catch (_) {
      return false;
    }
  }

  Future<AppUser> getMe() async {
    final res = await _get('/api/me');
    return AppUser.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<AppUser> updateProfile({String? name, String? bio, String? avatarUrl}) async {
    final res = await _patch('/api/me', {
      if (name != null) 'name': name,
      if (bio != null) 'bio': bio,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
    });
    return AppUser.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<void> changePassword(String current, String next) async {
    await _post('/api/me/password', {'currentPassword': current, 'newPassword': next});
  }

  Future<List<Chat>> getConversations() async {
    final res = await _getList('/api/conversations');
    return res.map((e) => Chat.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Chat> createConversation(String name, String type) async {
    final res = await _post('/api/conversations', {'name': name, 'type': type});
    return Chat.fromJson(res);
  }

  Future<List<AppMessage>> getMessages(String conversationId) async {
    final res = await _getList('/api/messages/');
    return res.map((e) => AppMessage.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<AppMessage> sendMessage(String conversationId, String text) async {
    final res = await _post('/api/messages/', {'text': text});
    return AppMessage.fromJson(res);
  }

  Future<List<AppUser>> getContacts() async {
    final res = await _getList('/api/contacts');
    return res.map((e) => AppUser.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> sendFriendRequest(String email) async {
    await _post('/api/contacts/requests', {'email': email});
  }

  Future<List<CallRecord>> getCalls() async {
    final res = await _getList('/api/calls');
    return res.map((e) => CallRecord.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Map<String, dynamic>> getSettings() async => _get('/api/settings');

  Future<void> saveSettings({bool? notifications, bool? sounds, bool? darkMode, String? language}) async {
    await _patch('/api/settings', {
      if (notifications != null) 'notificationsEnabled': notifications,
      if (sounds != null) 'soundsEnabled': sounds,
      if (darkMode != null) 'darkMode': darkMode,
      if (language != null) 'language': language,
    });
  }

  Future<List<Map<String, dynamic>>> getDevices() async {
    final res = await _get('/api/me/devices');
    return ((res['devices'] ?? []) as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<void> logoutAllDevices() async {
    await _post('/api/me/devices/logout-all', {});
  }

  Future<Map<String, dynamic>> getPremiumFeatures() async => _get('/api/premium/features');

  Future<void> activatePremium(String key) async {
    await _post('/api/premium/activate', {'licenseKey': key});
  }

  Map<String, String> _headers({bool json = false}) => {
    if (_accessToken != null) 'Authorization': 'Bearer ',
    if (json) 'Content-Type': 'application/json',
  };

  dynamic _decode(http.Response r) =>
      r.body.isEmpty ? <String, dynamic>{} : jsonDecode(r.body);

  void _checkStatus(http.Response r) {
    if (r.statusCode >= 200 && r.statusCode < 300) return;
    final body = _decode(r);
    throw ApiException(
      body is Map ? (body['error']?.toString() ?? 'Request failed.') : 'Request failed.',
      statusCode: r.statusCode,
    );
  }

  Future<Map<String, dynamic>> _get(String path) async {
    var res = await http.get(Uri.parse(''), headers: _headers());
    if (res.statusCode == 401) {
      if (await refreshTokens()) {
        res = await http.get(Uri.parse(''), headers: _headers());
      }
    }
    _checkStatus(res);
    return _decode(res) as Map<String, dynamic>;
  }

  Future<List<dynamic>> _getList(String path) async {
    var res = await http.get(Uri.parse(''), headers: _headers());
    if (res.statusCode == 401) {
      if (await refreshTokens()) {
        res = await http.get(Uri.parse(''), headers: _headers());
      }
    }
    _checkStatus(res);
    final body = _decode(res);
    return body is List ? body : [];
  }

  Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> body, {bool skipAuth = false}) async {
    var res = await http.post(
      Uri.parse(''),
      headers: _headers(json: true),
      body: jsonEncode(body),
    );
    if (!skipAuth && res.statusCode == 401) {
      if (await refreshTokens()) {
        res = await http.post(
          Uri.parse(''),
          headers: _headers(json: true),
          body: jsonEncode(body),
        );
      }
    }
    _checkStatus(res);
    return (res.body.isEmpty ? {} : _decode(res)) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> _patch(String path, Map<String, dynamic> body) async {
    var res = await http.patch(
      Uri.parse(''),
      headers: _headers(json: true),
      body: jsonEncode(body),
    );
    if (res.statusCode == 401) {
      if (await refreshTokens()) {
        res = await http.patch(
          Uri.parse(''),
          headers: _headers(json: true),
          body: jsonEncode(body),
        );
      }
    }
    _checkStatus(res);
    return (res.body.isEmpty ? {} : _decode(res)) as Map<String, dynamic>;
  }
}
