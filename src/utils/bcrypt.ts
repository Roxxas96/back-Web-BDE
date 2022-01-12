import * as bcrypt from "bcrypt";

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

export async function hashPassword(password: string) {
  let hash;
  try {
    hash = await bcrypt.hash(password, 10);
  } catch (err) {
    throw err;
  }
  return hash;
}
