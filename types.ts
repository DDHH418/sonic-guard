
export interface NoiseReading {
  timestamp: number;
  decibels: number;
}

export interface DailySummary {
  date: string;
  averageDb: number;
  peakDb: number;
  exposureMinutes: number;
}

export interface AIInsights {
  summary: string;
  preventionTips: string[];
  remainingBudget: string; // "Noise budget" left for the week based on safety standards
  funnyQuotes: string[];
}

export interface HistoryData {
  dailySummaries: DailySummary[];
}
