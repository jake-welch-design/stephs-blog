// GET /api/posts
// Reads the private "posts" channel from Are.na and splits each text block's
// content into { post, question } on a line containing only "*".
export async function onRequestGet(context) {
  const { env } = context;

  if (!env.ARENA_TOKEN || !env.ARENA_POSTS_SLUG) {
    return json({ error: "Server is missing Are.na configuration" }, 500);
  }

  const res = await fetch(
    `https://api.are.na/v2/channels/${env.ARENA_POSTS_SLUG}?per=100`,
    { headers: { Authorization: `Bearer ${env.ARENA_TOKEN}` } }
  );

  if (!res.ok) {
    return json({ error: "Failed to load posts from Are.na" }, 502);
  }

  const data = await res.json();
  const blocks = (data.contents || [])
    .filter((block) => block.class === "Text" && block.content)
    .reverse(); // newest first

  const posts = blocks.map((block) => {
    const lines = block.content.replace(/\r\n/g, "\n").split("\n");
    const splitAt = lines.findIndex((line) => line.trim() === "*");

    const post =
      splitAt === -1
        ? block.content.trim()
        : lines.slice(0, splitAt).join("\n").trim();
    const question =
      splitAt === -1 ? null : lines.slice(splitAt + 1).join("\n").trim();

    return { id: block.id, date: block.created_at, post, question };
  });

  return json({ posts }, 200, { "cache-control": "public, max-age=60" });
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}
