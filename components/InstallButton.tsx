"use client";

import { useEffect, useState } from "react";
import { colors } from "@/lib/tokens";

const sidebarButtonStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  padding: "9px 12px",
  borderRadius: 9,
  border: `1.5px solid ${colors.secondary}`,
  color: colors.secondary,
  background: "transparent",
  cursor: "pointer",
  fontFamily: "inherit",
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred) return null;

  return (
    <button
      type="button"
      style={{ ...sidebarButtonStyle, width: "100%" }}
      onClick={async () => {
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
      }}
    >
      Instalar app
    </button>
  );
}
