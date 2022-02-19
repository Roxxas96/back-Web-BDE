//Metadata fot accomplishments
export interface AccomplishmentInfo {
  proof?: string;
}

//Schema used for requests
export const AccomplishmentSchema = {
  type: "object",
  description: "Accomplishment metadata",

  properties: {
    proof: { type: "string" },
  },
  additionalProperties: false,
};
