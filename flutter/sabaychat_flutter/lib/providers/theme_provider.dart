import 'package:flutter/material.dart';
import '../core/storage.dart';

class ThemeProvider extends ChangeNotifier {
  bool _isDark = true;
  bool get isDark => _isDark;
  ThemeMode get themeMode => _isDark ? ThemeMode.dark : ThemeMode.light;

  Future<void> init() async {
    _isDark = await AppStorage.instance.getDarkMode();
    notifyListeners();
  }

  Future<void> toggle() async {
    _isDark = !_isDark;
    await AppStorage.instance.setDarkMode(_isDark);
    notifyListeners();
  }

  Future<void> set(bool dark) async {
    if (_isDark == dark) return;
    _isDark = dark;
    await AppStorage.instance.setDarkMode(_isDark);
    notifyListeners();
  }
}
