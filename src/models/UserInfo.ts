//Metadata for users
export interface UserInfo {
  email: string;
  password: string;
  name?: string;
  surname?: string;
  pseudo?: string;
  privilege?: number;
}

//Privacy fiendly infos un users
export interface UserInfoMinimal {
  pseudo: string;
  id: number;
}

export interface UserWithoutPassword {
  id: number;
  name: string;
  surname: string;
  pseudo: string;
  email: string;
  wallet: number;
  privilege: number;
}

//Schema used for requests
export const UserSchema = {
  type: "object",
  description: "User metadata",
  required: ["email", "password"],
  properties: {
    name: { type: "string" },
    surname: { type: "string" },
    pseudo: { type: "string" },
    email: { type: "string", format: "email" },
    password: { type: "string" },
    privilege: { type: "number" },
  },
  additionalProperties: false,
};
