# Player Timeline Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the player timeline scrolling experience by improving thumb visibility, adding hover effects, and ensuring responsive seeking without "jumping" behavior.

**Architecture:** Use global CSS components for cross-browser range input styling and React state management to handle drag-to-seek logic.

**Tech Stack:** React, Tailwind CSS, Howler.js.

---

### Task 1: Add Global Slider Styles

**Files:**
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Add `.player-slider` component styles**

```css
@layer components {
  .player-slider {
    @apply appearance-none bg-secondary rounded-full h-1.5 w-full outline-none transition-all cursor-pointer disabled:cursor-not-allowed;
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

- [ ] **Step 2: Commit changes**

```bash
git add frontend/src/app/globals.css
git commit -m "style: add player-slider component styles to global.css"
```

---

### Task 2: Enhance Player Component Logic

**Files:**
- Modify: `frontend/src/components/molecules/Player/Player.tsx`

- [ ] **Step 1: Update progress logic to handle dragging state**

Modify `Player.tsx` to add `isDragging` state and update `startUpdate` to respect it.

```typescript
// Inside Player component
const [isDragging, setIsDragging] = useState(false);

const startUpdate = () => {
  const update = () => {
    if (howlRef.current && howlRef.current.playing() && !isDragging) {
      const seek = howlRef.current.seek();
      const duration = howlRef.current.duration();
      if (duration > 0) {
        setProgress((seek / duration) * 100);
      }
    }
    rafRef.current = requestAnimationFrame(update);
  };
  rafRef.current = requestAnimationFrame(update);
};
```

- [ ] **Step 2: Implement seek handlers**

```typescript
const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = parseFloat(e.target.value);
  setProgress(value);
};

const handleSeekEnd = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!howlRef.current) return;
  const value = parseFloat(e.target.value);
  const seekTime = (value / 100) * duration;
  howlRef.current.seek(seekTime);
  setProgress(value);
  setIsDragging(false);
};
```

- [ ] **Step 3: Apply the `.player-slider` class and events**

```tsx
<input 
  type="range" 
  min="0" 
  max="100" 
  step="0.1"
  value={progress} 
  onChange={handleSeekChange}
  onMouseDown={() => setIsDragging(true)}
  onMouseUp={handleSeekEnd}
  onTouchStart={() => setIsDragging(true)}
  onTouchEnd={handleSeekEnd}
  className="player-slider"
  disabled={!url || duration === 0}
/>
```

- [ ] **Step 4: Commit changes**

```bash
git add frontend/src/components/molecules/Player/Player.tsx
git commit -m "feat: enhance player timeline with smooth dragging and custom styles"
```

---

### Task 3: Verification

- [ ] **Step 1: Verify styles**
Ensure the range slider looks as expected in the browser (large thumb, scale on hover).

- [ ] **Step 2: Verify functionality**
Ensure dragging the slider doesn't "jump" and that the audio seeks correctly when released.
