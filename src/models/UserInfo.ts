export interface UserInfo {
  email: string;
  password: string;
  name?: string;
  surname?: string;
  pseudo?: string;
}

export interface UserInfoMinimal {
  pseudo: string;
}

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
  },
  additionalProperties: false,
};
