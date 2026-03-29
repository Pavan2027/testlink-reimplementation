"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({ open, onClose, title, description, children, size = "md" }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`w-full ${sizes[size]} card shadow-2xl`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-[hsl(var(--border))]">
                <div>
                  <h2 className="text-base font-semibold">{title}</h2>
                  {description && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors p-1 rounded-md hover:bg-[hsl(var(--surface-raised))]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}