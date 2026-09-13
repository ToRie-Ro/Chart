import 'package:flutter/material.dart';

const Color kNavy     = Color(0xFF0B0F1A);
const Color kSurface  = Color(0xFF111C2D);
const Color kElevated = Color(0xFF18253A);
const Color kBlue     = Color(0xFF1D6BFF);
const Color kBlueDark = Color(0xFF0F4CC9);
const Color kMuted    = Color(0xFFA7B0C0);
const Color kGreen    = Color(0xFF2ECF9A);
const Color kBorder   = Color(0xFF24324A);
const Color kOrange   = Color(0xFFFF9F43);
const Color kPurple   = Color(0xFF8B5CF6);
const Color kRed      = Color(0xFFFF4D4D);

final ThemeData darkTheme = ThemeData(
  brightness: Brightness.dark,
  scaffoldBackgroundColor: kNavy,
  colorScheme: ColorScheme.fromSeed(
    seedColor: kBlue,
    brightness: Brightness.dark,
    surface: kSurface,
    primary: kBlue,
    secondary: kGreen,
    error: kRed,
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Colors.transparent,
    elevation: 0,
    centerTitle: false,
    titleTextStyle: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
    iconTheme: IconThemeData(color: Colors.white),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: kSurface,
    hintStyle: const TextStyle(color: kMuted),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: kBlue)),
  ),
  cardTheme: CardThemeData(
    color: kSurface,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(18),
      side: const BorderSide(color: kBorder, width: .5),
    ),
  ),
  navigationBarTheme: NavigationBarThemeData(
    backgroundColor: kSurface,
    indicatorColor: kBlue.withValues(alpha: .22),
    labelTextStyle: WidgetStateProperty.all(const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
  ),
  floatingActionButtonTheme: const FloatingActionButtonThemeData(backgroundColor: kBlue, foregroundColor: Colors.white),
  chipTheme: ChipThemeData(
    backgroundColor: kSurface,
    selectedColor: kBlue,
    labelStyle: const TextStyle(fontSize: 13, color: Colors.white),
    side: const BorderSide(color: kBorder, width: .5),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
  ),
  dividerTheme: const DividerThemeData(color: kBorder, thickness: .5),
  listTileTheme: const ListTileThemeData(iconColor: kBlue, textColor: Colors.white),
);

final ThemeData lightTheme = ThemeData(
  brightness: Brightness.light,
  scaffoldBackgroundColor: const Color(0xFFF0F4FF),
  colorScheme: ColorScheme.fromSeed(
    seedColor: kBlue,
    brightness: Brightness.light,
    primary: kBlue,
    secondary: kGreen,
    error: kRed,
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Colors.white,
    elevation: 0,
    centerTitle: false,
    foregroundColor: Color(0xFF0B0F1A),
    titleTextStyle: TextStyle(color: Color(0xFF0B0F1A), fontSize: 18, fontWeight: FontWeight.w700),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    hintStyle: const TextStyle(color: Color(0xFF8A9BAE)),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: kBlue)),
  ),
  cardTheme: CardThemeData(
    color: Colors.white,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(18),
      side: BorderSide(color: Colors.grey.shade200, width: .5),
    ),
  ),
  navigationBarTheme: NavigationBarThemeData(
    backgroundColor: Colors.white,
    indicatorColor: kBlue.withValues(alpha: .15),
    labelTextStyle: WidgetStateProperty.all(const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
  ),
  floatingActionButtonTheme: const FloatingActionButtonThemeData(backgroundColor: kBlue, foregroundColor: Colors.white),
  chipTheme: ChipThemeData(
    backgroundColor: Colors.white,
    selectedColor: kBlue,
    labelStyle: const TextStyle(fontSize: 13),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    side: BorderSide(color: Colors.grey.shade300, width: .5),
  ),
  dividerTheme: DividerThemeData(color: Colors.grey.shade200, thickness: .5),
);

extension AppColors on BuildContext {
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
  Color get surfaceColor => isDark ? kSurface : Colors.white;
  Color get mutedColor => isDark ? kMuted : const Color(0xFF8A9BAE);
  Color get navyColor => isDark ? kNavy : const Color(0xFFF0F4FF);
  Color get borderColor => isDark ? kBorder : Colors.grey.shade200;
  Color get elevatedColor => isDark ? kElevated : const Color(0xFFF8FAFF);
}
