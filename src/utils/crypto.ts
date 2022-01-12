import * as crypto from "crypto";

export function hashJWT(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
