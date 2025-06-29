# Text Sections in 3D Scene

This directory contains components for rendering text sections in the 3D scene.

## TextSection Component

The `TextSection.tsx` component renders 3D text with fade effects. It supports:

- Title and subtitle text
- Custom colors
- Custom font sizes
- Distance-based fade effects

### Usage

```tsx
import { TextSection } from "./TextSection";

// Basic usage
<TextSection
  title="Hello World"
  subtitle="This is a subtitle"
/>

// With custom properties
<TextSection
  title="Custom Text"
  subtitle="With custom properties"
  textColor="#ffcc00"
  titleSize={0.6}
  subtitleSize={0.25}
  maxWidth={3}
/>
```

## Configuration

Text sections are configured in `src/utils/sceneConfig.ts` using the `TEXT_SECTIONS` array. Each section includes:

- `title`: (optional) The main heading
- `subtitle`: The secondary text or description
- `position`: 3D position vector
- `rotation`: (optional) 3D rotation euler angles
- `textColor`: (optional) Custom text color
- `scrollPosition`: Position in the scroll timeline (0-1)

## Fonts

The component requires the following fonts to be placed in the `public/fonts` directory:

- `Inter-Bold.ttf`
- `Inter-Regular.ttf`

You can download them from [Google Fonts](https://fonts.google.com/specimen/Inter).
