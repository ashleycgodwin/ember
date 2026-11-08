"use client";

/**
 * CardStackClient — thin client wrapper around CardStack.
 *
 * Card state depends on new Date() which Next.js 16 blocks during prerender.
 * We use useSyncExternalStore to detect the client environment cleanly
 * (no setState-in-effect, lint-safe), then render CardStack only on the client.
 */

import { useSyncExternalStore } from "react";
import CardStack from "@/components/card/CardStack";
import type { Contact } from "@/types/contact";
import type { ThresholdConfig } from "@/types/settings";

// useSyncExternalStore with a server snapshot of `false` and a client
// snapshot of `true` is the idiomatic React 18/19 way to detect hydration
// without calling setState inside an effect.
function subscribe() {
  return () => {}; // no external store to subscribe to
}
function getClientSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

function useIsClient() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

interface CardStackClientProps {
  contacts: Contact[];
  config: ThresholdConfig;
  onCardClick?: (contact: Contact) => void;
}

export default function CardStackClient({
  contacts,
  config,
  onCardClick,
}: CardStackClientProps) {
  const isClient = useIsClient();

  if (!isClient) {
    // Server / pre-hydration skeleton — keeps layout stable
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: 420, height: 290 }}
        aria-label="Loading card file…"
        aria-busy="true"
      >
        <div
          className="w-[420px] h-[260px] rounded-sm card-paper opacity-30"
        />
      </div>
    );
  }

  return (
    <CardStack
      key={contacts.length}
      contacts={contacts}
      config={config}
      onCardClick={onCardClick}
    />
  );
}
