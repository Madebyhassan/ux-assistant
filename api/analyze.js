export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { description, focusAreas, context, url, fileBase64, fileMediaType } =
    req.body;

  const targetAudienceText = Array.isArray(context?.targetAudience)
    ? context.targetAudience.join(", ")
    : context?.targetAudience || "";

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
      model: "claude-sonnet-4-6",
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

  // ── DOM extraction using headless Chromium ──
  async function extractDOMData(targetUrl) {
    let browser = null;
    try {
      const chromium = (await import("@sparticuz/chromium")).default;
      const { chromium: playwright } = await import("playwright-core");

      browser = await playwright.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);

      const domData = await page.evaluate(() => {
        const data = {
          title: document.title,
          headings: [],
          buttons: [],
          navItems: [],
          images: [],
          inputs: [],
          links: [],
        };

        // Headings
        document.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((el) => {
          const text = el.innerText?.trim();
          if (text) data.headings.push({ level: el.tagName, text });
        });

        // Navigation
        document.querySelectorAll("nav a, header a").forEach((el) => {
          const text = el.innerText?.trim();
          if (text) data.navItems.push(text);
        });

        // Buttons and CTAs
        document
          .querySelectorAll('button, [role="button"], a')
          .forEach((el) => {
            const text = el.innerText?.trim();
            if (text && text.length < 60) data.buttons.push(text);
          });

        // Images
        document.querySelectorAll("img").forEach((el) => {
          data.images.push({
            alt: el.alt || null,
            hasAlt: el.alt && el.alt.trim() !== "",
          });
        });

        // Form inputs
        document.querySelectorAll("input, textarea, select").forEach((el) => {
          const label =
            document.querySelector(`label[for="${el.id}"]`) ||
            el.closest("label");
          data.inputs.push({
            type: el.type || el.tagName,
            placeholder: el.placeholder || null,
            label: label?.innerText?.trim() || null,
            hasLabel: !!label,
          });
        });

        return data;
      });

      return domData;
    } catch (error) {
      console.error("DOM extraction failed:", error.message);
      return null;
    } finally {
      if (browser) await browser.close();
    }
  }

  // ── Format DOM data as context text for Claude ──
  function formatDOMContext(domData) {
    if (!domData) return "";

    let ctx =
      "\n\nACTUAL PAGE DATA — extracted from live DOM. Use this for accurate text references. Do not invent or guess text not listed here:\n";

    if (domData.title) ctx += `\nPage title: "${domData.title}"`;

    if (domData.headings.length > 0) {
      ctx += `\n\nHeadings on page:\n${domData.headings.map((h) => `  ${h.level}: "${h.text}"`).join("\n")}`;
    }

    if (domData.navItems.length > 0) {
      ctx += `\n\nNavigation items: ${[...new Set(domData.navItems)].map((n) => `"${n}"`).join(", ")}`;
    }

    const uniqueButtons = [...new Set(domData.buttons)].filter(Boolean);
    if (uniqueButtons.length > 0) {
      ctx += `\n\nButtons and CTAs: ${uniqueButtons.map((b) => `"${b}"`).join(", ")}`;
    }

    if (domData.inputs.length > 0) {
      ctx += `\n\nForm inputs:\n${domData.inputs
        .map(
          (i) =>
            `  - ${i.type}${i.label ? ` | label: "${i.label}"` : " | NO VISIBLE LABEL"}${i.placeholder ? ` | placeholder: "${i.placeholder}"` : ""}`,
        )
        .join("\n")}`;
    }

    const missingAlt = domData.images.filter((i) => !i.hasAlt).length;
    const totalImages = domData.images.length;
    if (totalImages > 0) {
      ctx += `\n\nImages: ${totalImages} total, ${missingAlt} missing alt text`;
    }

    ctx +=
      "\n\nIMPORTANT: The text above is accurate and extracted from the live page. Always use these exact labels when referencing elements. Never invent button text, heading text, or labels not listed here.";

    return ctx;
  }

  // ── Helper: build image content for messages ──
  function buildImageContent(imgBlock) {
    if (!imgBlock) return [];
    if (imgBlock.type === "multi-section") {
      return imgBlock.sections.map((base64) => ({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: base64 },
      }));
    }
    return [imgBlock];
  }

  // ── Build image block ──
  let imageBlock = null;
  let domContext = null;

  if (fileBase64 && fileMediaType && fileMediaType.startsWith("image/")) {
    imageBlock = {
      type: "image",
      source: { type: "base64", media_type: fileMediaType, data: fileBase64 },
    };
  }

  if (!imageBlock && url && url.trim()) {
    try {
      const sharp = (await import("sharp")).default;

      // ── Capture full page screenshot ──
      const screenshotUrl = `https://api.screenshotone.com/take?access_key=${process.env.SCREENSHOT_API_KEY}&url=${encodeURIComponent(url)}&format=jpg&viewport_width=1440&full_page=true&device_scale_factor=1&image_quality=70&delay=3&timeout=60&wait_until=load&block_ads=true&block_cookie_banners=true`;
      const screenshotResponse = await fetch(screenshotUrl);

      if (screenshotResponse.ok) {
        const arrayBuffer = await screenshotResponse.arrayBuffer();
        const fullBuffer = Buffer.from(arrayBuffer);

        // ── Get page dimensions ──
        const metadata = await sharp(fullBuffer).metadata();
        const totalHeight = metadata.height;
        const width = metadata.width;

        // ── Split into sections ──
        const NUM_SECTIONS = 4;
        const sectionHeight = Math.ceil(totalHeight / NUM_SECTIONS);

        const sectionBuffers = await Promise.all(
          Array.from({ length: NUM_SECTIONS }, async (_, i) => {
            const top = i * sectionHeight;
            const height = Math.min(sectionHeight, totalHeight - top);
            if (height <= 0) return null;

            const buffer = await sharp(fullBuffer)
              .extract({ left: 0, top, width, height })
              .jpeg({ quality: 75 })
              .toBuffer();

            return buffer.toString("base64");
          }),
        );

        // Store sections for multi-image analysis
        imageBlock = {
          type: "multi-section",
          sections: sectionBuffers.filter(Boolean),
        };
        // ── Extract DOM data alongside screenshot ──
        domContext = await extractDOMData(url);
        console.log(
          "DOM extraction result:",
          domContext
            ? "SUCCESS — data extracted"
            : "FAILED — proceeding without DOM data",
        );
        if (domContext) {
          console.log("Extracted:", {
            headings: domContext.headings?.length,
            buttons: domContext.buttons?.length,
            inputs: domContext.inputs?.length,
            images: domContext.images?.length,
          });
        }
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
          ...buildImageContent(imageBlock),
          {
            type: "text",
            text: `
Identify what type of UI component or page this is. Look carefully at the visual content.

${context?.featureBeingDesigned ? `Component hint: ${context.featureBeingDesigned}` : ""}
${context?.industry ? `Industry context: ${context.industry}` : ""}
${description ? `Description: ${description}` : "Identify from the image."}

Return ONLY valid JSON:
{
  "componentType": "navbar|hero|form|dashboard|onboarding|card|about|landing-page|full-page|other",
  "componentDescription": "one sentence describing what it does",
  "audienceType": "consumer|professional|enterprise|mixed",
  "pageGoal": "marketing|application|documentation|ecommerce|portfolio|other"
}
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
      audienceType: "consumer",
      pageGoal: "marketing",
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

    // If user explicitly selected specific dimensions, always respect their choice
    // Only apply component applicability filtering when all 5 dimensions are selected
    const userSelectedAll = finalDimensions.length === allDimensions.length;

    const activeDimensions = userSelectedAll
      ? finalDimensions.filter((d) =>
          (
            componentApplicability[componentInfo.componentType] || allDimensions
          ).includes(d),
        )
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

    const analysisSystemPrompt = `You are a senior UX reviewer with deep expertise in design critique. You evaluate designs the way an experienced product designer would — with judgment, context, and genuine care about whether the design serves its actual users.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT YOU ARE REVIEWING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Component: ${componentInfo.componentDescription}
Type: ${componentInfo.componentType}
Page goal: ${componentInfo.pageGoal}
Audience type: ${componentInfo.audienceType}
${context?.industry ? `Industry: ${context.industry}` : ""}
${targetAudienceText ? `Target audience: ${targetAudienceText}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR CORE FILTER — APPLY TO EVERY FINDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before reporting any issue ask: "Would this genuinely confuse, frustrate, or block the actual users of this product?"
If no — do not report it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT TO ANALYSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyse only the actual page — its navigation, layout, content, CTAs, and interactive elements, but only the parts that are visible and functional.

Do NOT analyse:
— Screenshots, mockups or product images embedded as marketing content
— Interactive states invisible in a static screenshot (hover, focus rings, tooltips, dropdowns)
— Pixel measurements or contrast ratios you cannot directly verify from the image
— Specific text you cannot clearly read — describe the element by position instead
— Dashboard or application features on a marketing/landing page

If the page goal is marketing: evaluate for clarity, conversion flow, and accessibility. Not for app-specific features.
If the audience is domain experts or professionals: do not flag technical terminology as an issue.
${imageBlock?.type === "multi-section" ? `You are receiving ${imageBlock.sections.length} sequential page sections top to bottom. Analyse the full page. Do not repeat the same issue across sections, domains or dimensions.` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSIONS TO EVALUATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Evaluate ONLY: ${activeDimensions.join(", ")}
Call the report tool for each — one tool call per dimension.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scores:
— Base scores on real impact for this specific audience and context
— A score below 7.0 requires at least one genuine issue
— Never penalise intentional design decisions that are correct for this context

Issues:
— Maximum 3 to 7 per dimension
— Must pass the core filter above
— Order: critical → moderate → minor
— Each must cite an exact principle, heuristic, or WCAG criterion that genuinely applies
- Each issue must be what humans can perceive and understand from the image — do not report invisible technical issues or issues that require guessing text or states not visible in the image

Working observations:
— Maximum amount = 3 per dimension but must be rational and impactful — not trivial positives
— Only include what is genuinely noteworthy and specific to this design`;

    const analysisMessages = [
      {
        role: "user",
        content: [
          ...buildImageContent(imageBlock),
          {
            type: "text",
            text: `
Analyse this ${componentInfo.componentType} and report your findings using the available tools.

${formatDOMContext(domContext)}
${context?.featureTitle ? `Project: ${context.featureTitle}` : ""}
${context?.industry ? `Industry: ${context.industry}` : ""}
${targetAudienceText ? `Target audience: ${targetAudienceText}` : ""}
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
