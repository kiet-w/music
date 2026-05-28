# Design Spec: Player Timeline Scrolling Enhancement

Enhance the player timeline for better usability and aesthetics, specifically targeting the range slider's "scrollability" and responsive feel.

## Goals
- Make the timeline thumb easier to grab (larger hit area).
- Add interactive feedback (hover scaling).
- Ensure responsive seeking.

## Proposed Changes

### 1. Global Styles (`frontend/src/app/globals.css`)
Add custom utility classes for the player slider using pseudo-elements for cross-browser consistency.

```css
@layer components {
  .player-slider {
    @apply appearance-none bg-secondary rounded-full h-1.5 w-full outline-none transition-all cursor-pointer;
  }

  /* Webkit (Chrome, Safari, Edge) */
  .player-slider::-webkit-slider-thumb {
    @apply appearance-none w-4 h-4 bg-primary rounded-full transition-all duration-200 shadow-sm border-2 border-background;
    margin-top: -5px; /* Centers thumb on the 1.5h track */
  }

  .player-slider:hover::-webkit-slider-thumb {
    @apply scale-125 shadow-md bg-primary;
  }

  .player-slider::-webkit-slider-runnable-track {
    @apply w-full h-1.5 bg-secondary rounded-full;
  }

  /* Firefox */
  .player-slider::-moz-range-thumb {
    @apply w-4 h-4 bg-primary border-2 border-background rounded-full transition-all duration-200 shadow-sm;
  }

  .player-slider:hover::-moz-range-thumb {
    @apply scale-125 shadow-md;
  }

  .player-slider::-moz-range-track {
    @apply w-full h-1.5 bg-secondary rounded-full;
  }
}
```

### 2. Player Component (`frontend/src/components/molecules/Player/Player.tsx`)
- Apply the `.player-slider` class.
- Add `onMouseDown` and `onMouseUp` handlers to temporarily pause progress updates while dragging, preventing the "jumping" behavior during seeking.
- Use `onInput` for real-time visual feedback of the thumb, while keeping `onChange` for the final seek action (or vice-versa depending on desired feel).

## Success Criteria
- Thumb scales up on hover.
- Thumb is 16px wide/high (larger than default).
- Progress bar doesn't "fight" the user while they are dragging it.
- Smooth seeking across the entire duration.
