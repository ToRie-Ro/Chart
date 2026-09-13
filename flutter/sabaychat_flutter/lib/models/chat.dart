import 'package:flutter/material.dart';
import '../core/theme.dart';

class Chat {
  const Chat({
    required this.id,
    required this.name,
    required this.type,
    this.lastMessage = '',
    this.lastMessageTime = '',
    this.unread = 0,
    this.isOnline = false,
    this.avatarUrl,
    this.updatedAt,
    this.isPinned = false,
    this.isMuted = false,
  });

  factory Chat.fromJson(Map<String, dynamic> j) => Chat(
    id:        j['id']?.toString()       ?? '',
    name:      j['name']?.toString()     ?? 'Conversation',
    type:      j['type']?.toString()     ?? 'direct',
    lastMessage: _typeLabel(j['type']?.toString()),
    updatedAt: j['updatedAt']?.toString() ?? j['updated_at']?.toString(),
  );

  static String _typeLabel(String? type) {
    if (type == 'channel') return 'Channel';
    if (type == 'group')   return 'Group chat';
    return 'No messages yet';
  }

  final String  id;
  final String  name;
  final String  type;
  final String  lastMessage;
  final String  lastMessageTime;
  final int     unread;
  final bool    isOnline;
  final String? avatarUrl;
  final String? updatedAt;
  final bool    isPinned;
  final bool    isMuted;

  Color get accentColor {
    switch (type) {
      case 'channel': return kOrange;
      case 'group':   return kPurple;
      default:        return kBlue;
    }
  }

  String get initials => name.isNotEmpty ? name[0].toUpperCase() : '?';

  Chat copyWith({String? lastMessage, String? lastMessageTime, int? unread, bool? isOnline, bool? isPinned, bool? isMuted}) => Chat(
    id: id, name: name, type: type, avatarUrl: avatarUrl, updatedAt: updatedAt,
    lastMessage:      lastMessage      ?? this.lastMessage,
    lastMessageTime:  lastMessageTime  ?? this.lastMessageTime,
    unread:           unread           ?? this.unread,
    isOnline:         isOnline         ?? this.isOnline,
    isPinned:         isPinned         ?? this.isPinned,
    isMuted:          isMuted          ?? this.isMuted,
  );
}
