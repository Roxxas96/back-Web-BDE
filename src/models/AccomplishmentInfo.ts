export interface AccomplishmentInfo {
  proof?: string;
}
//TODO Rework on Ids, replace with entity (ex creatorId => creatorInfos)

export const AccomplishmentSchema = {
  type: "object",
  required: [],
  properties: {
    proof: { type: "string" },
  },
};
