export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { description, focusAreas, context, url, fileBase64, fileMediaType } =
    req.body;

  // ── Determine dimensions ──
  const allDimensions = [
    "usability",
    "hierarchy",
    "accessibility",
    "userflow",
    "copy",
  ];
  const dimensionsToAnalyze = focusAreas.filter((f) =>
    allDimensions.includes(f),
  );
  const finalDimensions =
    dimensionsToAnalyze.length > 0 ? dimensionsToAnalyze : allDimensions;

  // ── Helper: call Anthropic API directly ──
  async function callClaude({
    system,
    messages,
    tools = null,
    toolChoice = null,
    maxTokens = 500,
  }) {
    const body = {
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      temperature: 0,
      system,
      messages,
    };
    if (tools) {
      body.tools = tools;
      body.tool_choice = toolChoice || { type: "any" };
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API error");
    return data;
  }

  // ── Build image block ──
  let imageBlock = null;

  if (fileBase64 && fileMediaType && fileMediaType.startsWith("image/")) {
    imageBlock = {
      type: "image",
      source: { type: "base64", media_type: fileMediaType, data: fileBase64 },
    };
  }

  if (!imageBlock && url && url.trim()) {
    try {
      const screenshotUrl = `https://api.screenshotone.com/take?access_key=${process.env.SCREENSHOT_API_KEY}&url=${encodeURIComponent(url)}&format=jpg&viewport_width=1440&viewport_height=900&device_scale_factor=1&full_page=false`;
      const screenshotResponse = await fetch(screenshotUrl);
      if (screenshotResponse.ok) {
        const arrayBuffer = await screenshotResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        imageBlock = {
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: base64 },
        };
      }
    } catch (e) {
      console.error("Screenshot failed:", e);
    }
  }

  // ── Reusable schema shapes ──
  const workingItemSchema = {
    type: "object",
    properties: {
      id: { type: "string", description: "Unique ID e.g. w1" },
      title: {
        type: "string",
        description: "Short title of what is working well",
      },
      why: {
        type: "string",
        description:
          "Why this is effective, referencing the specific principle",
      },
      source: {
        type: "string",
        description: "Exact law or heuristic name and number",
      },
    },
    required: ["id", "title", "why", "source"],
  };

  const issueItemSchema = {
    type: "object",
    properties: {
      id: { type: "string", description: "Unique ID e.g. i1" },
      sev: { type: "string", enum: ["critical", "moderate", "minor"] },
      title: { type: "string", description: "Short title of the issue" },
      what: {
        type: "string",
        description: "Specific description of this exact issue",
      },
      why: {
        type: "string",
        description: "Why it matters, citing the specific law",
      },
      how: { type: "string", description: "Concrete actionable fix" },
      source: {
        type: "string",
        description: "Exact law, heuristic name and number or WCAG criterion",
      },
    },
    required: ["id", "sev", "title", "what", "why", "how", "source"],
  };

  const dimensionInputSchema = {
    type: "object",
    properties: {
      score: {
        type: "number",
        description: "Score out of 10 for this dimension",
      },
      working: {
        type: "array",
        description: "What is working well, ordered by significance",
        items: workingItemSchema,
      },
      issues: {
        type: "array",
        description: "Issues found ordered critical then moderate then minor",
        items: issueItemSchema,
      },
    },
    required: ["score", "working", "issues"],
  };

  try {
    // ════════════════════════════════════════════════
    // STEP 1 — COMPONENT DETECTION
    // ════════════════════════════════════════════════

    const detectionMessages = [
      {
        role: "user",
        content: [
          ...(imageBlock ? [imageBlock] : []),
          {
            type: "text",
            text: `
Identify what type of UI component or page this is.
${context?.featureBeingDesigned ? `Component hint: ${context.featureBeingDesigned}` : ""}
${context?.industry ? `Industry: ${context.industry}` : ""}
${description ? `Description: ${description}` : "Identify from the image."}
Return ONLY valid JSON: { "componentType": "navbar|hero|form|dashboard|onboarding|card|about|landing-page|full-page|other", "componentDescription": "one sentence describing what it does" }
            `.trim(),
          },
        ],
      },
    ];

    const detectionData = await callClaude({
      system:
        "You are a UI analyst. Return only valid JSON — no markdown, no code fences.",
      messages: detectionMessages,
      maxTokens: 200,
    });

    let componentInfo = {
      componentType: "full-page",
      componentDescription: "UI design",
    };
    try {
      const rawText =
        detectionData.content.find((b) => b.type === "text")?.text || "";
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      componentInfo = JSON.parse(cleaned);
    } catch (e) {
      console.error("Component detection parse error — using defaults:", e);
    }

    // Component applicability
    const componentApplicability = {
      navbar: ["usability", "hierarchy", "accessibility"],
      hero: ["hierarchy", "copy", "usability"],
      form: ["usability", "accessibility", "copy"],
      dashboard: ["usability", "hierarchy", "userflow"],
      onboarding: ["usability", "userflow", "copy"],
      card: ["hierarchy", "accessibility", "copy"],
      about: ["hierarchy", "copy"],
      "landing-page": ["usability", "hierarchy", "accessibility", "copy"],
      "full-page": [
        "usability",
        "hierarchy",
        "accessibility",
        "userflow",
        "copy",
      ],
      other: ["usability", "hierarchy", "accessibility", "userflow", "copy"],
    };

    const applicableForComponent =
      componentApplicability[componentInfo.componentType] || allDimensions;
    const dimensionsForAnalysis = finalDimensions.filter((d) =>
      applicableForComponent.includes(d),
    );
    const activeDimensions =
      dimensionsForAnalysis.length > 0
        ? dimensionsForAnalysis
        : finalDimensions;

    // ════════════════════════════════════════════════
    // STEP 2 — DIMENSION ANALYSIS WITH TOOLS
    // One tool per selected dimension — architectural filtering
    // ════════════════════════════════════════════════

    const toolDescriptions = {
      usability:
        "Analyse usability using Nielsen's 10 Heuristics (H1-H10): visibility of system status (H1), match with real world (H2), user control and freedom (H3), consistency and standards (H4), error prevention (H5), recognition over recall (H6), flexibility and efficiency (H7), aesthetic and minimalist design (H8), help users recover from errors (H9), help and documentation (H10).",
      hierarchy:
        "Analyse visual hierarchy using Gestalt Principles (Law of Proximity, Law of Similarity, Law of Common Region, Law of Prägnanz, Law of Uniform Connectedness), Von Restorff Effect, Serial Position Effect, Aesthetic-Usability Effect, and Fitts's Law.",
      accessibility:
        "Analyse accessibility against WCAG 2.1: contrast ratios SC 1.4.3 (minimum 4.5:1 normal text, 3:1 large text), touch targets SC 2.5.5 (minimum 44x44px), text alternatives SC 1.1.1, keyboard accessibility SC 2.1.1, focus indicators SC 2.4.7, colour not used alone SC 1.4.1, persistent input labels SC 1.3.5, reading level SC 3.1.5.",
      userflow:
        "Analyse user flow using Hick's Law, Miller's Law (7±2 items), Goal-Gradient Effect, Zeigarnik Effect, Doherty Threshold (under 400ms), Tesler's Law, Pareto Principle, Postel's Law, Parkinson's Law.",
      copy: "Analyse UX content: writing directness (C1), writing distinctiveness (C2), voice and tone consistency (C3), error message quality (C4), empty state quality (C5), onboarding copy (C6), microcopy (C7), culturally accessible language (C8).",
    };

    // Build tools array — only for active dimensions
    const tools = activeDimensions.map((dim) => ({
      name: `report_${dim}`,
      description: toolDescriptions[dim],
      input_schema: dimensionInputSchema,
    }));

    const analysisSystemPrompt = `You are an expert UX reviewer with 15+ years of professional design critique experience. You think and evaluate like a senior product designer or UX director — not like an automated checklist tool.

COMPONENT TYPE: ${componentInfo.componentType}
COMPONENT: ${componentInfo.componentDescription}
${context?.industry ? `INDUSTRY CONTEXT: ${context.industry}` : ""}
${context?.targetAudience ? `TARGET AUDIENCE: ${context.targetAudience}` : ""}
${context?.featureBeingDesigned ? `FEATURE: ${context.featureBeingDesigned}` : ""}

YOU MUST ONLY EVALUATE THESE DIMENSIONS: ${activeDimensions.join(", ")}

═══════════════════════════════════════════════
EXPERT REVIEWER MINDSET — THIS IS CRITICAL
═══════════════════════════════════════════════

You are NOT applying UX principles as a mechanical checklist.
You are evaluating whether this specific design, built for this specific audience and industry, genuinely serves its users well.

GENUINE IMPACT TEST:
Before reporting ANY issue, ask yourself this question:
"Would this specific problem genuinely confuse, frustrate, or block the ACTUAL users of this product — given their expertise level, their industry, and the purpose of this design?"

If the answer is NO — do not report it, regardless of what any principle technically states.

VISUAL SCOPE — CRITICAL:
Analyse only the actual page interface — the navigation, layout, content sections, CTAs, and interactive elements of the page itself.
If the page contains screenshots, mockups, or images of other products or apps embedded as content, do NOT analyse those inner UI elements as if they are interactive parts of the current page. They are marketing assets, not functional UI.
Only report issues for things that are verifiably present on the actual page being reviewed.

VERIFIABILITY RULE:
Only report issues you can directly observe in the screenshot.
Do not report contrast ratio failures unless the issue is visually obvious — do not guess at exact pixel values.
Do not report keyboard navigation issues unless you can visually confirm focus indicators are absent — if focus styles are not visible in the static screenshot, note this as a recommendation rather than a confirmed issue.

INDUSTRY AND AUDIENCE AWARENESS:
→ If the audience has domain expertise (medical professionals, financial analysts, developers, engineers, legal professionals), technical terminology in their own domain does NOT need tooltips or simplification. This is appropriate and expected for their expertise level. Do not flag domain-specific language as an issue for expert audiences.
→ If the industry has established conventions that differ from general UX norms (trading platforms, clinical dashboards, enterprise B2B tools, developer tools), those conventions are usually intentional. Only flag them if they create genuine usability failures.
→ A high information density layout for a professional B2B tool is fundamentally different from a cluttered consumer app. Evaluate the design for what it IS, not what you would expect a consumer product to be.
→ Design decisions that are deliberate and correct for the specific context should never be flagged as issues.

WHAT COUNTS AS A GENUINE ISSUE:
✓ Problems that cause real confusion, errors, or friction for the actual users of this product
✓ Accessibility barriers that affect users regardless of expertise level — contrast ratios, keyboard access, touch targets, missing labels
✓ Navigation or flow problems that create genuine obstacles to completing tasks
✓ Missing feedback that leaves users uncertain whether their action succeeded or failed
✓ Inconsistencies that would confuse even an expert user of this system

WHAT IS NOT AN ISSUE:
✗ Technical or domain terminology used with an expert audience
✗ Information density that is appropriate for a professional tool
✗ Conventional patterns specific to an industry that differ from general consumer UX
✗ Design choices that are intentionally correct for the context even if they look unusual
✗ Principles applied mechanically without considering whether they matter for this specific product and audience

═══════════════════════════════════════════════
SCORING AND QUANTITY RULES
═══════════════════════════════════════════════

SCORING:
- Score based on real usability impact for the specified audience and industry context
- A score below 7.0 MUST be accompanied by at least one genuine issue — a low score with zero issues is a contradiction and is not permitted
- A score of 8.0 or above means this dimension is genuinely strong for this product in this context
- Never penalise a design for intentional choices that are correct for its context

ISSUES — quality over quantity:
- Report a maximum of 3 to 5 issues per dimension
- Only report issues that pass the Genuine Impact Test
- Order issues: critical first, then moderate, then minor
- Every issue must cite the exact principle — only use citations that are genuinely relevant, not forced to justify a finding

WORKING OBSERVATIONS — be selective:
- Report a maximum of 1 to 2 working observations per dimension
- Only include observations that are genuinely noteworthy and specific to this design
- Do not pad with generic or obvious observations

Use the provided reporting tools — call EVERY tool available to you, one per dimension.`;

    const analysisMessages = [
      {
        role: "user",
        content: [
          ...(imageBlock ? [imageBlock] : []),
          {
            type: "text",
            text: `
Analyse this ${componentInfo.componentType} and report your findings using the available tools.

${context?.featureTitle ? `Project: ${context.featureTitle}` : ""}
${context?.industry ? `Industry: ${context.industry}` : ""}
${context?.targetAudience ? `Target audience: ${context.targetAudience}` : ""}
${url ? `URL being analysed: ${url}` : ""}
${description ? `\nDESIGN DESCRIPTION:\n${description}` : "\nNo text description — analyse what you can visually observe in the image."}

Call the report tool for each of these dimensions: ${activeDimensions.join(", ")}
            `.trim(),
          },
        ],
      },
    ];

    const analysisData = await callClaude({
      system: analysisSystemPrompt,
      messages: analysisMessages,
      tools,
      toolChoice: { type: "any" },
      maxTokens: 4000,
    });

    // ── Extract tool use blocks from response ──
    const toolUseBlocks = analysisData.content.filter(
      (b) => b.type === "tool_use",
    );

    const scores = {
      usability: null,
      hierarchy: null,
      accessibility: null,
      userflow: null,
      copy: null,
    };
    const allWorking = [];

    const issueMap = new Map();

    toolUseBlocks.forEach((block) => {
      const dim = block.name.replace("report_", "");
      const { score, working = [], issues = [] } = block.input;

      scores[dim] = parseFloat(Number(score).toFixed(1));
      working.forEach((w) => allWorking.push({ ...w, dims: [dim] }));

      issues.forEach((i) => {
        const key = i.title.toLowerCase().trim();
        if (issueMap.has(key)) {
          // Merge dims — add this dimension to existing issue
          const existing = issueMap.get(key);
          if (!existing.dims.includes(dim)) {
            existing.dims.push(dim);
          }
        } else {
          issueMap.set(key, { ...i, dims: [dim] });
        }
      });
    });

    const allIssues = Array.from(issueMap.values());

    // Overall score
    const evaluatedScores = Object.values(scores).filter((s) => s !== null);
    const overallScore =
      evaluatedScores.length > 0
        ? parseFloat(
            (
              evaluatedScores.reduce((a, b) => a + b, 0) /
              evaluatedScores.length
            ).toFixed(1),
          )
        : 0;

    // Sort by severity
    const sevOrder = { critical: 0, moderate: 1, minor: 2 };
    allIssues.sort((a, b) => sevOrder[a.sev] - sevOrder[b.sev]);

    return res
      .status(200)
      .json({ overallScore, scores, working: allWorking, issues: allIssues });
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
}
