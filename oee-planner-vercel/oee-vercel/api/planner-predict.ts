import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { machine, shift, targetCount, partWt, goodCount, badCount } = req.body;
  const totalCount = (goodCount || 0) + (badCount || 0);
  const qr = totalCount > 0 ? ((goodCount || 0) / totalCount) * 100 : 0;

  try {
    const prompt = `Act as an industrial OEE prediction model. Predict the likely OEE for a machine with these inputs:
    Machine: ${machine}
    Shift: ${shift}
    Target Count: ${targetCount}
    Part Weight: ${partWt}g
    Expected Good Count: ${goodCount}
    Expected Bad Count: ${badCount}
    Calculated QR: ${qr.toFixed(2)}%
    
    Estimate realistic AR and PR based on industrial benchmarks and these specific counts.
    Return JSON: { "predictedOEE": number, "predictedAR": number, "predictedPR": number, "insights": string }`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const text = result.text || '{}';
    try {
      res.json(JSON.parse(text));
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) res.json(JSON.parse(match[0]));
      else res.json({ insights: 'Performance appears standard for this configuration.' });
    }
  } catch {
    res.status(500).json({ error: 'Prediction failed', insights: 'Simulation engine offline.' });
  }
}
