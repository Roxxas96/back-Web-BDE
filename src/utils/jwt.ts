import * as jwt from "jsonwebtoken";

const defaultSecretKey: jwt.Secret = "secrettoken";

export function getPayload(token: string) {
  return new Promise<{ id: number } | undefined>((resolve, reject) => {
    jwt.verify(
      token,
      process.env["JWT_TOKEN"] || defaultSecretKey,
      (err, decoded) => {
        if (err) {
          reject(err);
        }
        resolve(<{ id: number }>decoded);
      }
    );
  });
}

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
