import jwt from "jsonwebtoken";

export interface HrManagerTokenPayload {
  sub: string; // HrManager id
  email: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signHrManagerToken(payload: HrManagerTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "8h" });
}

export function verifyHrManagerToken(token: string): HrManagerTokenPayload {
  return jwt.verify(token, getSecret()) as HrManagerTokenPayload;
}
