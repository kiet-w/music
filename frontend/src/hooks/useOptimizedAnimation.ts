import { useState, useEffect } from 'react';

/**
 * GPU-accelerated animation variants for Framer Motion
 * Optimized for 120fps performance
 */
export const optimizedMotionVariants = {
  // Scale animations with GPU acceleration
  scale: {
    initial: { 
      scale: 0.95, 
      opacity: 0 
    },
    animate: { 
      scale: 1, 
      opacity: 1 
    },
    exit: { 
      scale: 0.95, 
      opacity: 0 
    },
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 320,
      mass: 0.3
    }
  },

  // Slide up animation
  slideUp: {
    initial: { 
      y: 15, 
      opacity: 0 
    },
    animate: { 
      y: 0, 
      opacity: 1 
    },
    exit: { 
      y: 15, 
      opacity: 0 
    },
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 320,
      mass: 0.3
    }
  },

  // Slide down animation
  slideDown: {
    initial: { 
      y: -15, 
      opacity: 0 
    },
    animate: { 
      y: 0, 
      opacity: 1 
    },
    exit: { 
      y: -15, 
      opacity: 0 
    },
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 320,
      mass: 0.3
    }
  },

  // Fade animation
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },

  // Stagger children animation
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },

  staggerItem: {
    initial: { 
      opacity: 0, 
      y: 10 
    },
    animate: { 
      opacity: 1, 
      y: 0 
    },
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 300
    }
  }
};

/**
 * Optimized drag configuration for smooth 120fps dragging
 */
export const optimizedDragConfig = {
  // Enable GPU acceleration during drag
  whileDrag: {
    scale: 1.02,
    zIndex: 100,
    transform: 'translateZ(0)'
  },
  // Smooth spring animation
  transition: {
    type: 'spring' as const,
    stiffness: 600,
    damping: 40,
    mass: 0.3
  },
  // Optimize drag performance
  drag: {
    // Use GPU acceleration
    dragConstraints: { top: 0, bottom: 0, left: 0, right: 0 },
    dragElastic: 0.1,
    dragMomentum: true,
    dragTransition: {
      bounceStiffness: 600,
      bounceDamping: 40
    }
  }
};

/**
 * Performance-optimized animation settings
 */
export const animationSettings = {
  // Reduce motion for accessibility
  reducedMotion: typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false,
  
  // Target 120fps (8.33ms per frame)
  targetFPS: 120,
  frameTime: 1000 / 120,
  
  // Enable GPU acceleration hints
  useGPUAcceleration: true,
  
  // Content visibility for large lists
  useContentVisibility: true
};

/**
 * Check if device can handle high-performance animations
 * NOTE: Currently unused, kept for future implementation
 */
export function useAnimationCapability() {
  const [capability, setCapability] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    // Check for GPU acceleration support
    const hasGPUAcceleration = 
      'transform' in document.documentElement.style &&
      'backfaceVisibility' in document.documentElement.style;

    // Check device memory (if available)
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    // Determine capability based on hardware
    if (deviceMemory >= 8 && hardwareConcurrency >= 8 && hasGPUAcceleration) {
      setCapability('high');
    } else if (deviceMemory >= 4 && hardwareConcurrency >= 4 && hasGPUAcceleration) {
      setCapability('medium');
    } else {
      setCapability('low');
    }
  }, []);

  return capability;
}

/**
 * Get optimized animation settings based on device capability
 */
export function getOptimizedSettings(capability: 'high' | 'medium' | 'low') {
  switch (capability) {
    case 'high':
      return {
        enableParticles: true,
        enableBlur: true,
        complexAnimations: true,
        targetFPS: 120,
        transitionDuration: 0.2
      };
    case 'medium':
      return {
        enableParticles: false,
        enableBlur: true,
        complexAnimations: true,
        targetFPS: 60,
        transitionDuration: 0.3
      };
    case 'low':
      return {
        enableParticles: false,
        enableBlur: false,
        complexAnimations: false,
        targetFPS: 30,
        transitionDuration: 0.4
      };
  }
}