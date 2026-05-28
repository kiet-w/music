"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ListMusic, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddToPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
}

const DEMO_PLAYLISTS = [
  { id: "1", title: "Midnight Melodies" },
  { id: "2", title: "Morning Vibes" },
  { id: "3", title: "Focus Flow" },
];

export const AddToPlaylistDialog = ({
  isOpen,
  onClose,
  songTitle,
}: AddToPlaylistDialogProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAdd = (id: string) => {
    setSelectedId(id);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setSelectedId(null);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md p-6 mx-4"
          >
            <div className="glass-dark rounded-3xl p-6 shadow-soft border border-white/10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Add to Playlist</h2>
                  <p className="text-sm text-white/40 mt-1">Select a playlist for "{songTitle}"</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {DEMO_PLAYLISTS.map((playlist) => (
                  <button
                    key={playlist.id}
                    disabled={isSuccess}
                    onClick={() => handleAdd(playlist.id)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                      selectedId === playlist.id
                        ? "bg-accent/20 border-accent/50 text-accent"
                        : "bg-white/5 border-transparent hover:bg-white/10 text-white/80"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <ListMusic className="w-5 h-5 opacity-40" />
                      <span className="font-medium">{playlist.title}</span>
                    </div>
                    {selectedId === playlist.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>

              <button className="w-full mt-6 py-4 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white/60 hover:border-white/40 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Create New Playlist</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
