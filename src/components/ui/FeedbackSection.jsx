import FeedbackItem from "./FeedbackItem";

const feedbackData = {
  working: [
    {
      id: "w1",
      dims: ["usability", "userflow"],
      title: "Clear primary action",
      why: "The CTA button is visually dominant and positioned at the end of the natural scan path — strong affordance design.",
      source: "Nielsen #1 — Visibility of system status",
    },
    {
      id: "w2",
      dims: ["userflow", "hierarchy"],
      title: "Logical step progression",
      why: "The flow moves from simple to complex naturally, reducing cognitive load at each stage.",
      source: "Progressive Disclosure · Miller's Law",
    },
    {
      id: "w3",
      dims: ["hierarchy"],
      title: "Strong typographic contrast between heading levels",
      why: "H1 and body text are differentiated by size and weight, creating a readable visual hierarchy.",
      source: "Gestalt — Figure/Ground · WCAG 1.4.6",
    },
    {
      id: "w4",
      dims: ["copy"],
      title: "Action-oriented button labels",
      why: "Buttons use verb-first language which reduces cognitive load and clearly communicates what happens next.",
      source: "UX Writing best practices · Nielsen #6",
    },
  ],
  issues: [
    {
      id: "i1",
      dims: ["accessibility"],
      sev: "critical",
      title: "Low colour contrast on CTA button",
      what: "The button text and background fail WCAG AA contrast ratio of 4.5:1.",
      why: "Low contrast prevents <strong>1 in 12 users</strong> from accessing your primary action. Violates WCAG 2.1 SC 1.4.3.",
      how: "Darken the button to at least <strong>#4338CA</strong> or lighten the label to white. Verify with WebAIM Contrast Checker.",
      source: "WCAG 2.1 SC 1.4.3 — Contrast (Minimum)",
    },
    {
      id: "i2",
      dims: ["accessibility"],
      sev: "moderate",
      title: "Touch targets below minimum size",
      what: "Several interactive elements are smaller than the recommended 44×44px minimum.",
      why: "Affects <strong>26% of adults</strong> with some form of disability.",
      how: "Ensure all interactive elements are at least 44×44px using padding.",
      source: "WCAG 2.1 SC 2.5.5 — Target Size",
    },
    {
      id: "i3",
      dims: ["usability", "copy"],
      sev: "moderate",
      title: "No error state on form inputs",
      what: "Form fields show no feedback when inputs are invalid.",
      why: "Violates Nielsen's <strong>Help users recognise, diagnose and recover from errors</strong>.",
      how: 'Add a red border + inline message. Use plain language: "Please enter a valid email"',
      source: "Nielsen #9 — Help users recognise errors",
    },
    {
      id: "i4",
      dims: ["hierarchy"],
      sev: "moderate",
      title: "Competing visual weights across sections",
      what: "Multiple elements share the same font size and weight.",
      why: "When everything has equal weight, <strong>nothing stands out</strong>. Violates Gestalt Figure/Ground.",
      how: "Establish a clear type scale: 1 H1 per screen, 2–3 supporting levels.",
      source: "Gestalt — Figure/Ground · Fitts's Law",
    },
    {
      id: "i5",
      dims: ["userflow"],
      sev: "moderate",
      title: "No progress indicator in multi-step flow",
      what: "Users have no way to know how many steps remain.",
      why: "Violates Nielsen's <strong>Visibility of System Status</strong>.",
      how: 'Add a step indicator (e.g. "Step 2 of 4") at the top of each screen.',
      source: "Nielsen #1 — Visibility of system status",
    },
    {
      id: "i6",
      dims: ["hierarchy", "usability"],
      sev: "minor",
      title: "Inconsistent spacing between sections",
      what: "Section gaps vary between 16px, 20px and 28px without a clear pattern.",
      why: "Disrupts visual rhythm and signals the design lacks a systematic foundation.",
      how: "Define a spacing scale (4, 8, 12, 16, 24, 32px) and apply it consistently.",
      source: "Gestalt — Proximity · Design systems best practice",
    },
    {
      id: "i7",
      dims: ["copy"],
      sev: "minor",
      title: "Placeholder text used as field labels",
      what: "Input fields rely solely on placeholder text which disappears when typing.",
      why: "Users lose context of what a field requires mid-input.",
      how: "Always use a persistent label above the input field.",
      source: "Nielsen #6 — Recognition over recall · WCAG 1.3.5",
    },
  ],
};

const sevOrder = { critical: 0, moderate: 1, minor: 2 };

function FeedbackSection({ activeFilter }) {
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
