//Metadata for goodies
export interface GoodiesInfo {
  name?: string;
  description?: string;
  buyLimit?: number;
  stock?: number;
  bought?: number;
  price?: number;
}

//Minimal format of goodies info
export interface GoodiesInfoMinimal {
  name: string;
  price: number;
  id: number;
  stock: number;
  bought: number;
}

//Schema used for requests
export const GoodiesSchema = {
  type: "object",
  description: "Goodies metadata",

  properties: {
    name: { type: "string" },
    description: { type: "string" },
    price: { type: "number" },
    buyLimit: { type: "number" },
    stock: { type: "number" },
  },
  additionalProperties: false,
};
