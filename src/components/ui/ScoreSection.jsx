import ScoreMiniCard from "./ScoreMiniCard";

const scores = [
  { id: "usability", label: "Usability", score: 7.8 },
  { id: "hierarchy", label: "Visual Hierarchy", score: 6.5 },
  { id: "accessibility", label: "Accessibility", score: 5.8, lowest: true },
  { id: "userflow", label: "User Flow", score: 8.2 },
  { id: "copy", label: "Copy & Messaging", score: 7.0 },
];

function ScoreSection({ activeFilter, setActiveFilter }) {
  const handleCardClick = (id) => {
    setActiveFilter((prev) => (prev === id ? "all" : id));
  };

  return (
    <div className="px-6 pt-5 pb-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
      {/* Overall score */}
      <div className="flex items-end justify-between mb-3 pb-3 border-b border-gray-200">
        <div className="flex items-end gap-1">
          <span className="text-5xl font-extrabold text-gray-900 leading-none tracking-tight">
            7.2
          </span>
          <span className="text-lg text-gray-300 pb-1.5">/ 10</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Overall UX Score
          </p>
          <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
            Needs improvement
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
            onClick={() => handleCardClick(s.id)}
          />
        ))}
      </div>

      {/* View all button — only shows when a filter is active */}
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
