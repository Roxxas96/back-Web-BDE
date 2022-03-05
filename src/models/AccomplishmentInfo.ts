//Metadata fot accomplishments
export interface AccomplishmentInfo {
  comment?: string;
}

//Schema used for requests
export const AccomplishmentSchema = {
  type: "object",
  description: "Accomplishment metadata",

  properties: {
    comment: { type: "string" },
  },
  additionalProperties: false,
};
