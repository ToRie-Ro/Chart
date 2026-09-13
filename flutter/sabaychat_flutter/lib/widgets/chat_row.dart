import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../models/chat.dart';
import 'avatar_widget.dart';

class ChatRow extends StatelessWidget {
  const ChatRow({
    required this.chat,
    required this.onTap,
    this.onLongPress,
    super.key,
  });

  final Chat chat;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: context.surfaceColor,
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: kBorder, width: .5),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        onLongPress: onLongPress,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              AvatarWidget(
                name: chat.name,
                avatarUrl: chat.avatarUrl,
                radius: 26,
                color: chat.accentColor,
                isOnline: chat.isOnline,
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (chat.type == 'group') ...[
                          const Icon(Icons.group_rounded, size: 15, color: kPurple),
                          const SizedBox(width: 4),
                        ] else if (chat.type == 'channel') ...[
                          const Icon(Icons.campaign_rounded, size: 15, color: kOrange),
                          const SizedBox(width: 4),
                        ],
                        Expanded(
                          child: Text(
                            chat.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (chat.isPinned) ...[
                          Icon(Icons.push_pin, size: 14, color: context.mutedColor),
                          const SizedBox(width: 4),
                        ],
                        Text(
                          chat.lastMessageTime,
                          style: TextStyle(color: context.mutedColor, fontSize: 11),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            chat.lastMessage,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: context.mutedColor, fontSize: 13),
                          ),
                        ),
                        if (chat.isMuted) ...[
                          const SizedBox(width: 4),
                          Icon(Icons.volume_off, size: 14, color: context.mutedColor),
                        ],
                        if (chat.unread > 0)
                          Container(
                            margin: const EdgeInsets.only(left: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: kBlue,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${chat.unread}',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

