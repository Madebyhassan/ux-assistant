import ScoreMiniCard from "./ScoreMiniCard";

function ScoreSection({ activeFilter, setActiveFilter, feedbackData }) {
  const scores = feedbackData
    ? [
        {
          id: "usability",
          label: "Usability",
          score: feedbackData.scores.usability,
        },
        {
          id: "hierarchy",
          label: "Visual Hierarchy",
          score: feedbackData.scores.hierarchy,
        },
        {
          id: "accessibility",
          label: "Accessibility",
          score: feedbackData.scores.accessibility,
        },
        {
          id: "userflow",
          label: "User Flow",
          score: feedbackData.scores.userflow,
        },
        {
          id: "copy",
          label: "Copy & Messaging",
          score: feedbackData.scores.copy,
        },
      ]
    : [];

  const overallScore = feedbackData?.overallScore ?? 0;
  const lowest =
    scores.length > 0
      ? scores.reduce((a, b) => (a.score < b.score ? a : b)).id
      : null;

  const handleCardClick = (id) => {
    setActiveFilter((prev) => (prev === id ? "all" : id));
  };

  return (
    <div className="px-6 pt-5 pb-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
      {/* Overall score — fixed layout */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Overall UX Score
          </p>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-extrabold text-gray-900 leading-none tracking-tight">
              {overallScore}
            </span>
            <span className="text-2xl text-gray-300 pb-2 font-medium">
              / 10
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              overallScore >= 8
                ? "bg-green-100 text-green-800"
                : overallScore >= 6
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {overallScore >= 8
              ? "Looking good"
              : overallScore >= 6
                ? "Needs improvement"
                : "Needs work"}
          </span>
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-300 mb-2.5">
        👆 Click a scorecard to focus feedback on that dimension
      </p>

      {/* Mini score cards */}
      <div className="grid grid-cols-3 gap-2">
        {scores.map((s) => (
          <ScoreMiniCard
            key={s.id}
            {...s}
            isActive={activeFilter === s.id}
            isLowest={s.id === lowest}
            onClick={() => handleCardClick(s.id)}
          />
        ))}
      </div>

      {/* View all button */}
      {activeFilter !== "all" && (
        <button
          onClick={() => setActiveFilter("all")}
          className="w-full mt-2.5 py-2 text-xs font-semibold text-gray-400 bg-white border border-gray-200 rounded-xl hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
        >
          ⊞ View all dimensions
        </button>
      )}
    </div>
  );
}

export default ScoreSection;
