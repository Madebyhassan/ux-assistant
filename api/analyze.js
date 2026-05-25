export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { description, focusAreas, context, url, fileBase64, fileMediaType } =
    req.body;

  // ── Helper: call Claude with temperature 0 for consistency ──
  async function callClaude(systemPrompt, userMessage, imageBlock = null) {
    const messageContent = imageBlock
      ? [imageBlock, { type: "text", text: userMessage }]
      : userMessage;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: "user", content: messageContent }],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API error");
    return data.content[0].text;
  }

  // ── Clean markdown fences from response ──
  function cleanJSON(raw) {
    return raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
  }

  // ── Determine which dimensions to analyse ──
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
    } catch (screenshotError) {
      console.error("Screenshot failed:", screenshotError);
    }
  }

  try {
    // ════════════════════════════════════════════════
    // STEP 1 — COMPONENT DETECTION
    // Identify what type of UI this is before analysing
    // ════════════════════════════════════════════════

    const detectionSystem = `You are a UX analyst. Your only job is to identify what type of UI component or page is being described or shown. Be precise and specific.

Return ONLY a valid JSON object — no markdown, no code fences, no explanation:
{
  "componentType": "<one of: navbar|hero|form|dashboard|onboarding|card|about|landing-page|full-page|other>",
  "componentDescription": "<one sentence describing what this specific UI does>",
  "primaryPurpose": "<the main user goal this UI serves>"
}`;

    const detectionMessage = `
${context?.featureBeingDesigned ? `Component hint from user: ${context.featureBeingDesigned}` : ""}
${context?.industry ? `Industry: ${context.industry}` : ""}
${context?.targetAudience ? `Target audience: ${context.targetAudience}` : ""}
${description ? `User description: ${description}` : "No text description — identify from the image."}
${url ? `URL being analysed: ${url}` : ""}
    `.trim();

    let componentInfo = {
      componentType: "full-page",
      componentDescription: "UI design",
      primaryPurpose: "user interaction",
    };

    try {
      const detectionRaw = await callClaude(
        detectionSystem,
        detectionMessage,
        imageBlock,
      );
      componentInfo = JSON.parse(cleanJSON(detectionRaw));
    } catch (e) {
      console.error("Component detection failed, using defaults:", e);
    }

    // ════════════════════════════════════════════════
    // STEP 2 — FOCUSED ANALYSIS
    // Only evaluate the dimensions the user selected
    // ════════════════════════════════════════════════

    const dimensionGuide = {
      usability: `Nielsen's 10 Usability Heuristics:
        H1. Visibility of system status — does the design tell users what's happening?
        H2. Match between system and real world — is language natural and familiar?
        H3. User control and freedom — can users undo, cancel, or go back?
        H4. Consistency and standards — are patterns consistent throughout?
        H5. Error prevention — does the design prevent mistakes before they happen?
        H6. Recognition over recall — are options visible rather than memorised?
        H7. Flexibility and efficiency — can expert users work faster?
        H8. Aesthetic and minimalist design — is every element earning its place?
        H9. Help users recover from errors — are error messages clear and actionable?
        H10. Help and documentation — is contextual help available where needed?`,

      hierarchy: `Visual Hierarchy Principles:
        - Gestalt Law of Proximity — related elements grouped together?
        - Gestalt Law of Similarity — similar elements look the same?
        - Gestalt Law of Common Region — grouped elements enclosed by boundaries?
        - Gestalt Law of Prägnanz — is the design as simple as possible?
        - Gestalt Law of Uniform Connectedness — visual connectors show relationships?
        - Von Restorff Effect — is the most important element visually distinct?
        - Serial Position Effect — most important items first or last?
        - Aesthetic-Usability Effect — does visual quality affect perceived usability?
        - Fitts's Law — are primary actions large enough and close enough?`,

      accessibility: `WCAG 2.1 Accessibility Standards:
        SC 1.4.3 — Text contrast ratio minimum 4.5:1 (normal text), 3:1 (large text)
        SC 2.5.5 — Touch targets minimum 44x44 CSS pixels
        SC 1.1.1 — Non-text content has text alternatives
        SC 2.1.1 — All functionality accessible via keyboard
        SC 2.4.7 — Keyboard focus indicators always visible
        SC 1.4.1 — Colour not used as the only visual means of conveying information
        SC 3.1.5 — Reading level appropriate for target audience
        SC 1.3.5 — Form inputs have persistent visible labels (not just placeholders)`,

      userflow: `User Flow Principles:
        - Hick's Law — too many choices slow decision making
        - Miller's Law — working memory handles 7 (±2) items maximum
        - Goal-Gradient Effect — progress visibility increases motivation
        - Zeigarnik Effect — incomplete tasks are remembered — is progress saved?
        - Doherty Threshold — interactions should respond within 400ms
        - Tesler's Law — complexity transferred from user to system appropriately?
        - Pareto Principle — are the top 20% most-used features most prominent?
        - Postel's Law — does the design accept varied input gracefully?
        - Parkinson's Law — are time constraints used to drive action?`,

      copy: `UX Content Standards:
        C1. Writing directness — each element communicates a single clear message
        C2. Writing distinctiveness — buttons and labels answer the user's question
        C3. Voice and tone — language matches the context and stays consistent
        C4. Error message quality — errors state what happened and what to do next
        C5. Empty state quality — empty states guide users toward action
        C6. Onboarding copy — first-run experiences orient users efficiently
        C7. Microcopy — labels, placeholders, tooltips reduce friction
        C8. Cultural accessibility — language is globally inclusive`,
    };

    // Component applicability map — which dimensions matter for each component type
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

    // Intersection: what user selected AND what applies to this component type
    const dimensionsForAnalysis = finalDimensions.filter((d) =>
      applicableForComponent.includes(d),
    );

    // Safety net: if intersection is empty, fall back to user's selection
    const activeDimensions =
      dimensionsForAnalysis.length > 0
        ? dimensionsForAnalysis
        : finalDimensions;

    const analysisSystem = `You are an expert UX reviewer conducting a precise, focused design analysis.

COMPONENT IDENTIFIED: ${componentInfo.componentType}
COMPONENT PURPOSE: ${componentInfo.componentDescription}

CRITICAL INSTRUCTION — YOU MUST ONLY EVALUATE THESE DIMENSIONS:
${activeDimensions.map((d) => `\n${d.toUpperCase()}:\n${dimensionGuide[d]}`).join("\n\n")}

DO NOT evaluate any other dimensions. Do not include issues or observations from dimensions not listed above.
Every issue and working observation MUST cite the specific law, heuristic, or WCAG criterion it applies to.
Only report genuine, specific issues you can identify — never manufacture issues.
For dimensions NOT being evaluated, set their score to null in the scores object.
Issues must be ordered: critical first, then moderate, then minor.

Return ONLY a valid raw JSON object — no markdown, no code fences, no explanation:

{
  "overallScore": <weighted average of non-null scores, one decimal place>,
  "scores": {
    "usability": <number 0-10 or null>,
    "hierarchy": <number 0-10 or null>,
    "accessibility": <number 0-10 or null>,
    "userflow": <number 0-10 or null>,
    "copy": <number 0-10 or null>
  },
  "working": [
    {
      "id": "<unique string e.g. w1>",
      "dims": ["<only dimensions from the evaluated list>"],
      "title": "<short specific title>",
      "why": "<specific explanation referencing the exact principle>",
      "source": "<exact law, heuristic name and number or WCAG success criterion>"
    }
  ],
  "issues": [
    {
      "id": "<unique string e.g. i1>",
      "dims": ["<only dimensions from the evaluated list>"],
      "sev": "<critical|moderate|minor>",
      "title": "<short specific title>",
      "what": "<specific description of this exact issue in this design>",
      "why": "<why it matters, citing the specific law or heuristic>",
      "how": "<concrete actionable fix — not vague advice>",
      "source": "<exact law, heuristic name and number or WCAG success criterion>"
    }
  ]
}`;

    const analysisMessage = `
Analyse this ${componentInfo.componentType} and provide structured UX feedback.

EVALUATE ONLY THESE DIMENSIONS: ${activeDimensions.join(", ")}

${context?.featureTitle ? `Project title: ${context.featureTitle}` : ""}
${context?.industry ? `Industry: ${context.industry}` : ""}
${context?.targetAudience ? `Target audience: ${context.targetAudience}` : ""}
${url ? `URL being analysed: ${url}` : ""}

${description ? `DESIGN DESCRIPTION:\n${description}` : "No text description provided — analyse what you can visually observe in the image."}

REMINDER: Only evaluate ${activeDimensions.join(", ")}. Set all other dimension scores to null. Return raw JSON only.
    `.trim();

    const analysisRaw = await callClaude(
      analysisSystem,
      analysisMessage,
      imageBlock,
    );

    try {
      const parsed = JSON.parse(cleanJSON(analysisRaw));
      return res.status(200).json(parsed);
    } catch (parseError) {
      console.error("Analysis JSON parse error. Raw response:", analysisRaw);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
}
