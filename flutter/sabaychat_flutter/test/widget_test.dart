import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:sabaychat_flutter/core/theme.dart';
import 'package:sabaychat_flutter/providers/auth_provider.dart';
import 'package:sabaychat_flutter/screens/auth/welcome_screen.dart';

void main() {
  testWidgets('renders WelcomeScreen UI elements correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: MaterialApp(
          theme: darkTheme,
          home: const WelcomeScreen(),
        ),
      ),
    );

    expect(find.text('Welcome to SabayChat'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2)); // Email and Password fields
  });
}
