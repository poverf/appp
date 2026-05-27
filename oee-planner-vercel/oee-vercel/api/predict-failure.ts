import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { machineData } = req.body;
  if (!machineData) return res.status(400).json({ error: 'Missing machine data' });

  try {
    const prompt = `Analyze the following OEE and machine performance data to predict potential failures or maintenance needs. Give a concise risk score from 0-100 and a brief explanation with recommendations.
    
    Data: ${JSON.stringify(machineData)}
    
    Return the response in JSON format:
    {
      "riskScore": number,
      "riskLevel": "Low" | "Medium" | "High" | "Critical",
      "explanation": string,
      "recommendations": string[]
    }`;

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
      else throw new Error('Invalid JSON from model');
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'AI analysis failed',
      riskScore: 50,
      riskLevel: 'Medium',
      explanation: 'Unable to reach diagnostic engine. Manual inspection recommended.',
      recommendations: ['Check machine vibration', 'Review last maintenance log'],
    });
  }
}
