const toggleOptions = [
  {
    id: "usability",
    title: "Usability",
    desc: "Evaluates how easy and intuitive your design is to use — interaction clarity, affordances and learnability.",
  },
  {
    id: "hierarchy",
    title: "Visual Hierarchy",
    desc: "Assesses how well your layout guides the user's eye — typography, sizing, spacing and visual weight.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    desc: "Checks against WCAG standards — contrast ratios, touch targets, screen reader support and inclusive design.",
  },
  {
    id: "userflow",
    title: "User Flow",
    desc: "Reviews logical progression between steps — identifies friction points, dead ends and unnecessary complexity.",
  },
  {
    id: "copy",
    title: "Copy & Messaging",
    desc: "Evaluates labels, button text, error messages and microcopy — checks clarity, tone and user confidence.",
  },
  {
    id: "all",
    title: "All of the above",
    desc: "Comprehensive review across all five dimensions with a full UX Score Card for each area.",
    dashed: true,
  },
];

function FocusToggles({ checkedToggles, setCheckedToggles }) {
  const allIds = toggleOptions
    .filter((opt) => opt.id !== "all")
    .map((opt) => opt.id);

  const toggle = (id) => {
    if (id === "all") {
      // If everything is already selected, deselect all — otherwise select all
      const allSelected = allIds.every((i) => checkedToggles.includes(i));
      setCheckedToggles(allSelected ? [] : allIds);
    } else {
      setCheckedToggles((prev) =>
        prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
      );
    }
  };

  const allChecked = allIds.every((id) => checkedToggles.includes(id));

  return (
    <div>
      <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2.5">
        Focus Feedback On
      </p>
      <div className="flex flex-col gap-1.5">
        {toggleOptions.map((opt) => {
          const isChecked =
            opt.id === "all" ? allChecked : checkedToggles.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`flex items-start gap-2.5 px-3.5 py-2.5 border-[1.5px] rounded-xl text-left transition-all w-full
                ${opt.dashed ? "border-dashed" : ""}
                ${
                  isChecked
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-indigo-500 hover:bg-indigo-50"
                }`}
            >
              <div
                className={`w-4 h-4 rounded border-[1.5px] shrink-0 mt-0.5 flex items-center justify-center text-[10px] transition-all
                ${
                  isChecked
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {isChecked && "✓"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-0.5">
                  {opt.title}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {opt.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FocusToggles;
