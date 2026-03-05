import type { Role } from "generated/prisma";
import { z } from "zod";

import { adminOnlyProcedure, createTRPCRouter } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  changeRole: adminOnlyProcedure
    .input(z.object({ role: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { role: input.role as Role },
      });
      return {
        data: ctx.session.user,
        message: `${ctx.session.user.name} was updated to ${ctx.session.user.role}`,
      };
    }),
});
