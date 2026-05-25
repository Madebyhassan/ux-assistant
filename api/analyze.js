import { generateText, tool, jsonSchema } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { description, focusAreas, context, url, fileBase64, fileMediaType } =
    req.body;

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

  // ── Build image content for the SDK ──
  let imageContent = null;

  if (fileBase64 && fileMediaType && fileMediaType.startsWith("image/")) {
    imageContent = {
      type: "image",
      image: `data:${fileMediaType};base64,${fileBase64}`,
    };
  }

  if (!imageContent && url && url.trim()) {
    try {
      const screenshotUrl = `https://api.screenshotone.com/take?access_key=${process.env.SCREENSHOT_API_KEY}&url=${encodeURIComponent(url)}&format=jpg&viewport_width=1440&viewport_height=900&device_scale_factor=1&full_page=false`;
      const screenshotResponse = await fetch(screenshotUrl);
      if (screenshotResponse.ok) {
        const arrayBuffer = await screenshotResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        imageContent = {
          type: "image",
          image: `data:image/jpeg;base64,${base64}`,
        };
      }
    } catch (e) {
      console.error("Screenshot failed:", e);
    }
  }

  try {
    // ════════════════════════════════════════════════
    // STEP 1 — COMPONENT DETECTION
    // ════════════════════════════════════════════════

    const detectionUserContent = [
      ...(imageContent ? [imageContent] : []),
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
    ];

    const { text: detectionText } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      temperature: 0,
      maxTokens: 200,
      system:
        "You are a UI analyst. Return only valid JSON — no markdown, no code fences.",
      messages: [{ role: "user", content: detectionUserContent }],
    });

    let componentInfo = {
      componentType: "full-page",
      componentDescription: "UI design",
    };
    try {
      const cleaned = detectionText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      componentInfo = JSON.parse(cleaned);
    } catch (e) {
      console.error("Component detection parse error — using defaults:", e);
    }

    // Which dimensions are relevant for this component type
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
    // Only define tools for the selected dimensions —
    // Claude cannot call a tool that doesn't exist.
    // This is architectural filtering.
    // ════════════════════════════════════════════════

    const toolDescriptions = {
      usability:
        "Analyse usability using Nielsen's 10 Heuristics (H1-H10): visibility of system status (H1), match with real world (H2), user control and freedom (H3), consistency and standards (H4), error prevention (H5), recognition over recall (H6), flexibility and efficiency (H7), aesthetic and minimalist design (H8), help users recover from errors (H9), help and documentation (H10).",
      hierarchy:
        "Analyse visual hierarchy using Gestalt Principles (Law of Proximity, Law of Similarity, Law of Common Region, Law of Prägnanz, Law of Uniform Connectedness), Von Restorff Effect (visual differentiation), Serial Position Effect (item position and memory), Aesthetic-Usability Effect, and Fitts's Law (target size and distance).",
      accessibility:
        "Analyse accessibility against WCAG 2.1: contrast ratios SC 1.4.3 (minimum 4.5:1 normal text, 3:1 large text), touch targets SC 2.5.5 (minimum 44x44px), text alternatives SC 1.1.1, keyboard accessibility SC 2.1.1, focus indicators SC 2.4.7, colour not used alone SC 1.4.1, persistent input labels SC 1.3.5 (not just placeholders), reading level SC 3.1.5.",
      userflow:
        "Analyse user flow using: Hick's Law (decision complexity increases with choices), Miller's Law (working memory limit 7±2 items), Goal-Gradient Effect (progress visibility motivates completion), Zeigarnik Effect (incomplete task memory — is progress saved?), Doherty Threshold (interactions should respond within 400ms), Tesler's Law (complexity transferred from user to system), Pareto Principle (top 20% features most prominent), Postel's Law (accept varied input gracefully), Parkinson's Law (time constraints drive action).",
      copy: "Analyse UX content quality: writing directness — one clear message per element (C1), writing distinctiveness — button labels answer user questions (C2), voice and tone consistency — matches context throughout (C3), error message quality — states what happened and what to do next (C4), empty state quality — guides users toward action (C5), onboarding copy — concise and benefit-focused (C6), microcopy — labels, placeholders, tooltips reduce friction (C7), culturally accessible language — globally inclusive (C8).",
    };

    const dimensionTools = {};
    activeDimensions.forEach((dim) => {
      dimensionTools[`report_${dim}`] = tool({
        description: toolDescriptions[dim],
        parameters: jsonSchema({
          type: "object",
          properties: {
            score: {
              type: "number",
              minimum: 0,
              maximum: 10,
              description: "Score out of 10 for this dimension",
            },
            working: {
              type: "array",
              description: "What is working well in this dimension",
              items: {
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
              },
            },
            issues: {
              type: "array",
              description:
                "Issues found, ordered critical then moderate then minor",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", description: "Unique ID e.g. i1" },
                  sev: {
                    type: "string",
                    enum: ["critical", "moderate", "minor"],
                  },
                  title: {
                    type: "string",
                    description: "Short title of the issue",
                  },
                  what: {
                    type: "string",
                    description: "Specific description of this exact issue",
                  },
                  why: {
                    type: "string",
                    description: "Why it matters, citing the specific law",
                  },
                  how: {
                    type: "string",
                    description: "Concrete actionable fix",
                  },
                  source: {
                    type: "string",
                    description:
                      "Exact law, heuristic name and number or WCAG criterion",
                  },
                },
                required: [
                  "id",
                  "sev",
                  "title",
                  "what",
                  "why",
                  "how",
                  "source",
                ],
              },
            },
          },
          required: ["score", "working", "issues"],
        }),
      });
    });

    const analysisSystemPrompt = `You are an expert UX reviewer conducting a focused, rigorous design analysis.

COMPONENT TYPE: ${componentInfo.componentType}
COMPONENT: ${componentInfo.componentDescription}

YOU MUST ONLY EVALUATE THESE DIMENSIONS: ${activeDimensions.join(", ")}

Use the provided reporting tools — call EVERY tool available to you, one per dimension.
Score each dimension strictly from 0 to 10.
Every issue and working observation must cite the specific law, heuristic, or WCAG criterion.
Only report genuine issues you can specifically identify — never manufacture findings.
Order issues within each tool call: critical first, then moderate, then minor.`;

    const analysisUserContent = [
      ...(imageContent ? [imageContent] : []),
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
    ];

    const { toolCalls } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      temperature: 0,
      maxTokens: 4000,
      tools: dimensionTools,
      toolChoice: "required",
      system: analysisSystemPrompt,
      messages: [{ role: "user", content: analysisUserContent }],
    });

    // ── Compile tool call results into final response format ──
    const scores = {
      usability: null,
      hierarchy: null,
      accessibility: null,
      userflow: null,
      copy: null,
    };
    const allWorking = [];
    const allIssues = [];

    if (toolCalls && toolCalls.length > 0) {
      toolCalls.forEach((toolCall) => {
        const dim = toolCall.toolName.replace("report_", "");
        const { score, working, issues } = toolCall.args;

        scores[dim] = parseFloat(score.toFixed(1));
        working.forEach((w) => allWorking.push({ ...w, dims: [dim] }));
        issues.forEach((i) => allIssues.push({ ...i, dims: [dim] }));
      });
    }

    // Calculate overall score from evaluated dimensions only
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

    // Sort all issues by severity across dimensions
    const sevOrder = { critical: 0, moderate: 1, minor: 2 };
    allIssues.sort((a, b) => sevOrder[a.sev] - sevOrder[b.sev]);

    return res.status(200).json({
      overallScore,
      scores,
      working: allWorking,
      issues: allIssues,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
}
