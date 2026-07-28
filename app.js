function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

function setCookie(name, value) {
  const tenYears = 60 * 60 * 24 * 365 * 10;
  document.cookie = `${name}=${value}; Path=/; Max-Age=${tenYears}; SameSite=Lax`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderParagraphs(text) {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function showPostBody(el, entry) {
  el.innerHTML = `<div class="post-body">${renderParagraphs(entry.post)}</div>`;
}

function renderPost(entry) {
  const el = document.createElement("article");
  el.className = "post";

  const unlocked =
    !entry.question || getCookie(`arena_unlocked_${entry.id}`) === "1";

  if (unlocked) {
    showPostBody(el, entry);
    return el;
  }

  el.innerHTML = `
    <p class="question">${escapeHtml(entry.question)}</p>
    <form>
      <textarea required placeholder="Your answer"></textarea>
      <br />
      <button type="submit">Enter</button>
      <p class="error" hidden></p>
    </form>
  `;

  const form = el.querySelector("form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const textarea = form.querySelector("textarea");
    const errorEl = form.querySelector(".error");
    const button = form.querySelector("button");
    const answer = textarea.value.trim();
    if (!answer) return;

    button.disabled = true;
    errorEl.hidden = true;

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: entry.question, answer }),
      });
      if (!res.ok) throw new Error("request failed");

      setCookie(`arena_unlocked_${entry.id}`, "1");
      showPostBody(el, entry);
    } catch {
      errorEl.textContent = "Something went wrong. Please try again.";
      errorEl.hidden = false;
      button.disabled = false;
    }
  });

  return el;
}

async function init() {
  const app = document.getElementById("app");
  try {
    const res = await fetch("/api/posts");
    if (!res.ok) throw new Error("request failed");
    const { posts } = await res.json();

    app.innerHTML = "";
    if (!posts.length) {
      app.innerHTML = "<p>No posts yet.</p>";
      return;
    }
    posts.forEach((entry) => app.appendChild(renderPost(entry)));
  } catch {
    app.innerHTML = '<p class="error">Couldn\'t load posts.</p>';
  }
}

init();
