//Metadata for users
export interface CreateUserInfo {
  email: string;
  password: string;
  name?: string;
  surname?: string;
  pseudo?: string;
  privilege?: number;
}
//Metadata for users
export interface UpdateUserInfo {
  email?: string;
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
export const CreateUserSchema = {
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

//Schema used for requests
export const UpdateUserSchema = {
  type: "object",
  description: "User metadata",
  required: ["password"],
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
