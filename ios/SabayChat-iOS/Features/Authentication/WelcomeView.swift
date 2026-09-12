import SwiftUI

struct WelcomeView: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [SabayChatColors.primary, SabayChatColors.primaryDark],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(alignment: .center, spacing: 20) {
                Spacer(minLength: 24)

                VStack(spacing: 12) {
                    Circle()
                        .frame(width: 72, height: 72)
                        .foregroundStyle(.white.opacity(0.2))
                        .overlay(
                            Image(systemName: "bubble.left.fill")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundStyle(.white)
                        )

                    Text("SabayChat")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)

                    Text("Made in Cambodia 🇰🇭")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(.white.opacity(0.8))
                }

                Spacer()

                VStack(alignment: .leading, spacing: 16) {
                    Text("Welcome")
                        .font(.largeTitle.weight(.bold))
                        .foregroundStyle(.white)

                    Text("Connect with friends across Cambodia and beyond.")
                        .font(.body)
                        .foregroundStyle(.white.opacity(0.8))

                    Button(action: {}) {
                        Text("Create Account")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .foregroundStyle(.white)
                            .font(.headline)
                            .background(.white.opacity(0.18))
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }

                    Button(action: {}) {
                        Text("Sign In")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .foregroundStyle(SabayChatColors.primaryDark)
                            .font(.headline)
                            .background(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                }
                .padding(24)
                .frame(maxWidth: 380)
                .background(Color.white.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(Color.white.opacity(0.12), lineWidth: 1)
                )

                Spacer(minLength: 20)
            }
            .padding(.horizontal, 24)
        }
    }
}

#Preview {
    WelcomeView()
}
