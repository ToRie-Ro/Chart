import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../widgets/glass_widgets.dart';

class StoriesScreen extends StatelessWidget {
  const StoriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stories', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.camera_alt_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: const EmptyState(
        icon: Icons.auto_awesome_outlined,
        title: 'Share Your Story',
        detail: 'Stories disappear after 24 hours.\nTap the camera to capture a moment.',
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.add_a_photo_outlined),
        label: const Text('Post Story'),
        backgroundColor: kBlue,
      ),
    );
  }
}
