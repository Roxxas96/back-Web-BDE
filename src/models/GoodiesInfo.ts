export interface GoodiesInfo {
  name?: string;
  description?: string;
  buyLimit?: number;
  price?: number;
  image?: string;
}

export interface GoodiesInfoMinimal {
  name: string;
  price: number;
  image: string;
}

export const GoodiesSchema = {
  type: "object",
  description: "Goodies metadata",
  required: [],
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    image: { type: "string" },
    price: { type: "number" },
    buyLimit: { type: "number" },
  },
  additionalProperties: false
};