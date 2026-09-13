import 'package:flutter_test/flutter_test.dart';

import 'package:sabaychat_flutter/main.dart';

void main() {
  testWidgets('renders the SabayChat home shell', (WidgetTester tester) async {
    await tester.pumpWidget(const SabayChatApp());

    expect(find.text('SabayChat'), findsOneWidget);
    expect(find.text('SabayChat Team'), findsOneWidget);
  });
}
