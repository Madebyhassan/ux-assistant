import FeedbackItem from "./FeedbackItem";

const sevOrder = { critical: 0, moderate: 1, minor: 2 };

function FeedbackSection({ activeFilter, feedbackData }) {
  if (!feedbackData) return null;

  const filtered =
    activeFilter === "all"
      ? feedbackData
      : {
          working: feedbackData.working.filter((w) =>
            w.dims.includes(activeFilter),
          ),
          issues: feedbackData.issues.filter((i) =>
            i.dims.includes(activeFilter),
          ),
        };

  const sortedIssues = [...filtered.issues].sort(
    (a, b) => sevOrder[a.sev] - sevOrder[b.sev],
  );

  return (
    <>
      {/* What's Working */}
      {filtered.working.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm">✅</span>
            <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">
              What's Working
            </span>
            <span className="ml-auto text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
              {filtered.working.length} observation
              {filtered.working.length !== 1 ? "s" : ""}
            </span>
          </div>
          {filtered.working.map((w) => (
            <div
              key={w.id}
              className="px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded-full flex items-center justify-center text-[9px] text-green-700 shrink-0">
                  ✓
                </div>
                <p className="text-sm font-bold text-gray-900">{w.title}</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed pl-6">
                {w.why}
              </p>
              <p className="text-[10px] text-gray-300 font-mono pl-6 mt-1">
                📖 {w.source}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Key Issues */}
      {sortedIssues.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm">⚠️</span>
            <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">
              Key Issues
            </span>
            {activeFilter === "all" && (
              <span className="text-[10px] text-gray-300 italic">
                ordered by severity
              </span>
            )}
            <span className="ml-auto text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
              {sortedIssues.length} issue{sortedIssues.length !== 1 ? "s" : ""}
            </span>
          </div>
          {sortedIssues.map((issue) => (
            <FeedbackItem key={issue.id} {...issue} />
          ))}
        </div>
      )}

      {/* No results */}
      {filtered.working.length === 0 && sortedIssues.length === 0 && (
        <div className="text-center py-10">
          <p className="text-2xl mb-2">✨</p>
          <p className="text-sm font-bold text-gray-900 mb-1">
            No issues in this area
          </p>
          <p className="text-xs text-gray-400">
            This dimension looks solid. Try another scorecard.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2.5">
        <button className="flex-1 py-2.5 text-sm font-semibold text-gray-500 bg-white border-[1.5px] border-gray-300 rounded-xl hover:border-gray-900 hover:text-gray-900 transition-all">
          📋 Copy feedback
        </button>
        <button className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-500 border-[1.5px] border-indigo-500 rounded-xl hover:bg-indigo-600 transition-all">
          ＋ Analyse another
        </button>
      </div>
    </>
  );
}

export default FeedbackSection;
