import { useState, useEffect, useRef, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'installDismissed';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|Chrome/.test(ua);
}

function isDismissedRecently(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY));
    if (isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function useInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [hasInstalled, setHasInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Already installed or dismissed recently
    if (isStandalone() || isDismissedRecently()) return;

    setIsIOS(isIOSSafari());

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show prompt after delay
    const timer = setTimeout(() => {
      if (!isStandalone() && !isDismissedRecently()) {
        setShowPrompt(true);
      }
    }, 12000);

    // For iOS, also show after delay (no beforeinstallprompt)
    const iosTimer = setTimeout(() => {
      if (isIOSSafari() && !isStandalone() && !isDismissedRecently()) {
        setShowPrompt(true);
      }
    }, 12000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
      clearTimeout(iosTimer);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return false;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      setHasInstalled(true);
      setShowPrompt(false);
      deferredPrompt.current = null;
      return true;
    }
    return false;
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch { /* noop */ }
    setShowPrompt(false);
  }, []);

  return { canInstall, isIOS, hasInstalled, showPrompt, triggerInstall, dismiss };
}
