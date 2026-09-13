import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/glass_widgets.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});
  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  bool registering = false;
  bool obscure = true;
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: kNavy,
      body: SafeArea(
        child: GlassBackground(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 86,
                    height: 86,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [kBlue, Color(0xFF0F4CC9)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: kBlue.withValues(alpha: .4),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.send_rounded, color: Colors.white, size: 44),
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: Text(
                    registering ? 'Create Account' : 'Welcome to SabayChat',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Center(
                  child: Text(
                    registering
                        ? 'Join the fast, secure Cambodian messenger.'
                        : 'Fast, secure & private messaging for everyone.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: kMuted, fontSize: 13),
                  ),
                ),
                const SizedBox(height: 30),
                if (registering) ...[
                  const Text('DISPLAY NAME',
                      style: TextStyle(color: kMuted, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(
                      hintText: 'Your name',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                const Text('EMAIL ADDRESS',
                    style: TextStyle(color: kMuted, fontSize: 11, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    hintText: 'name@example.com',
                    prefixIcon: Icon(Icons.mail_outline),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('PASSWORD',
                    style: TextStyle(color: kMuted, fontSize: 11, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: passwordController,
                  obscureText: obscure,
                  decoration: InputDecoration(
                    hintText: 'At least 6 characters',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => obscure = !obscure),
                      icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                if (auth.error.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(auth.error, style: const TextStyle(color: kRed, fontSize: 13)),
                  ),
                LiquidGlass(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      const Text(
                        'SabayChat is protected with encrypted connections.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: kMuted, fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: FilledButton(
                          onPressed: auth.loading
                              ? null
                              : () {
                                  if (registering) {
                                    auth.register(
                                      nameController.text,
                                      emailController.text,
                                      passwordController.text,
                                    );
                                  } else {
                                    auth.login(
                                      emailController.text,
                                      passwordController.text,
                                    );
                                  }
                                },
                          style: FilledButton.styleFrom(
                            backgroundColor: kBlue,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: Text(
                            auth.loading
                                ? 'Please wait...'
                                : (registering ? 'Create Account' : 'Sign In'),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Center(
                  child: TextButton(
                    onPressed: () {
                      auth.clearError();
                      setState(() => registering = !registering);
                    },
                    child: Text(
                      registering
                          ? 'Already have an account? Sign In'
                          : 'New to SabayChat? Create Account',
                      style: const TextStyle(color: kBlue),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Center(
                  child: Text(
                    'Secure connection • Made in Cambodia 🇰🇭',
                    style: TextStyle(color: kMuted, fontSize: 11),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
