import AsyncStorage from '@react-native-async-storage/async-storage';
import { BestProgress } from './engine';

const BEST_PROGRESS_KEY = 'uhak_best_progress';
const FREE_BEST_SCORE_KEY = 'uhak_free_best_score';

export const loadBestProgress = async (): Promise<BestProgress> => {
  try {
    const saved = await AsyncStorage.getItem(BEST_PROGRESS_KEY);

    if (!saved) {
      return { level: 1, score: 0 };
    }

    const parsed = JSON.parse(saved);
    return {
      level: Number(parsed.level) || 1,
      score: Number(parsed.score) || 0,
    };
  } catch {
    return { level: 1, score: 0 };
  }
};

export const saveBestProgress = async (progress: BestProgress) => {
  await AsyncStorage.setItem(BEST_PROGRESS_KEY, JSON.stringify(progress));
};

export const loadFreeBestScore = async () => {
  try {
    const saved = await AsyncStorage.getItem(FREE_BEST_SCORE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
};

export const saveFreeBestScore = async (score: number) => {
  await AsyncStorage.setItem(FREE_BEST_SCORE_KEY, score.toString());
};
