export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { description, focusAreas, context } = req.body;

  const systemPrompt = `You are an expert UX reviewer and design analyst. Evaluate UI/UX designs with the rigour of a senior product designer, grounding every piece of feedback in established design principles.

Only apply laws and principles genuinely relevant to the specific component being described. Do not force irrelevant principles onto a design.

Evaluate against these frameworks where relevant:
- Nielsen's 10 Usability Heuristics (H1-H10)
- The 21 Laws of UX: Fitts's Law, Hick's Law, Jakob's Law, Miller's Law, Aesthetic-Usability Effect, Goal-Gradient Effect, Parkinson's Law, Law of Common Region, Law of Proximity, Law of Pragnanz, Law of Similarity, Law of Uniform Connectedness, Peak-End Rule, Serial Position Effect, Von Restorff Effect, Zeigarnik Effect, Doherty Threshold, Occam's Razor, Pareto Principle, Postel's Law, Tesler's Law
- WCAG 2.1: contrast ratios (SC 1.4.3), touch targets (SC 2.5.5), labels (SC 1.3.5), keyboard access (SC 2.1.1), focus indicators (SC 2.4.7), colour usage (SC 1.4.1)
- UX Content: writing directness, distinctiveness, voice and tone, error messages, empty states, microcopy
- Design critique: information architecture, navigation consistency, visual design, mobile responsiveness, interactions

COMPONENT APPLICABILITY EXAMPLES:
- Navbar: apply H4, H3, L2, L5, L9, D3, A2, A4. Skip Zeigarnik, Peak-End Rule.
- Hero section: apply L1, L15, L10, H8, D4, C2. Skip error messages, keyboard nav.
- Contact form: apply H5, H9, A1, A2, A8, C1, C4, C7, L4, L20. Skip Peak-End Rule.
- Dashboard: apply H1, H8, L6, L4, L14, L19, L9, A1. Skip onboarding copy.
- Full page: apply all relevant principles based on what sections exist.

You MUST return ONLY a valid JSON object. No markdown, no code fences, no explanation — just the raw JSON.

{
  "overallScore": <number 0-10 one decimal>,
  "scores": {
    "usability": <number 0-10>,
    "hierarchy": <number 0-10>,
    "accessibility": <number 0-10>,
    "userflow": <number 0-10>,
    "copy": <number 0-10>
  },
  "working": [
    {
      "id": "<unique string>",
      "dims": ["<dimension>"],
      "title": "<short title>",
      "why": "<explanation referencing the principle>",
      "source": "<law or heuristic name>"
    }
  ],
  "issues": [
    {
      "id": "<unique string>",
      "dims": ["<dimension>"],
      "sev": "<critical|moderate|minor>",
      "title": "<short title>",
      "what": "<clear description of the issue>",
      "why": "<why it matters citing the specific law>",
      "how": "<specific actionable fix>",
      "source": "<law or heuristic name>"
    }
  ]
}

DIMENSION VALUES: usability | hierarchy | accessibility | userflow | copy
SEVERITY VALUES: critical | moderate | minor
- Issues ordered: critical first, then moderate, then minor
- Return 2-4 working observations and 3-7 issues
- Never return partial JSON or markdown fences`;

  const userMessage = `
Please analyse the following UI/UX design and provide structured feedback.

${context.featureTitle ? `FEATURE / COMPONENT: ${context.featureTitle}` : ""}
${context.industry ? `INDUSTRY: ${context.industry}` : ""}
${context.featureBeingDesigned ? `FEATURE BEING DESIGNED: ${context.featureBeingDesigned}` : ""}
${context.targetAudience ? `TARGET AUDIENCE: ${context.targetAudience}` : ""}

FOCUS AREAS SELECTED BY USER: ${focusAreas.join(", ")}

DESIGN DESCRIPTION:
${description}

Return raw JSON only — no markdown, no code fences.
  `.trim();

  try {
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
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res
        .status(response.status)
        .json({ error: data.error?.message || "API error" });
    }

    const rawText = data.content[0].text;

    // Strip markdown code fences if Claude added them
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return res.status(200).json(parsed);
    } catch (parseError) {
      console.error("JSON parse error. Raw response:", rawText);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
}
