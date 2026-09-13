import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';

class DevicesScreen extends StatefulWidget {
  const DevicesScreen({super.key});
  @override
  State<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends State<DevicesScreen> {
  List<Map<String, dynamic>> devices = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadDevices();
  }

  Future<void> _loadDevices() async {
    final api = context.read<AuthProvider>().api;
    try {
      final list = await api.getDevices();
      if (mounted) setState(() { devices = list; loading = false; });
    } catch (_) {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Devices')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                ...devices.map((d) {
                  return ListTile(
                    leading: const Icon(Icons.phone_android, color: kBlue),
                    title: Text(d['device_name']?.toString() ?? 'Mobile Device'),
                    subtitle: Text(d['platform']?.toString() ?? 'Active now'),
                  );
                }),
                const SizedBox(height: 20),
                FilledButton.tonal(
                  onPressed: () async {
                    await context.read<AuthProvider>().api.logoutAllDevices();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Logged out of other devices')),
                      );
                      _loadDevices();
                    }
                  },
                  child: const Text('Terminate All Other Sessions'),
                ),
              ],
            ),
    );
  }
}
