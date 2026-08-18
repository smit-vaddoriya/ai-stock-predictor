import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import type { JwtPayload } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function signToken(payload: JwtPayload): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in .env.local");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserFromRequest(request: NextRequest): JwtPayload | null {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}