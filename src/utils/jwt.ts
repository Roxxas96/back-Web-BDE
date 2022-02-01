import * as jwt from "jsonwebtoken";

const defaultSecretKey: string = process.env["JWT_TOKEN"] || "secrettoken";

//Get payload from a JWT, payloads contains userId
export function getPayload(token: string) {
  return new Promise<{ id: number } | undefined>((resolve, reject) => {
    jwt.verify(
      token,
      process.env["JWT_TOKEN"] || defaultSecretKey,
      (err, decoded) => {
        //Ignore wrong jwt
        if (err && !err.message.includes("jwt malformed")) {
          console.error(err);
        }
        resolve(<{ id: number }>decoded);
      }
    );
  });
}

//Create JWT from the provided payload
export function createJWT(payload: Object) {
  return new Promise<string | undefined>((resolve, reject) => {
    jwt.sign(
      payload,
      process.env["JWT_TOKEN"] || defaultSecretKey,
      {
        expiresIn: "30d",
      },
      (err, token) => {
        if (err) {
          reject(err);
        }
        resolve(token);
      }
    );
  });
}
