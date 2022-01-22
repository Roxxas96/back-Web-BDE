import * as crypto from "crypto";

//Hash the provided string
export function hashJWT(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
