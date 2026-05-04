function ScoreMiniCard({ label, score, isLowest, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative text-left px-3 py-2.5 rounded-xl border-[1.5px] transition-all
        ${
          isLowest && !isActive
            ? "bg-gray-900 border-gray-900 hover:bg-gray-800"
            : isActive
              ? "bg-indigo-50 border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.12)] -translate-y-0.5"
              : "bg-white border-gray-200 hover:border-indigo-500 hover:-translate-y-0.5 hover:shadow-md"
        }`}
    >
      <p
        className={`text-2xl font-extrabold leading-none mb-1 tracking-tight
        ${isLowest && !isActive ? "text-white" : isActive ? "text-indigo-500" : "text-gray-900"}`}
      >
        {score}
      </p>
      <p
        className={`text-[9px] font-bold uppercase tracking-widest
        ${isLowest && !isActive ? "text-white/40" : isActive ? "text-indigo-400" : "text-gray-300"}`}
      >
        {label}
      </p>
      {isLowest && !isActive && (
        <span className="inline-flex mt-1 text-[8px] font-bold bg-white/15 text-white/70 px-1.5 py-0.5 rounded">
          ↓ Priority
        </span>
      )}
      {isActive && (
        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-indigo-500 text-xs">
          ▾
        </span>
      )}
    </button>
  );
}

export default ScoreMiniCard;
