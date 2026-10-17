import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const cookie = opts.req.headers.cookie ?? "";
  const hasSession =
    cookie.includes(`${COOKIE_NAME}=`) ||
    Boolean(opts.req.headers.authorization);

  // Resolve identity only when a request actually supplies credentials. ResolveLink's
  // graph intake is public, so anonymous demo calls should not trigger starter auth or DB work.
  if (hasSession) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch {
      user = null;
    }
  }

  return { req: opts.req, res: opts.res, user };
}
