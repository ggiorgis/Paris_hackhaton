import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface PdfDocument {
  name: string;
  mimeType: string;
  data: string; // base64
}

export async function generateSynthesisMap(
  goal: string,
  pdfs: PdfDocument[]
): Promise<string> {
  const parts: any[] = pdfs.map((pdf) => ({
    inlineData: {
      mimeType: pdf.mimeType,
      data: pdf.data,
    },
  }));

  parts.push({
    text: `You are THE VIBE-RESEARCH ENGINE, a specialized Research Operating System designed to turn raw academic literature into high-level intuitive insights and validated experiment designs.

The user has provided the following Research Goal:
"${goal}"

They have also uploaded foundational PDFs (treat these as the ground truth / "Source Code" of the problem).

PHASE 1: THE SYNTHESIS MAP
Extract the "Vibe". Do not provide a generic summary.

Output must include exactly these sections:
## 1. The Core Tension
Identify the one specific technical bottleneck or conceptual gap shared by these papers.

## 2. The "Non-Obvious" Insights
List 3-5 insights that are only visible when looking at all papers simultaneously.

## 3. High-Density Reading List
Point the researcher to specific pages/figures across the papers that are "Must-Reads" for their specific goal.

STYLE CONSTRAINTS:
- Use $LaTeX$ for all mathematical variables, formulas, and proofs. Use single $ for inline math and double $$ for block math.
- Keep responses modular and scannable using Markdown headers.`,
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
  });

  return response.text || "";
}

export async function generateBrainstormingCanvas(
  goal: string,
  pdfs: PdfDocument[],
  synthesisMap: string,
  idea: string
): Promise<string> {
  const parts: any[] = pdfs.map((pdf) => ({
    inlineData: {
      mimeType: pdf.mimeType,
      data: pdf.data,
    },
  }));

  parts.push({
    text: `You are THE VIBE-RESEARCH ENGINE.

Research Goal: "${goal}"

Synthesis Map:
${synthesisMap}

The user has proposed the following idea:
"${idea}"

PHASE 2: THE BRAINSTORMING CANVAS & EXPERIMENT EXECUTION
Act as a "Bouncing Board" for high-level intuition and an autonomous researcher.

Output must include exactly these sections:
## 1. Vibe Check
Compare the user's idea against the uploaded literature. Does it conflict with a known proof? Does it build on a known strength? Also check if this idea is already present in the literature. If the idea is weak, challenge it intellectually but constructively.

## 2. Lateral Expansion
Suggest 2-3 "What if?" scenarios that push the idea further.

## 3. Technical Formalization
Convert the user's "vibe" into formal notation or LaTeX equations to ensure scientific rigor.

## 4. Proposed Methodologies
Provide 2-3 distinct methodologies for how we could realistically test or validate this idea (e.g., data analysis, competitive research, or a logical simulation).

## 5. Selected Methodology
Automatically select the most viable or impactful methodology of the three.

## 6. Execution & Results
Use your Google Search tool to gather real-world evidence, or write Python code to simulate this methodology and perform calculations. Then, simulate the execution of this code and show the output, explaining what it means.

## 7. Reporting & Recommendation
Present a concise report of the results, including the data gathered, what it proves/disproves, and a final 'Go/No-Go' recommendation for the original idea.

STYLE CONSTRAINTS:
- Use $LaTeX$ for all mathematical variables, formulas, and proofs. Use single $ for inline math and double $$ for block math.
- Keep responses modular and scannable using Markdown headers.`,
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return response.text || "";
}

export interface PlotData {
  plotType: "line" | "bar" | "scatter";
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  data: { x: number | string; y: number }[];
}

export interface CustomExperimentResult {
  report: string;
  plotData: PlotData | null;
}

export async function runCustomExperiment(
  goal: string,
  pdfs: PdfDocument[],
  synthesisMap: string,
  idea: string,
  brainstormingCanvas: string,
  customExperiment: string
): Promise<CustomExperimentResult> {
  const parts: any[] = pdfs.map((pdf) => ({
    inlineData: {
      mimeType: pdf.mimeType,
      data: pdf.data,
    },
  }));

  parts.push({
    text: `You are THE VIBE-RESEARCH ENGINE.

Research Goal: "${goal}"

Synthesis Map:
${synthesisMap}

User's Idea:
"${idea}"

Brainstorming Canvas & Previous Execution:
${brainstormingCanvas}

The user wants to run the following custom experiment to validate their idea:
"${customExperiment}"

PHASE 3: CUSTOM EXPERIMENT EXECUTION
Use your Google Search tool to gather real-world evidence, or write python code to simulate or run this custom experiment. Then, simulate the execution of the code and output a concise report of the results.

CRITICAL: At the very end of your response, you MUST output a JSON block containing the data to plot the results.
The JSON block MUST be enclosed in \`\`\`json ... \`\`\` and have exactly this structure:
{
  "plotType": "line" | "bar" | "scatter",
  "title": "Plot Title",
  "xAxisLabel": "X Axis",
  "yAxisLabel": "Y Axis",
  "data": [
    { "x": 1, "y": 2 },
    { "x": 2, "y": 4 }
  ]
}

If the experiment fails or no plot makes sense, output an empty data array.

STYLE CONSTRAINTS:
- Use $LaTeX$ for all mathematical variables, formulas, and proofs. Use single $ for inline math and double $$ for block math.
- Keep responses modular and scannable using Markdown headers.`,
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "";
  
  // Extract JSON
  let plotData: PlotData | null = null;
  const jsonMatch = text.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      plotData = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error("Failed to parse plot data JSON", e);
    }
  }

  // Remove JSON from report
  const report = text.replace(/\`\`\`json\n[\s\S]*?\n\`\`\`/, '').trim();

  return { report, plotData };
}
