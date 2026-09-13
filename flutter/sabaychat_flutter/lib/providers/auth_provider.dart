import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_client.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient api = ApiClient();

  AppUser? _user;
  AppUser? get user => _user;
  bool get isSignedIn => _user != null;

  bool _loading = false;
  bool get loading => _loading;
  String _error = '';
  String get error => _error;

  Future<bool> tryAutoLogin() async {
    await api.loadTokens();
    if (!api.isAuthenticated) return false;
    try {
      _user = await api.getMe();
      _connectWs();
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> login(String email, String password) async {
    _setLoading(true);
    _error = '';
    try {
      _user = await api.login(email, password);
      _connectWs();
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> register(String name, String email, String password) async {
    _setLoading(true);
    _error = '';
    try {
      _user = await api.register(name, email, password);
      _connectWs();
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    WsClient.instance.disconnect();
    await api.logout();
    _user = null;
    notifyListeners();
  }

  void updateUser(AppUser updated) {
    _user = updated;
    notifyListeners();
  }

  void clearError() {
    _error = '';
    notifyListeners();
  }

  void _connectWs() {
    final token = api.accessToken;
    if (token != null) WsClient.instance.connect(token);
  }

  void _setLoading(bool v) {
    _loading = v;
    notifyListeners();
  }
}
