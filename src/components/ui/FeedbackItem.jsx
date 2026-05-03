function FeedbackItem({ sev, title, what, why, how, source }) {
  const borderColor = {
    critical: "border-l-red-500",
    moderate: "border-l-amber-400",
    minor: "border-l-gray-300",
  };

  const badgeStyle = {
    critical: "bg-red-50 text-red-800 border-red-200",
    moderate: "bg-amber-50 text-amber-800 border-amber-200",
    minor: "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <div
      className={`px-4 py-4 border-b border-gray-100 last:border-0 border-l-[3px] ${borderColor[sev]} hover:bg-gray-50 transition-colors`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeStyle[sev]}`}
        >
          {sev.charAt(0).toUpperCase() + sev.slice(1)}
        </span>
        <p className="text-sm font-bold text-gray-900">{title}</p>
      </div>
      <div className="flex flex-col gap-2">
        {[
          ["WHAT", what],
          ["WHY", why],
          ["HOW", how],
        ].map(([label, text]) => (
          <div key={label} className="flex gap-2.5 items-start">
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest w-8 flex-shrink-0 pt-0.5 font-mono">
              {label}
            </span>
            <p
              className="text-xs text-gray-500 leading-relaxed flex-1"
              dangerouslySetInnerHTML={{ __html: text }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-indigo-500 font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
        📖 {source}
      </div>
    </div>
  );
}

export default FeedbackItem;
