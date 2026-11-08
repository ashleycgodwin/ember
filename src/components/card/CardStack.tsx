"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Contact } from "@/types/contact";
import type { ThresholdConfig } from "@/types/settings";
import ContactCard from "@/components/card/ContactCard";

type FlipDirection = "forward" | "back" | null;

interface CardStackProps {
  contacts: Contact[];
  config: ThresholdConfig;
  /** Called when the front card is clicked/activated */
  onCardClick?: (contact: Contact) => void;
}

export default function CardStack({
  contacts,
  config,
  onCardClick,
}: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipDir, setFlipDir] = useState<FlipDirection>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0); // index shown during animation
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (dir: "forward" | "back") => {
      if (isAnimating || contacts.length <= 1) return;

      const next =
        dir === "forward"
          ? (currentIndex + 1) % contacts.length
          : (currentIndex - 1 + contacts.length) % contacts.length;

      setFlipDir(dir);
      setIsAnimating(true);

      // Halfway through: swap the card being shown
      const swapTimer = setTimeout(() => {
        setDisplayIndex(next);
      }, 160); // half of 320ms animation

      // End of animation
      const doneTimer = setTimeout(() => {
        setCurrentIndex(next);
        setFlipDir(null);
        setIsAnimating(false);
      }, 320);

      return () => {
        clearTimeout(swapTimer);
        clearTimeout(doneTimer);
      };
    },
    [isAnimating, contacts.length, currentIndex]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Only respond when focus is inside the card area or on the container
      if (!containerRef.current?.contains(document.activeElement)) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goTo("forward");
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goTo("back");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goTo]);

  // ── Empty state ────────────────────────────────────────────────────
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div
          className="text-5xl opacity-30"
          aria-hidden="true"
          style={{ filter: "drop-shadow(0 0 8px #f59e0b)" }}
        >
          🔥
        </div>
        <p
          className="font-typewriter text-lg text-center max-w-xs"
          style={{ color: "rgba(245,240,232,0.5)" }}
        >
          Your card file is empty.
          <br />
          Add your first contact to get started.
        </p>
      </div>
    );
  }

  // ── Which animation class to apply to the front card ──────────────
  const animClass =
    flipDir === "forward"
      ? isAnimating && displayIndex !== currentIndex
        ? "card-flip-exit-forward"
        : "card-flip-enter-forward"
      : flipDir === "back"
        ? isAnimating && displayIndex !== currentIndex
          ? "card-flip-exit-back"
          : "card-flip-enter-back"
        : "";

  const visibleContact = contacts[displayIndex];
  const hasPrev = contacts.length > 1;
  const hasNext = contacts.length > 1;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-8 select-none"
      aria-label="Contact card file"
    >
      {/* ── Counter ─────────────────────────────────────────────────── */}
      <p
        className="font-typewriter text-sm tracking-widest uppercase"
        style={{ color: "rgba(245,240,232,0.4)" }}
        aria-live="polite"
        aria-atomic="true"
      >
        {currentIndex + 1} / {contacts.length}
      </p>

      {/* ── Stage ───────────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center gap-6">
        {/* Previous button */}
        <button
          aria-label="Previous card"
          onClick={() => goTo("back")}
          disabled={!hasPrev || isAnimating}
          className={[
            "flex items-center justify-center",
            "w-10 h-10 rounded-full",
            "text-xl leading-none",
            "transition-all duration-150",
            "disabled:opacity-20 disabled:cursor-not-allowed",
            "hover:scale-110 active:scale-95",
          ].join(" ")}
          style={{
            background: "rgba(245,240,232,0.06)",
            border: "1px solid rgba(245,240,232,0.15)",
            color: "rgba(245,240,232,0.7)",
          }}
        >
          ‹
        </button>

        {/* Card stack area */}
        <div
          className="relative"
          style={{
            width: 420,
            height: 290, // card height + spindle rod
          }}
        >
          {/* Depth shadow cards (decorative, non-interactive) */}
          {contacts.length > 2 && (
            <div
              aria-hidden="true"
              className="absolute inset-0 card-paper rounded-sm card-stack-shadow-2"
              style={{ zIndex: 0 }}
            />
          )}
          {contacts.length > 1 && (
            <div
              aria-hidden="true"
              className="absolute inset-0 card-paper rounded-sm card-stack-shadow-1"
              style={{ zIndex: 1 }}
            />
          )}

          {/* Spindle rod — horizontal bar through the hole-punch */}
          <div
            aria-hidden="true"
            className="absolute spindle-rod"
            style={{
              top: 20,         // aligns with hole-punch centre (top:13px + ~7px offset)
              left: "50%",
              transform: "translateX(-50%)",
              width: 460,      // wider than card
              height: 8,
              zIndex: 10,
            }}
          />

          {/* The active front card */}
          <div
            className={`absolute inset-0 ${animClass}`}
            style={{
              zIndex: 5,
              transformOrigin: "center",
              willChange: "transform, opacity",
            }}
            onAnimationEnd={() => {
              // After enter animation completes, clear the class
              if (
                animClass === "card-flip-enter-forward" ||
                animClass === "card-flip-enter-back"
              ) {
                setFlipDir(null);
              }
            }}
          >
            <ContactCard
              contact={visibleContact}
              config={config}
              isActive={true}
              onClick={() => onCardClick?.(visibleContact)}
            />
          </div>
        </div>

        {/* Next button */}
        <button
          aria-label="Next card"
          onClick={() => goTo("forward")}
          disabled={!hasNext || isAnimating}
          className={[
            "flex items-center justify-center",
            "w-10 h-10 rounded-full",
            "text-xl leading-none",
            "transition-all duration-150",
            "disabled:opacity-20 disabled:cursor-not-allowed",
            "hover:scale-110 active:scale-95",
          ].join(" ")}
          style={{
            background: "rgba(245,240,232,0.06)",
            border: "1px solid rgba(245,240,232,0.15)",
            color: "rgba(245,240,232,0.7)",
          }}
        >
          ›
        </button>
      </div>

      {/* Keyboard hint */}
      <p
        className="text-xs tracking-wide"
        style={{ color: "rgba(245,240,232,0.25)" }}
      >
        ← → arrow keys to flip
      </p>
    </div>
  );
}
