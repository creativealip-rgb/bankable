/**
 * Calculates the new streak based on the last learning date and current date.
 * 
 * @param lastLearningDate - The date of the last learning activity
 * @param currentStreak - The current streak count
 * @param now - The current date (useful for testing)
 * @returns { newStreak: number, shouldUpdateDate: boolean }
 */
export function calculateStreak(
  lastLearningDate: Date | null,
  currentStreak: number,
  now: Date = new Date()
): { newStreak: number; shouldUpdateDate: boolean } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!lastLearningDate) {
    return { newStreak: 1, shouldUpdateDate: true };
  }

  const lastDate = new Date(lastLearningDate);
  const lastLearningDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

  const diffTime = today.getTime() - lastLearningDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already learned today, streak stays the same
    return { newStreak: currentStreak, shouldUpdateDate: false };
  }

  if (diffDays === 1) {
    // Consecutive day!
    return { newStreak: (currentStreak || 0) + 1, shouldUpdateDate: true };
  }

  // Gap too large, reset to 1
  return { newStreak: 1, shouldUpdateDate: true };
}
