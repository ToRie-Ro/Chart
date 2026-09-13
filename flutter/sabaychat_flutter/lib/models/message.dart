class Reaction {
  const Reaction(this.emoji, this.count);
  final String emoji;
  final int    count;
}

class AppMessage {
  const AppMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.text,
    required this.createdAt,
    this.status = 'sent',
    this.reactions = const [],
    this.replyToId,
    this.replyToText,
    this.isEdited = false,
  });

  factory AppMessage.fromJson(Map<String, dynamic> j) => AppMessage(
    id:             j['id']?.toString()              ?? '',
    conversationId: j['conversation_id']?.toString() ?? j['conversationId']?.toString() ?? '',
    senderId:       j['sender_id']?.toString()       ?? j['senderId']?.toString() ?? '',
    text:           j['text']?.toString()            ?? '',
    createdAt:      j['created_at']?.toString()      ?? j['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
    status:         j['status']?.toString()          ?? 'sent',
  );

  factory AppMessage.local({
    required String conversationId,
    required String senderId,
    required String text,
  }) => AppMessage(
    id: 'local_',
    conversationId: conversationId,
    senderId: senderId,
    text: text,
    createdAt: DateTime.now().toIso8601String(),
    status: 'sending',
  );

  final String         id;
  final String         conversationId;
  final String         senderId;
  final String         text;
  final String         createdAt;
  final String         status;
  final List<Reaction> reactions;
  final String?        replyToId;
  final String?        replyToText;
  final bool           isEdited;

  bool get isSending => status == 'sending';
  DateTime get createdAtDate => DateTime.tryParse(createdAt) ?? DateTime.now();

  AppMessage withReaction(String emoji) {
    final existing = reactions.indexWhere((r) => r.emoji == emoji);
    final updated = List<Reaction>.from(reactions);
    if (existing >= 0) {
      updated[existing] = Reaction(emoji, updated[existing].count + 1);
    } else {
      updated.add(Reaction(emoji, 1));
    }
    return AppMessage(
      id: id, conversationId: conversationId, senderId: senderId,
      text: text, createdAt: createdAt, status: status,
      reactions: updated, replyToId: replyToId, replyToText: replyToText,
      isEdited: isEdited,
    );
  }
}
