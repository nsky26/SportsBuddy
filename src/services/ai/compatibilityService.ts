import type { User } from '../../utils/types';
import type { CompatibilityResult, UserBehaviorProfile } from './aiTypes';
import { scoringEngine } from './scoringEngine';

export const compatibilityService = {
  calculateCompatibility(
    user: Partial<User>,
    teammate: Partial<User>,
    behavior?: UserBehaviorProfile | null
  ): number {
    return scoringEngine.scoreCompatibility(user, teammate, behavior).percentage;
  },

  getCompatibilityDetails(
    user: Partial<User>,
    teammate: Partial<User>,
    behavior?: UserBehaviorProfile | null
  ): CompatibilityResult {
    return scoringEngine.scoreCompatibility(user, teammate, behavior);
  },
};
