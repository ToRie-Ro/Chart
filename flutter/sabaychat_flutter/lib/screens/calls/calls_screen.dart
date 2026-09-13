import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../models/call.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/glass_widgets.dart';

class CallsScreen extends StatefulWidget {
  const CallsScreen({super.key});
  @override
  State<CallsScreen> createState() => _CallsScreenState();
}

class _CallsScreenState extends State<CallsScreen> {
  List<CallRecord> calls = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadCalls();
  }

  Future<void> _loadCalls() async {
    final api = context.read<AuthProvider>().api;
    try {
      final list = await api.getCalls();
      if (mounted) setState(() { calls = list; loading = false; });
    } catch (_) {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Calls', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_call),
            onPressed: () {},
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : calls.isEmpty
              ? const EmptyState(
                  icon: Icons.call_outlined,
                  title: 'No Recent Calls',
                  detail: 'End-to-end encrypted audio and video calls will appear here.',
                )
              : ListView.builder(
                  itemCount: calls.length,
                  itemBuilder: (context, index) {
                    final call = calls[index];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: (call.isMissed ? kRed : kGreen).withValues(alpha: .2),
                        child: Icon(
                          call.isVideo ? Icons.videocam : Icons.call,
                          color: call.isMissed ? kRed : kGreen,
                        ),
                      ),
                      title: Text(call.callerName ?? 'Call', style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Row(
                        children: [
                          Icon(
                            call.isMissed ? Icons.call_missed : Icons.call_received,
                            size: 14,
                            color: call.isMissed ? kRed : kGreen,
                          ),
                          const SizedBox(width: 4),
                          Text(call.status, style: TextStyle(color: context.mutedColor, fontSize: 12)),
                        ],
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.call, color: kBlue),
                        onPressed: () {},
                      ),
                    );
                  },
                ),
    );
  }
}
