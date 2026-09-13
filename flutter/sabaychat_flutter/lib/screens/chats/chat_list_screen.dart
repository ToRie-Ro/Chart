import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/chat_row.dart';
import '../../widgets/story_ring.dart';
import '../../widgets/glass_widgets.dart';
import 'chat_page.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});
  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  String search = '';
  String filter = 'All';

  final dummyStories = const [
    StoryItem(id: 's1', name: 'Sokha', isViewed: false),
    StoryItem(id: 's2', name: 'Dara', isViewed: false),
    StoryItem(id: 's3', name: 'Chanthy', isViewed: true),
    StoryItem(id: 's4', name: 'Visal', isViewed: true),
    StoryItem(id: 's5', name: 'Bopha', isViewed: true),
  ];

  @override
  Widget build(BuildContext context) {
    final chatProv = context.watch<ChatProvider>();
    final user = context.watch<AuthProvider>().user;

    final chats = chatProv.chats.where((chat) {
      final matchesSearch = chat.name.toLowerCase().contains(search.toLowerCase());
      final matchesFilter = filter == 'All' ||
          (filter == 'Groups'
              ? (chat.type == 'group' || chat.type == 'channel')
              : chat.type == 'direct');
      return matchesSearch && matchesFilter;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                color: kBlue,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('SabayChat', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Text(
                  user != null ? '@' : 'Live',
                  style: TextStyle(color: context.mutedColor, fontSize: 11),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => _showNewChatDialog(context),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => chatProv.loadChats(),
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  StoryBar(
                    stories: dummyStories,
                    onTapStory: (s) {},
                    onTapAddStory: () {},
                  ),
                  const Divider(height: 1),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: ['All', 'Personal', 'Groups', 'Channels', 'Unread'].map((item) {
                          final isSelected = filter == item;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(item),
                              selected: isSelected,
                              onSelected: (_) => setState(() => filter = item),
                              selectedColor: kBlue.withValues(alpha: .2),
                              checkmarkColor: kBlue,
                              labelStyle: TextStyle(
                                color: isSelected ? kBlue : context.mutedColor,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (chatProv.loadingChats && chatProv.chats.isEmpty)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (chats.isEmpty)
              const SliverFillRemaining(
                child: EmptyState(
                  icon: Icons.forum_outlined,
                  title: 'No Conversations',
                  detail: 'Start a conversation by tapping the write icon above.',
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final chat = chats[index];
                    return ChatRow(
                      chat: chat,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => ChatPage(chat: chat)),
                        );
                      },
                    );
                  },
                  childCount: chats.length,
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showNewChatDialog(BuildContext context) {
    final controller = TextEditingController();
    String type = 'direct';

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.surfaceColor,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: context.borderColor, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              const Text('New Chat', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Row(
                children: [
                  ChoiceChip(
                    label: const Text('Group'),
                    selected: type == 'group',
                    onSelected: (_) => setModalState(() => type = 'group'),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('Channel'),
                    selected: type == 'channel',
                    onSelected: (_) => setModalState(() => type = 'channel'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: type == 'group' ? 'Group name' : 'Channel name',
                  prefixIcon: Icon(type == 'group' ? Icons.group : Icons.campaign),
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: () async {
                    final name = controller.text.trim();
                    if (name.isEmpty) return;
                    Navigator.pop(ctx);
                    try {
                      final chat = await context.read<ChatProvider>().createConversation(name, type);
                      if (context.mounted) {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => ChatPage(chat: chat)));
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                      }
                    }
                  },
                  style: FilledButton.styleFrom(backgroundColor: kBlue),
                  child: const Text('Create'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

