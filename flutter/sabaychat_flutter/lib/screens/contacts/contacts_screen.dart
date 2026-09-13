import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/avatar_widget.dart';
import '../../widgets/glass_widgets.dart';
import '../chats/chat_page.dart';

class ContactsScreen extends StatefulWidget {
  const ContactsScreen({super.key});
  @override
  State<ContactsScreen> createState() => _ContactsScreenState();
}

class _ContactsScreenState extends State<ContactsScreen> {
  List<AppUser> contacts = [];
  bool loading = true;
  String search = '';

  @override
  void initState() {
    super.initState();
    _loadContacts();
  }

  Future<void> _loadContacts() async {
    final api = context.read<AuthProvider>().api;
    try {
      final list = await api.getContacts();
      if (mounted) setState(() { contacts = list; loading = false; });
    } catch (_) {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = contacts.where((u) =>
      u.name.toLowerCase().contains(search.toLowerCase()) ||
      u.username.toLowerCase().contains(search.toLowerCase())
    ).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Contacts', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_outlined),
            onPressed: () => _showAddContactDialog(context),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: TextField(
              onChanged: (v) => setState(() => search = v),
              decoration: const InputDecoration(
                hintText: 'Search contacts...',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          Expanded(
            child: loading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? const EmptyState(
                        icon: Icons.people_outline,
                        title: 'No Contacts Found',
                        detail: 'Invite your friends or add someone via email.',
                      )
                    : ListView.builder(
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final contact = filtered[index];
                          return ListTile(
                            leading: AvatarWidget(
                              name: contact.name,
                              avatarUrl: contact.avatarUrl,
                              isOnline: contact.isOnline,
                            ),
                            title: Text(contact.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text(
                              contact.isOnline ? 'Online' : '@',
                              style: TextStyle(
                                color: contact.isOnline ? kGreen : context.mutedColor,
                                fontSize: 12,
                              ),
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.chat_bubble_outline, color: kBlue),
                              onPressed: () async {
                                final chatProv = context.read<ChatProvider>();
                                try {
                                  final chat = await chatProv.createConversation(contact.name, 'direct');
                                  if (context.mounted) {
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => ChatPage(chat: chat)));
                                  }
                                } catch (_) {}
                              },
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  void _showAddContactDialog(BuildContext context) {
    final emailController = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: context.surfaceColor,
        title: const Text('Add Contact'),
        content: TextField(
          controller: emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(hintText: 'user@example.com'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final email = emailController.text.trim();
              if (email.isEmpty) return;
              Navigator.pop(ctx);
              try {
                await context.read<AuthProvider>().api.sendFriendRequest(email);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Friend request sent!')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              }
            },
            child: const Text('Send Request'),
          ),
        ],
      ),
    );
  }
}
