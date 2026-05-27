export interface OEERecord {
  machine: string;
  shift: string;
  oee: number;
  ar: number;
  pr: number;
  qr: number;
  runMin: number;
  availMin: number;
  targetCount: number;
  goodCount: number;
  badCount: number;
  partWt: number;
  qualityLossMin: number;
  date: string;
}

export interface FailurePrediction {
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  explanation: string;
  recommendations: string[];
}

export interface PlannerPrediction {
  predictedOEE: number;
  predictedAR: number;
  predictedPR: number;
  insights: string;
}

export type Tab = 'dashboard' | 'planner' | 'prediction';
