export interface ChallengeInfo {
  name?: string;
  description?: string;
  reward?: number;
  creatorId: number;
}

export interface ChallengeInfoMinimal {
  name: string;
  reward: number;
}
