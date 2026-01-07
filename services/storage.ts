
// Fix: Import NOISE_STORAGE_KEY from constants.ts instead of types.ts
import { DailySummary } from '../types';
import { NOISE_STORAGE_KEY } from '../constants';

export const storageService = {
  saveHistory: (summaries: DailySummary[]) => {
    // Fix: Consistently use the NOISE_STORAGE_KEY constant for localStorage
    localStorage.setItem(NOISE_STORAGE_KEY, JSON.stringify(summaries));
  },

  getHistory: (): DailySummary[] => {
    // Fix: Consistently use the NOISE_STORAGE_KEY constant for localStorage
    const data = localStorage.getItem(NOISE_STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  addDailyReading: (reading: DailySummary) => {
    const history = storageService.getHistory();
    const existingIndex = history.findIndex(h => h.date === reading.date);
    
    if (existingIndex > -1) {
      history[existingIndex] = reading;
    } else {
      history.push(reading);
    }
    
    // Keep only last 30 days
    const trimmedHistory = history.slice(-30);
    storageService.saveHistory(trimmedHistory);
  }
};
