import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { slugify } from "~/lib/utils";
import { shopSectorSchema } from "~/lib/validators/shop-sector";
import {
  adminOnlyProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { blankToNull } from "~/server/geocoding/approximate-location";

const SECTOR_ORDER = [{ sortOrder: "asc" }, { name: "asc" }] as const;

/** Turns the P2002 a concurrent save hits into the form's duplicate error. */
function rethrowNameConflict(error: unknown): never {
  if ((error as { code?: string } | null)?.code === "P2002") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A sector with that name already exists. Choose another name.",
    });
  }
  throw error;
}

export const shopSectorRouter = createTRPCRouter({
  /** Public: the Artisan Map and the shop form read this. */
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.shopSector.findMany({
      orderBy: [...SECTOR_ORDER],
      select: {
        id: true,
        slug: true,
        name: true,
        shortName: true,
        description: true,
        colorKey: true,
      },
    });
  }),

  /** The admin list. Counts include hidden shops, so this stays admin-only. */
  getAllForAdmin: adminOnlyProcedure.query(({ ctx }) => {
    return ctx.db.shopSector.findMany({
      orderBy: [...SECTOR_ORDER],
      include: { _count: { select: { shops: true } } },
    });
  }),

  get: adminOnlyProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.db.shopSector.findUnique({
      where: { id: input },
      include: { _count: { select: { shops: true } } },
    });
  }),

  create: adminOnlyProcedure
    .input(shopSectorSchema)
    .mutation(async ({ ctx, input }) => {
      const slug = slugify(input.name);

      const existing = await ctx.db.shopSector.findFirst({
        where: {
          OR: [{ slug }, { name: { equals: input.name, mode: "insensitive" } }],
        },
        select: { name: true, slug: true },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            existing.slug === slug
              ? `"${existing.name}" already uses the slug "${slug}". Choose a different name.`
              : `A sector named "${existing.name}" already exists.`,
        });
      }

      const { _max } = await ctx.db.shopSector.aggregate({
        _max: { sortOrder: true },
      });

      const sector = await ctx.db.shopSector
        .create({
          data: {
            slug,
            name: input.name,
            shortName: blankToNull(input.shortName),
            description: blankToNull(input.description),
            colorKey: input.colorKey,
            sortOrder: (_max.sortOrder ?? -1) + 1,
          },
        })
        .catch(rethrowNameConflict);

      return { data: sector, message: "Sector created successfully" };
    }),

  // No `slug` in the input: it stays fixed so shared map links keep working.
  update: adminOnlyProcedure
    .input(shopSectorSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.shopSector.findFirst({
        where: {
          name: { equals: input.name, mode: "insensitive" },
          NOT: { id: input.id },
        },
        select: { name: true },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A sector named "${existing.name}" already exists.`,
        });
      }

      const sector = await ctx.db.shopSector
        .update({
          where: { id: input.id },
          data: {
            name: input.name,
            shortName: blankToNull(input.shortName),
            description: blankToNull(input.description),
            colorKey: input.colorKey,
          },
        })
        .catch(rethrowNameConflict);

      return { data: sector, message: "Sector updated successfully" };
    }),

  delete: adminOnlyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Its shops fall back to "Other" via onDelete: SetNull on Shop.shopSector.
      await ctx.db.shopSector.delete({ where: { id: input.id } });
      return { data: null, message: "Sector deleted successfully" };
    }),

  /** Moves a sector one place, working from the stored order, not the client's. */
  reorder: adminOnlyProcedure
    .input(z.object({ id: z.string(), direction: z.enum(["up", "down"]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(async (tx) => {
        const rows = await tx.shopSector.findMany({
          orderBy: [...SECTOR_ORDER],
          select: { id: true },
        });
        const ids = rows.map((row) => row.id);

        const from = ids.indexOf(input.id);
        if (from === -1) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "That sector no longer exists.",
          });
        }
        const to = input.direction === "up" ? from - 1 : from + 1;
        if (to < 0 || to >= ids.length) return;

        ids.splice(from, 1);
        ids.splice(to, 0, input.id);
        for (const [sortOrder, id] of ids.entries()) {
          await tx.shopSector.update({
            where: { id },
            data: { sortOrder },
          });
        }
      });
      return { data: null, message: "Sector moved" };
    }),
});
