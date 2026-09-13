import 'package:flutter/material.dart';
import '../../core/theme.dart';

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy and Security')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Blocked Users'),
            trailing: Text('0', style: TextStyle(color: context.mutedColor)),
            onTap: () {},
          ),
          const Divider(height: 1),
          ListTile(
            title: const Text('Passcode Lock'),
            trailing: Text('Off', style: TextStyle(color: context.mutedColor)),
            onTap: () {},
          ),
          const Divider(height: 1),
          ListTile(
            title: const Text('Two-Step Verification'),
            trailing: Text('On', style: TextStyle(color: context.mutedColor)),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}
