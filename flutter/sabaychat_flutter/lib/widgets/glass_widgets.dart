import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/theme.dart';

class LiquidGlass extends StatelessWidget {
  const LiquidGlass({required this.child, this.padding, this.radius = 24, super.key});
  final Widget child;
  final EdgeInsets? padding;
  final double radius;

  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: .08),
              borderRadius: BorderRadius.circular(radius),
              border: Border.all(color: Colors.white.withValues(alpha: .14)),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .25), blurRadius: 28, offset: const Offset(0, 12))],
            ),
            child: child,
          ),
        ),
      );
}

class GlassBackground extends StatelessWidget {
  const GlassBackground({required this.child, super.key});
  final Widget child;
  @override
  Widget build(BuildContext context) => Stack(children: [
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF111D38), kNavy, Color(0xFF080B14)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        const Positioned(top: -100, right: -70, child: _Glow(color: Color(0x551D6BFF), size: 260)),
        const Positioned(bottom: 80, left: -120, child: _Glow(color: Color(0x386D3BFF), size: 300)),
        child,
      ]);
}

class _Glow extends StatelessWidget {
  const _Glow({required this.color, required this.size});
  final Color color;
  final double size;
  @override
  Widget build(BuildContext context) => ImageFiltered(
        imageFilter: ImageFilter.blur(sigmaX: 50, sigmaY: 50),
        child: Container(width: size, height: size, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
      );
}

class SectionHeader extends StatelessWidget {
  const SectionHeader(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
        child: Text(text, style: TextStyle(color: context.mutedColor, fontSize: 12, fontWeight: FontWeight.bold)),
      );
}

class EmptyState extends StatelessWidget {
  const EmptyState({required this.icon, required this.title, required this.detail, super.key});
  final IconData icon;
  final String title;
  final String detail;
  @override
  Widget build(BuildContext context) => Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, size: 56, color: kBlue.withValues(alpha: .6)),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(detail, textAlign: TextAlign.center, style: TextStyle(color: context.mutedColor, fontSize: 14)),
        ]),
      );
}
