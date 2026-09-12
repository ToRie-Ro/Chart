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
