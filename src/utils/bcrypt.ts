import * as bcrypt from "bcrypt";

//Compare two passwords
export async function comparePassword(
  password: string,
  hashedPassword: string
) {
  let match;
  try {
    match = await bcrypt.compare(password, hashedPassword);
  } catch (err) {
    throw err;
  }
  return match;
}

//Hash a password
export async function hashPassword(password: string) {
  let hash;
  try {
    hash = await bcrypt.hash(password, 10);
  } catch (err) {
    throw err;
  }
  return hash;
}
