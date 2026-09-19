import { z } from "zod";

const querySchema = z
  .object({
    name: z
      .string()
      .min(1, {
        message:
          "Missing template name. Usage: /api/emails/debug?name=TemplateName&prop1=value1&...",
      }),
  })
  .passthrough();

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse);

  // Remove 'name' from query, rest are props
  const { name, ...props } = query;

  try {
    const html = await renderEmailComponent(name, props as Record<string, unknown>, {
      pretty: true,
    });

    // If renderEmailComponent returns an object with html, extract it
    const htmlString = typeof html === "string" ? html : html.html;

    // Return raw HTML for direct browser viewing
    setHeader(event, "Content-Type", "text/html; charset=utf-8");
    return htmlString;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to render: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
});
