function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 flex-1 px-10 py-20 text-center">
      <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-2xl mb-1">
        📋
      </div>
      <p className="text-base font-bold text-gray-900">
        Your feedback will appear here
      </p>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
        Describe your design on the left and hit Analyse to get structured,
        expert UX feedback.
      </p>
      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 text-xs font-medium text-indigo-500 mt-1">
        ⚡ Usually takes 5–10 seconds
      </div>
    </div>
  );
}

export default EmptyState;
