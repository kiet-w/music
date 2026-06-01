'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function PlayingVisualizer() {
  return (
    <div className="flex gap-0.5 items-end h-3 flex-shrink-0">
      {[0.4, 0.7, 0.5].map((h, i) => (
        <motion.div 
          key={i}
          animate={{ height: ["20%", "100%", "20%"] }}
          transition={{ duration: h + 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
          className="w-0.5 bg-primary-foreground rounded-full"
        />
      ))}
    </div>
  );
};
