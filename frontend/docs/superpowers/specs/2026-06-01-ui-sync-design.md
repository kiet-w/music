# Design Spec: UI/UX Synchronization (Harmony Music)

## 1. Visual Direction: Hybrid "OLED Glass"
- **Auth Shell**: Immersive Glassmorphism (blur, gradients, floating cards) to create a premium first impression.
- **App Content**: Structured Minimalism (clean borders, consistent padding, deep blacks) for maximum readability and performance in list-heavy views (Albums, Tracks).
- **Core Palette**: OLED Black (#000000) backgrounds, Indigo/Violet primary accents, Green success/CTA.

## 2. Layout Architecture
- **Public Layout**: Centered glass card, no navigation, focus on form.
- **Protected Layout**: Standard mobile-first container (max-w-[430px]), Fixed PlayerBar at bottom, BottomTabBar below it.
- **Safe Areas**: 128px bottom padding (80px Player + 48px Nav) to prevent content overlap.

## 3. Standardized Components
- **Headers**: Page titles in 'Righteous' font, italicized, consistent margin-bottom: 32px.
- **Cards**: `rounded-2xl`, subtle border (`border-white/5`), consistent hover lift.
- **Loading**: Pulse skeletons matching the exact shape of the target components.
- **Empty States**: Centered icons (20% opacity), italicized text, clear primary CTA button.

## 4. Navigation & Feedback
- **Transitions**: 200ms ease-in-out for all hover and state changes.
- **PlayerBar**: Semi-transparent blur (#000000/80) with top border.

---
*Does this hybrid approach and layout specification look correct to you?*
