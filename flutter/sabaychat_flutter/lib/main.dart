import 'package:flutter/material.dart';

const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://chart-ztyk.onrender.com',
);

const navy = Color(0xFF0B0F1A);
const surface = Color(0xFF111C2D);
const elevated = Color(0xFF18253A);
const blue = Color(0xFF1D6BFF);
const blueDark = Color(0xFF0F4CC9);
const muted = Color(0xFFA7B0C0);
const green = Color(0xFF2ECF9A);
const border = Color(0xFF24324A);

void main() {
  runApp(const SabayChatApp());
}

class SabayChatApp extends StatelessWidget {
  const SabayChatApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SabayChat',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: navy,
        colorScheme:
            ColorScheme.fromSeed(seedColor: blue, brightness: Brightness.dark),
        fontFamily: 'sans',
        appBarTheme: const AppBarTheme(
            backgroundColor: Colors.transparent, elevation: 0),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: surface,
          hintStyle: const TextStyle(color: muted),
          border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: BorderSide.none),
          focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: const BorderSide(color: blue)),
        ),
      ),
      home: const HomeShell(),
    );
  }
}

class Chat {
  const Chat(this.name, this.message, this.time, this.color,
      {this.unread = 0, this.online = false});
  final String name;
  final String message;
  final String time;
  final Color color;
  final int unread;
  final bool online;
}

const chats = [
  Chat('SabayChat Team', 'Welcome to SabayChat!', '09:42', blue,
      unread: 2, online: true),
  Chat('Dara Sok', 'See you tomorrow 👋', 'Yesterday', Color(0xFF8B5CF6),
      online: true),
  Chat('Design Community', 'New design files are ready', 'Mon',
      Color(0xFFFF9F43),
      unread: 8),
  Chat('SabayChat News', 'What is new this week?', 'Sun', Color(0xFF2ECF9A)),
];

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int tab = 0;
  String filter = 'All';
  String search = '';

  @override
  Widget build(BuildContext context) {
    final pages = [
      ChatListPage(
          search: search,
          filter: filter,
          onSearch: (v) => setState(() => search = v),
          onFilter: (v) => setState(() => filter = v)),
      const Center(
          child: EmptyFeature(
              icon: Icons.call_outlined,
              title: 'Calls',
              detail: 'Your secure calls will appear here.')),
      const SettingsPage(),
    ];
    return Scaffold(
      body: SafeArea(child: pages[tab]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (value) => setState(() => tab = value),
        backgroundColor: surface,
        indicatorColor: blue.withValues(alpha: .22),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.chat_bubble_outline),
              selectedIcon: Icon(Icons.chat_bubble),
              label: 'Chats'),
          NavigationDestination(
              icon: Icon(Icons.call_outlined),
              selectedIcon: Icon(Icons.call),
              label: 'Calls'),
          NavigationDestination(
              icon: Icon(Icons.settings_outlined),
              selectedIcon: Icon(Icons.settings),
              label: 'Settings'),
        ],
      ),
      floatingActionButton: tab == 0
          ? FloatingActionButton(
              onPressed: () => _showNewChat(context),
              backgroundColor: blue,
              child: const Icon(Icons.add))
          : null,
    );
  }

  void _showNewChat(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: surface,
      showDragHandle: true,
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.forum_rounded, color: blue, size: 36),
          const SizedBox(height: 12),
          const Text('Create something new',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Start a private chat or create a community space.',
              textAlign: TextAlign.center, style: TextStyle(color: muted)),
          const SizedBox(height: 20),
          _CreateOption(
              icon: Icons.person_add_alt_1,
              title: 'New chat',
              detail: 'Message a person',
              onTap: () => Navigator.pop(context)),
          _CreateOption(
              icon: Icons.group_add_outlined,
              title: 'New group',
              detail: 'Create a group conversation',
              onTap: () => _showConversationForm(context, 'group')),
          _CreateOption(
              icon: Icons.campaign_outlined,
              title: 'New channel',
              detail: 'Broadcast updates to followers',
              onTap: () => _showConversationForm(context, 'channel')),
        ]),
      ),
    );
  }

  void _showConversationForm(BuildContext context, String type) {
    Navigator.pop(context);
    final controller = TextEditingController();
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: surface,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.fromLTRB(
            24, 8, 24, MediaQuery.of(sheetContext).viewInsets.bottom + 28),
        child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(type == 'group' ? 'New group' : 'New channel',
                  style: const TextStyle(
                      fontSize: 23, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(
                  type == 'group'
                      ? 'Choose a name, then invite members.'
                      : 'Choose a name for your broadcast channel.',
                  style: const TextStyle(color: muted)),
              const SizedBox(height: 18),
              TextField(
                  controller: controller,
                  autofocus: true,
                  maxLength: 80,
                  decoration: InputDecoration(
                      labelText:
                          type == 'group' ? 'Group name' : 'Channel name',
                      prefixIcon: Icon(
                          type == 'group' ? Icons.groups : Icons.campaign))),
              const SizedBox(height: 10),
              SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                      onPressed: () {
                        final name = controller.text.trim();
                        if (name.isEmpty) return;
                        Navigator.pop(sheetContext);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(
                                '${type == 'group' ? 'Group' : 'Channel'} creation requires an authenticated session.')));
                      },
                      child: Text(
                          'Create ${type == 'group' ? 'group' : 'channel'}'))),
            ]),
      ),
    );
  }
}

class _CreateOption extends StatelessWidget {
  const _CreateOption(
      {required this.icon,
      required this.title,
      required this.detail,
      required this.onTap});
  final IconData icon;
  final String title;
  final String detail;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => ListTile(
        contentPadding: EdgeInsets.zero,
        leading: CircleAvatar(
            backgroundColor: blue.withValues(alpha: .18),
            child: Icon(icon, color: blue)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle:
            Text(detail, style: const TextStyle(color: muted, fontSize: 12)),
        trailing: const Icon(Icons.chevron_right, color: muted),
        onTap: onTap,
      );
}

class ChatListPage extends StatelessWidget {
  const ChatListPage(
      {required this.search,
      required this.filter,
      required this.onSearch,
      required this.onFilter,
      super.key});
  final String search;
  final String filter;
  final ValueChanged<String> onSearch;
  final ValueChanged<String> onFilter;

  @override
  Widget build(BuildContext context) {
    final visible = chats.where((chat) {
      final matchesSearch =
          chat.name.toLowerCase().contains(search.toLowerCase());
      final matchesFilter = filter == 'All' ||
          (filter == 'Groups'
              ? chat.name.contains('Community') || chat.name.contains('News')
              : !chat.name.contains('Community') &&
                  !chat.name.contains('News'));
      return matchesSearch && matchesFilter;
    }).toList();
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
          sliver: SliverToBoxAdapter(
              child: Row(children: [
            const Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Text('Good to see you',
                      style: TextStyle(color: muted, fontSize: 12)),
                  SizedBox(height: 2),
                  Text('SabayChat',
                      style:
                          TextStyle(fontSize: 25, fontWeight: FontWeight.bold)),
                ])),
            Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                decoration: BoxDecoration(
                    color: surface, borderRadius: BorderRadius.circular(30)),
                child: const Row(children: [
                  Icon(Icons.circle, size: 8, color: green),
                  SizedBox(width: 6),
                  Text('Live', style: TextStyle(color: muted, fontSize: 12))
                ])),
            const SizedBox(width: 10),
            IconButton(
                onPressed: () {}, icon: const Icon(Icons.notifications_none)),
          ])),
        ),
        SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
            sliver: SliverToBoxAdapter(
                child: TextField(
                    onChanged: onSearch,
                    decoration: const InputDecoration(
                        hintText: 'Search chats, groups, and people...',
                        prefixIcon: Icon(Icons.search))))),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
          sliver: SliverToBoxAdapter(
            child: Row(
              children: ['All', 'Personal', 'Groups']
                  .map((item) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(item),
                          selected: filter == item,
                          onSelected: (_) => onFilter(item),
                          selectedColor: blue,
                          backgroundColor: surface,
                        ),
                      ))
                  .toList(),
            ),
          ),
        ),
        if (visible.isEmpty)
          const SliverFillRemaining(
            child: EmptyFeature(
              icon: Icons.forum_outlined,
              title: 'No chats yet',
              detail: 'Start a conversation to see it here.',
            ),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => ChatRow(chat: visible[index]),
                childCount: visible.length,
              ),
            ),
          ),
      ],
    );
  }
}

class ChatRow extends StatelessWidget {
  const ChatRow({required this.chat, super.key});
  final Chat chat;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: surface,
      margin: const EdgeInsets.only(bottom: 9),
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: border, width: .5)),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => Navigator.push(
            context, MaterialPageRoute(builder: (_) => ChatPage(chat: chat))),
        child: Padding(
            padding: const EdgeInsets.all(13),
            child: Row(children: [
              Stack(children: [
                CircleAvatar(
                    radius: 27,
                    backgroundColor: chat.color.withValues(alpha: .25),
                    child: Text(chat.name.substring(0, 1),
                        style: TextStyle(
                            color: chat.color,
                            fontSize: 20,
                            fontWeight: FontWeight.bold))),
                if (chat.online)
                  Positioned(
                      right: 0,
                      bottom: 1,
                      child: Container(
                          width: 13,
                          height: 13,
                          decoration: BoxDecoration(
                              color: green,
                              shape: BoxShape.circle,
                              border: Border.all(color: surface, width: 2)))),
              ]),
              const SizedBox(width: 13),
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(chat.name,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 16)),
                    const SizedBox(height: 5),
                    Text(chat.message,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: muted))
                  ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(chat.time,
                    style: const TextStyle(color: muted, fontSize: 11)),
                if (chat.unread > 0)
                  Container(
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 3),
                      decoration: const BoxDecoration(
                          color: blue, shape: BoxShape.circle),
                      child: Text('${chat.unread}',
                          style: const TextStyle(
                              fontSize: 11, fontWeight: FontWeight.bold)))
              ]),
            ])),
      ),
    );
  }
}

class ChatPage extends StatefulWidget {
  const ChatPage({required this.chat, super.key});
  final Chat chat;
  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final controller = TextEditingController();
  final messages = <String>[
    'Welcome to SabayChat!',
    'This chat uses the secure SabayChat server.'
  ];
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
            title: Row(children: [
              CircleAvatar(
                  radius: 17,
                  backgroundColor: widget.chat.color.withValues(alpha: .25),
                  child: Text(widget.chat.name[0],
                      style: TextStyle(color: widget.chat.color))),
              const SizedBox(width: 10),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(widget.chat.name, style: const TextStyle(fontSize: 16)),
                Text(widget.chat.online ? 'online' : 'last seen recently',
                    style: const TextStyle(color: muted, fontSize: 11))
              ])
            ]),
            actions: [
              IconButton(onPressed: () {}, icon: const Icon(Icons.more_vert))
            ]),
        body: Column(children: [
          Expanded(
              child: ListView.builder(
                  padding: const EdgeInsets.all(18),
                  itemCount: messages.length,
                  itemBuilder: (_, index) => Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 15, vertical: 11),
                          decoration: BoxDecoration(
                              color: elevated,
                              borderRadius: BorderRadius.circular(17)),
                          child: Text(messages[index]))))),
          Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(children: [
                Expanded(
                    child: TextField(
                        controller: controller,
                        decoration:
                            const InputDecoration(hintText: 'Message...'))),
                const SizedBox(width: 8),
                IconButton(
                    onPressed: () {
                      if (controller.text.trim().isNotEmpty)
                        setState(() {
                          messages.add(controller.text.trim());
                          controller.clear();
                        });
                    },
                    icon: const Icon(Icons.send_rounded, color: blue))
              ])),
        ]),
      );
}

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});
  @override
  Widget build(BuildContext context) =>
      ListView(padding: const EdgeInsets.fromLTRB(20, 20, 20, 30), children: [
        const Text('Settings',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
        const SizedBox(height: 20),
        Card(
            color: surface,
            child: ListTile(
                leading: const CircleAvatar(
                    backgroundColor: blue, child: Icon(Icons.person)),
                title: const Text('Your profile'),
                subtitle: const Text('Manage your account and Premium status',
                    style: TextStyle(color: muted)),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const ProfilePage())))),
        const SizedBox(height: 18),
        const Text('SABAYCHAT',
            style: TextStyle(
                color: muted, fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        SettingsTile(
            icon: Icons.lock_outline,
            title: 'Privacy & Security',
            detail: 'Password and device access',
            onTap: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const PrivacyPage()))),
        SettingsTile(
            icon: Icons.devices_outlined,
            title: 'Devices & Sessions',
            detail: 'Manage signed-in devices',
            onTap: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const DevicesPage()))),
        SettingsTile(
            icon: Icons.notifications_none,
            title: 'Notifications',
            detail: 'Messages and sound preferences',
            onTap: () {}),
        SettingsTile(
            icon: Icons.workspace_premium_outlined,
            title: 'Premium',
            detail: 'Unlock your verification badge',
            onTap: () {}),
        const SizedBox(height: 20),
        const Text('API: $apiBaseUrl',
            style: TextStyle(color: muted, fontSize: 11)),
      ]);
}

class SettingsTile extends StatelessWidget {
  const SettingsTile(
      {required this.icon,
      required this.title,
      required this.detail,
      required this.onTap,
      super.key});
  final IconData icon;
  final String title;
  final String detail;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Card(
      color: surface,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
          leading: Icon(icon, color: blue),
          title: Text(title),
          subtitle:
              Text(detail, style: const TextStyle(color: muted, fontSize: 12)),
          trailing: const Icon(Icons.chevron_right, color: muted),
          onTap: onTap));
}

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(padding: const EdgeInsets.all(24), children: const [
        Center(
            child: CircleAvatar(
                radius: 52,
                backgroundColor: blue,
                child: Icon(Icons.person, size: 54))),
        SizedBox(height: 16),
        Center(
            child: Text('SabayChat User',
                style: TextStyle(fontSize: 23, fontWeight: FontWeight.bold))),
        Center(child: Text('@sabayuser', style: TextStyle(color: muted))),
        SizedBox(height: 28),
        InfoCard(label: 'Email', value: 'Your verified email'),
        InfoCard(label: 'Account status', value: 'Active'),
        InfoCard(label: 'Plan', value: 'Free plan'),
      ]));
}

class InfoCard extends StatelessWidget {
  const InfoCard({required this.label, required this.value, super.key});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Card(
      color: surface,
      child: ListTile(
          title:
              Text(label, style: const TextStyle(color: muted, fontSize: 12)),
          subtitle: Text(value,
              style: const TextStyle(color: Colors.white, fontSize: 16))));
}

class PrivacyPage extends StatefulWidget {
  const PrivacyPage({super.key});
  @override
  State<PrivacyPage> createState() => _PrivacyPageState();
}

class _PrivacyPageState extends State<PrivacyPage> {
  bool twoStep = false;
  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Privacy & Security')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
                gradient:
                    const LinearGradient(colors: [Color(0xFF123C8C), surface]),
                borderRadius: BorderRadius.circular(20)),
            child: const Row(children: [
              SizedBox(
                  width: 72,
                  height: 72,
                  child: CircularProgressIndicator(
                      value: .95,
                      strokeWidth: 8,
                      color: green,
                      backgroundColor: surface)),
              SizedBox(width: 16),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Privacy Score', style: TextStyle(color: muted)),
                Text('95  Excellent',
                    style:
                        TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                Text('Your data is well protected.',
                    style: TextStyle(color: muted, fontSize: 12))
              ])
            ])),
        const SizedBox(height: 22),
        const Text('SECURITY',
            style: TextStyle(
                color: muted, fontSize: 12, fontWeight: FontWeight.bold)),
        SettingsTile(
            icon: Icons.block,
            title: 'Blocked Users',
            detail: 'Manage who cannot contact you',
            onTap: () {}),
        SettingsTile(
            icon: Icons.language,
            title: 'Active Websites',
            detail: 'Review active connections',
            onTap: () {}),
        SettingsTile(
            icon: Icons.face,
            title: 'Passcode & Face ID',
            detail: 'Keep your app locked and secure',
            onTap: () {}),
        Card(
          color: surface,
          child: SwitchListTile(
            value: twoStep,
            onChanged: (v) => setState(() => twoStep = v),
            title: const Text('Two-Step Verification'),
            subtitle: const Text(
              'Add an extra layer of security',
              style: TextStyle(color: muted),
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text('ACCOUNT ACCESS',
            style: TextStyle(
                color: muted, fontSize: 12, fontWeight: FontWeight.bold)),
        SettingsTile(
            icon: Icons.key,
            title: 'Passkey',
            detail: 'Use a passkey for faster sign in',
            onTap: () {}),
        SettingsTile(
            icon: Icons.devices,
            title: 'Devices & Sessions',
            detail: 'Review signed-in devices',
            onTap: () {}),
      ]));
}

class DevicesPage extends StatelessWidget {
  const DevicesPage({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Devices & Sessions')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        const Text('ACTIVE SESSION',
            style: TextStyle(
                color: muted, fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const SettingsTile(
            icon: Icons.phone_iphone,
            title: 'This device',
            detail: 'iOS or Android • Active now',
            onTap: _noop),
        const SizedBox(height: 18),
        FilledButton.tonal(
            onPressed: () {},
            child: const Text('Log out of all other devices')),
      ]));
}

void _noop() {}

class EmptyFeature extends StatelessWidget {
  const EmptyFeature(
      {required this.icon,
      required this.title,
      required this.detail,
      super.key});
  final IconData icon;
  final String title;
  final String detail;
  @override
  Widget build(BuildContext context) => Center(
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, size: 52, color: blue),
        const SizedBox(height: 16),
        Text(title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Text(detail, style: const TextStyle(color: muted))
      ]));
}
