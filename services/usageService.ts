
import { UsageStats } from '../types';

const STORAGE_KEY = 'sc_usage_stats';
const DAILY_LIMIT = 5;

export const usageService = {
  getStats: (): UsageStats => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];

    if (!stored) {
      const initial = { scansToday: 0, lastReset: today, isPro: false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const stats: UsageStats = JSON.parse(stored);
    if (stats.lastReset !== today) {
      stats.scansToday = 0;
      stats.lastReset = today;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
    return stats;
  },

  incrementScan: () => {
    const stats = usageService.getStats();
    if (stats.isPro) return;
    stats.scansToday += 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  },

  canScan: (): boolean => {
    const stats = usageService.getStats();
    return stats.isPro || stats.scansToday < DAILY_LIMIT;
  },

  upgradeToPro: () => {
    const stats = usageService.getStats();
    stats.isPro = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }
};
