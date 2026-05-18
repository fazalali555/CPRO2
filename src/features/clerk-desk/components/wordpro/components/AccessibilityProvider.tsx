import React, { createContext, useContext, useEffect, useState } from "react";

interface AccessibilityContextType {
  isScreenReaderActive: boolean;
  announceMessage: (message: string, priority?: "polite" | "assertive") => void;
  focusMode: boolean;
  setFocusMode: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

/**
 * Accessibility provider component
 */
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [announcementPriority, setAnnouncementPriority] = useState<"polite" | "assertive">("polite");

  useEffect(() => {
    // Detect if screen reader is active
    const checkScreenReader = () => {
      // Check for common screen reader user agent strings
      const ua = navigator.userAgent.toLowerCase();
      const isScreenReaderUA =
        ua.includes("jaws") ||
        ua.includes("nvda") ||
        ua.includes("voiceover") ||
        ua.includes("narrator");

      setIsScreenReaderActive(isScreenReaderUA);
    };

    checkScreenReader();

    // Listen for keyboard navigation to enable focus mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        setFocusMode(true);
      }
    };

    const handleMouseDown = () => {
      setFocusMode(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  const announceMessage = (message: string, priority: "polite" | "assertive" = "polite") => {
    setAnnouncement(message);
    setAnnouncementPriority(priority);
    // Clear announcement after it's been read
    setTimeout(() => setAnnouncement(""), 1000);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        isScreenReaderActive,
        announceMessage,
        focusMode,
        setFocusMode,
      }}
    >
      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live={announcementPriority}
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Focus mode indicator */}
      {focusMode && (
        <style>{`
          *:focus {
            outline: 2px solid #3b82f6 !important;
            outline-offset: 2px !important;
          }
        `}</style>
      )}

      {children}
    </AccessibilityContext.Provider>
  );
}

/**
 * Hook to use accessibility context
 */
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
}

/**
 * Accessible button component with ARIA labels
 */
export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaHasPopup?: boolean;
}

export function AccessibleButton({
  ariaLabel,
  ariaPressed,
  ariaExpanded,
  ariaHasPopup,
  children,
  ...props
}: AccessibleButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Accessible heading component
 */
export function AccessibleHeading({
  level = 1,
  children,
  ...props
}: {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLHeadingElement>) {
  const HeadingComponent = [
    () => <h1 {...props}>{children}</h1>,
    () => <h2 {...props}>{children}</h2>,
    () => <h3 {...props}>{children}</h3>,
    () => <h4 {...props}>{children}</h4>,
    () => <h5 {...props}>{children}</h5>,
    () => <h6 {...props}>{children}</h6>,
  ][level - 1];
  return HeadingComponent ? <HeadingComponent /> : null;
}

/**
 * Skip to main content link
 */
export function SkipToMainContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:p-2"
    >
      Skip to main content
    </a>
  );
}
