export interface ChallengeInfo {
  name?: string;
  description?: string;
  reward?: number;
}

export interface ChallengeInfoMinimal {
  name: string;
  reward: number;
}

export const ChallengeSchema = {
  type: "object",
  required: [],
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    reward: { type: "number" },
  },
};