import SwiftUI

enum SabayChatColors {
    static let primary = Color(red: 0.10, green: 0.42, blue: 1.00)
    static let primaryDark = Color(red: 0.05, green: 0.28, blue: 0.76)
    static let background = Color(red: 0.06, green: 0.09, blue: 0.13)
    static let surface = Color(red: 0.12, green: 0.17, blue: 0.24)
    static let card = Color(red: 0.18, green: 0.22, blue: 0.31)
    static let textPrimary = Color.white
    static let textSecondary = Color(red: 0.70, green: 0.74, blue: 0.82)
    static let border = Color(red: 0.22, green: 0.33, blue: 0.48)
    static let success = Color(red: 0.18, green: 0.81, blue: 0.64)
}

extension Color {
    static let sabayPrimary = SabayChatColors.primary
    static let sabayBackground = SabayChatColors.background
    static let sabaySurface = SabayChatColors.surface
}

struct SabayChatBackground: View {
    @State private var animate = false

    var body: some View {
        ZStack {
            SabayChatColors.background
            Circle()
                .fill(SabayChatColors.primary.opacity(0.18))
                .frame(width: 280, height: 280)
                .blur(radius: 10)
                .offset(x: animate ? 150 : 70, y: animate ? -290 : -220)
            Circle()
                .fill(Color.purple.opacity(0.13))
                .frame(width: 240, height: 240)
                .blur(radius: 14)
                .offset(x: animate ? -160 : -90, y: animate ? 240 : 320)
        }
        .ignoresSafeArea()
        .animation(.easeInOut(duration: 8).repeatForever(autoreverses: true), value: animate)
        .onAppear { animate = true }
    }
}

struct SabayGlassCard: ViewModifier {
    var cornerRadius: CGFloat = 20

    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial.opacity(0.72))
            .background(SabayChatColors.surface.opacity(0.68))
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(.white.opacity(0.10), lineWidth: 1)
            }
            .shadow(color: .black.opacity(0.20), radius: 18, y: 8)
    }
}

extension View {
    func sabayGlass(cornerRadius: CGFloat = 20) -> some View {
        modifier(SabayGlassCard(cornerRadius: cornerRadius))
    }
}

struct SabayPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .opacity(configuration.isPressed ? 0.88 : 1)
            .animation(.easeOut(duration: 0.16), value: configuration.isPressed)
    }
}
