// POST /api/answer
// Records a visitor's answer as a new text block in the private "answers"
// channel on Are.na.
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.ARENA_TOKEN || !env.ARENA_ANSWERS_SLUG) {
    return json({ error: "Server is missing Are.na configuration" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  const question = typeof body.question === "string" ? body.question.trim() : "";

  if (!answer) {
    return json({ error: "Answer is required" }, 400);
  }

  const content = question ? `Q: ${question}\nA: ${answer}` : answer;

  const res = await fetch("https://api.are.na/v3/blocks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.ARENA_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      value: content,
      channel_ids: [env.ARENA_ANSWERS_SLUG],
    }),
  });

  if (!res.ok) {
    return json({ error: "Failed to save answer to Are.na" }, 502);
  }

  return json({ ok: true });
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}
