import 'dart:async';
import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_client.dart';
import '../models/chat.dart';
import '../models/message.dart';

class ChatProvider extends ChangeNotifier {
  final ApiClient api;
  ChatProvider(this.api);

  List<Chat> _chats = [];
  List<Chat> get chats => _chats;

  final Map<String, List<AppMessage>> _messages = {};
  final Map<String, bool> _loadingMessages = {};
  final Map<String, String> _typingUsers = {};

  bool _loadingChats = false;
  bool get loadingChats => _loadingChats;
  String _error = '';
  String get error => _error;

  StreamSubscription<AppMessage>? _msgSub;
  StreamSubscription<Map<String, dynamic>>? _typingSub;

  void init() {
    _msgSub = WsClient.instance.messages.listen(_onWsMessage);
    _typingSub = WsClient.instance.typingEvents.listen(_onTyping);
    loadChats();
  }

  Future<void> loadChats() async {
    _loadingChats = true;
    notifyListeners();
    try {
      _chats = await api.getConversations();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loadingChats = false;
      notifyListeners();
    }
  }

  List<AppMessage> messagesFor(String chatId) => _messages[chatId] ?? [];
  bool isLoadingMessages(String chatId) => _loadingMessages[chatId] ?? false;
  String? typingUser(String chatId) => _typingUsers[chatId];

  Future<void> loadMessages(String chatId) async {
    if (_loadingMessages[chatId] == true) return;
    _loadingMessages[chatId] = true;
    notifyListeners();
    try {
      final msgs = await api.getMessages(chatId);
      _messages[chatId] = msgs;
    } catch (_) {}
    _loadingMessages[chatId] = false;
    notifyListeners();
  }

  void sendMessage(String chatId, String text, String senderId) {
    final local = AppMessage.local(
      conversationId: chatId,
      senderId: senderId,
      text: text,
    );
    _messages.putIfAbsent(chatId, () => []).add(local);
    final idx = _chats.indexWhere((c) => c.id == chatId);
    if (idx >= 0) {
      _chats[idx] = _chats[idx].copyWith(lastMessage: text, lastMessageTime: 'now');
    }
    notifyListeners();
    WsClient.instance.sendMessage(chatId, text);
  }

  void addReaction(String chatId, String messageId, String emoji) {
    final msgs = _messages[chatId];
    if (msgs == null) return;
    final idx = msgs.indexWhere((m) => m.id == messageId);
    if (idx >= 0) {
      msgs[idx] = msgs[idx].withReaction(emoji);
      notifyListeners();
    }
  }

  Future<Chat> createConversation(String name, String type) async {
    final chat = await api.createConversation(name, type);
    _chats.insert(0, chat);
    notifyListeners();
    return chat;
  }

  void _onWsMessage(AppMessage msg) {
    final chatId = msg.conversationId;
    final list = _messages.putIfAbsent(chatId, () => []);
    final localIdx = list.indexWhere(
      (m) => m.isSending && m.text == msg.text && m.senderId == msg.senderId,
    );
    if (localIdx >= 0) {
      list[localIdx] = msg;
    } else {
      list.add(msg);
    }
    final chatIdx = _chats.indexWhere((c) => c.id == chatId);
    if (chatIdx >= 0) {
      _chats[chatIdx] = _chats[chatIdx].copyWith(
        lastMessage: msg.text,
        lastMessageTime: _formatTime(msg.createdAtDate),
      );
    }
    notifyListeners();
  }

  void _onTyping(Map<String, dynamic> event) {
    final chatId = event['conversationId']?.toString();
    final name = event['name']?.toString();
    if (chatId == null) return;
    if (name == null || name.isEmpty) {
      _typingUsers.remove(chatId);
    } else {
      _typingUsers[chatId] = name;
    }
    notifyListeners();
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inHours < 1) return 'm';
    if (diff.inDays < 1) return ':';
    if (diff.inDays < 7) return _weekday(dt.weekday);
    return '/';
  }

  String _weekday(int d) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[(d - 1).clamp(0, 6)];
  }

  @override
  void dispose() {
    _msgSub?.cancel();
    _typingSub?.cancel();
    super.dispose();
  }
}
