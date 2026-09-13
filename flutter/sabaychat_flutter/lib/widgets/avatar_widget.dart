import 'package:flutter/material.dart';
import '../core/theme.dart';

class AvatarWidget extends StatelessWidget {
  const AvatarWidget({
    required this.name,
    this.avatarUrl,
    this.radius = 24,
    this.color,
    this.isOnline = false,
    super.key,
  });

  final String name;
  final String? avatarUrl;
  final double radius;
  final Color? color;
  final bool isOnline;

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? kBlue;
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Stack(
      children: [
        CircleAvatar(
          radius: radius,
          backgroundColor: effectiveColor.withValues(alpha: .22),
          child: Text(
            initial,
            style: TextStyle(
              color: effectiveColor,
              fontWeight: FontWeight.bold,
              fontSize: radius * 0.8,
            ),
          ),
        ),
        if (isOnline)
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: radius * 0.55,
              height: radius * 0.55,
              decoration: BoxDecoration(
                color: kGreen,
                shape: BoxShape.circle,
                border: Border.all(
                  color: context.surfaceColor,
                  width: 2,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
