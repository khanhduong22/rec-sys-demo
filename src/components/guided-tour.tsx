"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { ACTIONS, EVENTS, STATUS } from "react-joyride";
import type { CallBackProps, Step } from "react-joyride";
import { HelpCircle } from "lucide-react";

// Dynamic import to avoid SSR issues
const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

const tourSteps: Step[] = [
  {
    target: "#user-selector",
    content: (
      <div>
        <h3 className="font-bold text-base mb-2">👤 Step 1: Select a User</h3>
        <p className="text-sm">
          Start by choosing a mock user. Each user has a unique purchase history
          that the AI uses to generate personalized recommendations.
        </p>
      </div>
    ),
    placement: "bottom",
    disableBeacon: true,
    spotlightPadding: 8,
  },
  {
    target: "#user-info-bar",
    content: (
      <div>
        <h3 className="font-bold text-base mb-2">📋 Step 2: Purchase History</h3>
        <p className="text-sm">
          This bar shows the selected user&apos;s past purchases. The recommendation
          engine analyzes these products to find patterns in tags and co-purchases.
        </p>
      </div>
    ),
    placement: "bottom",
    spotlightPadding: 8,
  },
  {
    target: "#content-based-section",
    content: (
      <div>
        <h3 className="font-bold text-base mb-2">🟣 Step 3: Content-Based Filtering</h3>
        <p className="text-sm mb-2">
          The engine uses <strong>Cosine Similarity</strong> on product tag vectors
          to find products similar to what the user already bought.
        </p>
        <p className="text-sm text-violet-400">
          Each card shows a violet badge explaining <em>why</em> it was recommended
          (e.g., &quot;Because you liked UltraBook Pro&quot;).
        </p>
      </div>
    ),
    placement: "top",
    spotlightPadding: 12,
  },
  {
    target: "#fbt-section",
    content: (
      <div>
        <h3 className="font-bold text-base mb-2">🟡 Step 4: Frequently Bought Together</h3>
        <p className="text-sm mb-2">
          This section analyzes <strong>other users&apos; purchase patterns</strong>.
          If someone who bought the same items also bought something else,
          it appears here.
        </p>
        <p className="text-sm text-amber-400">
          Amber badges show the co-purchase relationship.
        </p>
      </div>
    ),
    placement: "top",
    spotlightPadding: 12,
  },
  {
    target: "#similarity-matrix-section",
    content: (
      <div>
        <h3 className="font-bold text-base mb-2">🧮 Step 5: Similarity Matrix</h3>
        <p className="text-sm mb-2">
          This heatmap visualizes the <strong>cosine similarity</strong> between
          every pair of products. Greener cells = more similar tag profiles.
        </p>
        <p className="text-sm text-cyan-400">
          Hover over any cell to see the exact similarity percentage!
        </p>
      </div>
    ),
    placement: "top",
    spotlightPadding: 12,
  },
  {
    target: "#how-it-works-link",
    content: (
      <div>
        <h3 className="font-bold text-base mb-2">📖 Deep Dive</h3>
        <p className="text-sm">
          Want to understand the math? Visit the <strong>&quot;How It Works&quot;</strong> page
          for an interactive breakdown — including a live vector comparison tool
          where you can pick any two products and see the calculation step by step.
        </p>
      </div>
    ),
    placement: "bottom",
    spotlightPadding: 8,
  },
];

interface GuidedTourProps {
  readonly hasSelectedUser: boolean;
}

export function GuidedTour({ hasSelectedUser }: GuidedTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter steps based on whether user is selected
  const activeSteps = hasSelectedUser
    ? tourSteps
    : tourSteps.filter((_, i) => i === 0 || i === 5); // Only show user selector & deep dive

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { action, index, status, type } = data;

      if (
        type === EVENTS.STEP_AFTER ||
        type === EVENTS.TARGET_NOT_FOUND
      ) {
        setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
      } else if (
        status === STATUS.FINISHED ||
        status === STATUS.SKIPPED
      ) {
        setRun(false);
        setStepIndex(0);
      }
    },
    []
  );

  const startTour = useCallback(() => {
    setStepIndex(0);
    setRun(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Joyride
        callback={handleCallback}
        continuous
        run={run}
        stepIndex={stepIndex}
        steps={activeSteps}
        showSkipButton
        showProgress
        scrollToFirstStep
        scrollOffset={100}
        disableScrollParentFix
        styles={{
          options: {
            arrowColor: "hsl(240 4% 16%)",
            backgroundColor: "hsl(240 4% 16%)",
            overlayColor: "rgba(0, 0, 0, 0.75)",
            primaryColor: "hsl(262.1 83.3% 57.8%)",
            textColor: "hsl(0 0% 98%)",
            width: 420,
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: "12px",
            padding: "20px",
          },
          buttonNext: {
            backgroundColor: "hsl(262.1 83.3% 57.8%)",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            padding: "8px 16px",
          },
          buttonBack: {
            color: "hsl(0 0% 63.9%)",
            marginRight: "auto",
            fontSize: "13px",
          },
          buttonSkip: {
            color: "hsl(0 0% 63.9%)",
            fontSize: "12px",
          },
          spotlight: {
            borderRadius: "12px",
          },
          tooltipContent: {
            padding: "8px 0",
          },
        }}
        locale={{
          back: "← Back",
          close: "Close",
          last: "Finish Tour ✨",
          next: "Next →",
          skip: "Skip Tour",
        }}
      />

      <button
        onClick={startTour}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-lg shadow-violet-500/25 transition-all duration-300 hover:scale-105 hover:shadow-violet-500/40 group"
        title="Start guided tour"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-sm font-semibold group-hover:block hidden sm:block">
          Take a Tour
        </span>
      </button>
    </>
  );
}
