# SabayChat Design Tokens

This folder contains the shared design language for both native platforms.

## Core tokens

- Colors: blue gradients, dark surfaces, text colors, semantic colors
- Typography: Cambodian and Latin type scale
- Spacing: 4px base scale
- Border radius: 12, 16, 20, 28
- Icons: tab icons, message actions, profile actions
- Animations: spring motion and transitions

## Shared values

```yaml
colors:
  primary: '#1D6BFF'
  primaryDark: '#0F4CC9'
  surface: '#0F172A'
  surfaceElevated: '#111C2D'
  background: '#0B0F1A'
  textPrimary: '#F9FAFB'
  textSecondary: '#A7B0C0'
  success: '#2ECF9A'
  warning: '#FFB84D'
  error: '#FF5C5C'
  border: '#24324A'

spacing:
  xs: 4
  sm: 8
  md: 12
  lg: 16
  xl: 20
  xxl: 28

radius:
  small: 8
  medium: 16
  large: 24
  full: 999
```

## Platform mapping

- iOS: SwiftUI Design System
- Android: Jetpack Compose Design System
- Both: equivalent values, same visual identity, same Figma-driven sizing

## Notes

These tokens are intentionally consistent with the business identity of SabayChat and the provided mock design references.
