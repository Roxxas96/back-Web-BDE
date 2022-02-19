//Metadata for goodies
export interface GoodiesInfo {
  name?: string;
  description?: string;
  buyLimit?: number;
  stock?: number;
  price?: number;
  image?: string;
}

//Minimal format of goodies info
export interface GoodiesInfoMinimal {
  name: string;
  price: number;
  image: string;
  id: number;
}

//Schema used for requests
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
    stock: { type: "number" },
  },
  additionalProperties: false,
};
