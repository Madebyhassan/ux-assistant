import EmptyState from "../ui/EmptyState";
import ScoreSection from "../ui/ScoreSection";
import FeedbackSection from "../ui/FeedbackSection";

function ResultsPanel({
  appState,
  activeFilter,
  setActiveFilter,
  feedbackData,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm min-h-96 flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
        <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">
          Feedback Results
        </p>
        <p className="text-xs text-gray-300">
          {appState === "input" && "Awaiting input"}
          {appState === "loading" && "Analysing..."}
          {appState === "results" && "Analysis complete · just now"}
        </p>
      </div>

      {/* Empty state */}
      {appState === "input" && <EmptyState />}

      {/* Loading state */}
      {appState === "loading" && <LoadingState />}

      {/* Results state */}
      {appState === "results" && (
        <div className="flex flex-col flex-1">
          <ScoreSection
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            feedbackData={feedbackData}
          />
          <div className="px-6 py-5 flex flex-col gap-4">
            <FeedbackSection
              activeFilter={activeFilter}
              feedbackData={feedbackData}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Loading state — lives here as it's only used by ResultsPanel
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 flex-1 px-10 py-16 text-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-indigo-50 flex items-center justify-center text-2xl">
          🧠
        </div>
        <div className="absolute -inset-1 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin"></div>
      </div>
      <div>
        <p className="text-base font-bold text-gray-900 mb-1">
          Analysing your design...
        </p>
        <p className="text-sm text-gray-400">
          Testing against UX principles & design laws
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {[
          "Reading your description",
          "Applying Nielsen's 10 Heuristics",
          "Checking WCAG & Laws of UX",
          "Generating What / Why / How",
          "Calculating UX score",
        ].map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></div>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResultsPanel;
