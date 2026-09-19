import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1),
  props: z.record(z.string(), z.unknown()).optional().default({}),
  pretty: z.boolean().optional().default(false),
});

export default defineEventHandler(async (event) => {
  const { name, props, pretty } = await readValidatedBody(event, bodySchema.parse);

  try {
    const html = await renderEmailComponent(name, props, { pretty });
    return { html, template: name };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to render email: ${error.message || "Unknown error"}`,
    });
  }
});
