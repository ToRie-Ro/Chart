import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/avatar_widget.dart';
import 'profile_screen.dart';
import 'privacy_screen.dart';
import 'devices_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final theme = context.watch<ThemeProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        children: [
          if (user != null)
            Card(
              color: context.surfaceColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: context.borderColor, width: .5),
              ),
              child: ListTile(
                leading: AvatarWidget(name: user.name, avatarUrl: user.avatarUrl, radius: 26),
                title: Text(user.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                subtitle: Text('@', style: TextStyle(color: context.mutedColor)),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen())),
              ),
            ),
          const SizedBox(height: 16),
          Card(
            color: context.surfaceColor,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: context.borderColor, width: .5),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  secondary: const Icon(Icons.dark_mode_outlined, color: kBlue),
                  title: const Text('Dark Mode'),
                  value: theme.isDark,
                  onChanged: (_) => theme.toggle(),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.lock_outline, color: kBlue),
                  title: const Text('Privacy and Security'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PrivacyScreen())),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.devices_outlined, color: kBlue),
                  title: const Text('Devices'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DevicesScreen())),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.star_outline, color: kOrange),
                  title: const Text('SabayChat Premium'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('SabayChat Premium features coming soon!')),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: () => auth.logout(),
            icon: const Icon(Icons.logout, color: kRed),
            label: const Text('Log Out', style: TextStyle(color: kRed)),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: kRed),
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: Text(
              'SabayChat v1.1.0 • Telegram-style Edition',
              style: TextStyle(color: context.mutedColor, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
