// Module-level store — mutations here do NOT trigger React re-renders.
// This lets the Overshoot stream write results continuously without causing
// PromptInput focus loss or component jank.
export const overshootStore = {
  latestResult: undefined as string | undefined,
};
