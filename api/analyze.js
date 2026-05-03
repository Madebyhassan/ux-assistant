import systemPrompt from "../src/data/systemPrompt.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { description, focusAreas, context } = req.body;

  const userMessage = `
Please analyse the following UI/UX design and provide structured feedback.

${context.featureTitle ? `FEATURE / COMPONENT: ${context.featureTitle}` : ""}
${context.industry ? `INDUSTRY: ${context.industry}` : ""}
${context.featureBeingDesigned ? `FEATURE BEING DESIGNED: ${context.featureBeingDesigned}` : ""}
${context.targetAudience ? `TARGET AUDIENCE: ${context.targetAudience}` : ""}

FOCUS AREAS SELECTED BY USER: ${focusAreas.join(", ")}

DESIGN DESCRIPTION:
${description}

Remember: only apply the laws and principles that are genuinely relevant to this component type. Return valid JSON only.
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
      return res
        .status(response.status)
        .json({ error: data.error?.message || "API error" });
    }

    const rawText = data.content[0].text;
    const parsed = JSON.parse(rawText);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("API error:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again." });
  }
}
