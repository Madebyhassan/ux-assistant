const fields = [
  {
    label: "Project / Feature Title",
    placeholder: "e.g. Onboarding flow redesign",
  },
  { label: "Industry", placeholder: "e.g. HealthTech, FinTech, E-commerce" },
  {
    label: "Feature Being Designed",
    placeholder: "e.g. Checkout page, Sign-up form",
  },
  {
    label: "Target Audience",
    placeholder: "e.g. First-time users, Enterprise teams",
  },
];

function ContextAccordion({ contextOpen, setContextOpen }) {
  return (
    <div>
      <button
        onClick={() => setContextOpen(!contextOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
      >
        <div className="flex items-center gap-2">
          <span>{contextOpen ? "−" : "＋"}</span>
          <span>Add context (optional)</span>
        </div>
        <span
          className={`text-xs text-gray-300 transition-transform duration-200 ${contextOpen ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {contextOpen && (
        <div className="border border-gray-200 rounded-xl overflow-hidden mt-1">
          {fields.map((field, i) => (
            <div
              key={i}
              className={`px-3.5 py-2.5 ${i < fields.length - 1 ? "border-b border-gray-200" : ""}`}
            >
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">
                {field.label}
              </p>
              <input
                type="text"
                placeholder={field.placeholder}
                className="w-full text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContextAccordion;
