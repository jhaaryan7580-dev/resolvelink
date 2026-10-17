import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getGraphRepository, getInitialDemoScenario } from "./resolveGraph";

export const appRouter = router({
  system: systemRouter,
  // Starter compatibility only: ResolveLink exposes no login or account UI.
  auth: router({
    me: publicProcedure.query(options => options.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  resolve: router({
    scenario: publicProcedure.query(() => getInitialDemoScenario()),
    analyze: publicProcedure
      .input(z.object({ message: z.string().trim().min(8).max(800) }))
      .mutation(async ({ input }) =>
        getGraphRepository().analyze(input.message)
      ),
  }),
});

export type AppRouter = typeof appRouter;
