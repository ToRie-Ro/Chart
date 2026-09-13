import 'package:flutter/material.dart';
import '../core/theme.dart';
import 'avatar_widget.dart';

class StoryItem {
  const StoryItem({
    required this.id,
    required this.name,
    this.avatarUrl,
    this.isViewed = false,
    this.isMe = false,
  });

  final String id;
  final String name;
  final String? avatarUrl;
  final bool isViewed;
  final bool isMe;
}

class StoryBar extends StatelessWidget {
  const StoryBar({
    required this.stories,
    required this.onTapStory,
    required this.onTapAddStory,
    super.key,
  });

  final List<StoryItem> stories;
  final ValueChanged<StoryItem> onTapStory;
  final VoidCallback onTapAddStory;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 98,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        itemCount: stories.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GestureDetector(
                    onTap: onTapAddStory,
                    child: Stack(
                      children: [
                        Container(
                          width: 58,
                          height: 58,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: context.surfaceColor,
                            border: Border.all(color: context.borderColor, width: 1.5),
                          ),
                          child: const Icon(Icons.add, color: kBlue, size: 28),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Your story',
                    style: TextStyle(
                      fontSize: 11,
                      color: context.mutedColor,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            );
          }

          final story = stories[index - 1];
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: GestureDetector(
              onTap: () => onTapStory(story),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(2.5),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: story.isViewed
                          ? null
                          : const LinearGradient(
                              colors: [kBlue, kPurple, kOrange],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                      border: story.isViewed
                          ? Border.all(color: context.borderColor, width: 2)
                          : null,
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: context.navyColor,
                        shape: BoxShape.circle,
                      ),
                      child: AvatarWidget(
                        name: story.name,
                        avatarUrl: story.avatarUrl,
                        radius: 25,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  SizedBox(
                    width: 60,
                    child: Text(
                      story.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
