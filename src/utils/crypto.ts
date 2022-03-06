import * as crypto from "crypto";
import { promisify } from "util";

//Hash the provided string
export function hashJWT(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function generateRandomKey(length: number) {
  const randomKey = promisify(crypto.randomBytes);

  return (await randomKey(length)).toString("hex").replace("=", "");
}
