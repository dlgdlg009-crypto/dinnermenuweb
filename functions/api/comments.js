const VISITOR_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_COMMENT_LENGTH = 500;
const MAX_REQUEST_BYTES = 2048;
const COMMENTS_PER_HOUR = 4;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin;
}

function database(context) {
  return context.env?.REACTIONS_DB;
}

function format(row) {
  return { id: row.id, body: row.body, createdAt: row.created_at };
}

export async function onRequestGet(context) {
  if (!sameOrigin(context.request)) return json({ error: 'Cross-origin requests are not allowed.' }, 403);
  const db = database(context);
  if (!db) return json({ error: 'Comment storage is not configured.' }, 503);
  try {
    const result = await db.prepare(
      'SELECT id, body, created_at FROM dinner_comments ORDER BY created_at DESC LIMIT 50'
    ).all();
    return json({ comments: (result.results || []).map(format) });
  } catch {
    return json({ error: 'Comment storage is not ready.' }, 503);
  }
}

export async function onRequestPost(context) {
  if (!sameOrigin(context.request)) return json({ error: 'Cross-origin requests are not allowed.' }, 403);
  const db = database(context);
  if (!db) return json({ error: 'Comment storage is not configured.' }, 503);
  const contentLength = Number(context.request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) return json({ error: 'Comment is too large.' }, 413);

  let body;
  try { body = await context.request.json(); }
  catch { return json({ error: 'Invalid JSON body.' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Invalid comment.' }, 400);
  }
  const comment = typeof body.body === 'string' ? body.body.normalize('NFC').trim() : '';
  if (!comment || comment.length > MAX_COMMENT_LENGTH || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(comment)) {
    return json({ error: '댓글은 1~500자로 작성해 주세요.' }, 400);
  }
  if (!VISITOR_ID.test(body.visitorId || '') || typeof body.website !== 'string') {
    return json({ error: 'Invalid comment.' }, 400);
  }
  if (body.website.trim()) return json({ error: 'Invalid comment.' }, 400);

  try {
    const recent = await db.prepare(
      "SELECT COUNT(*) AS count FROM dinner_comments WHERE visitor_id = ? AND created_at >= datetime('now', '-1 hour')"
    ).bind(body.visitorId).first();
    if ((Number(recent?.count) || 0) >= COMMENTS_PER_HOUR) {
      return json({ error: '잠시 쉬었다가 다시 댓글을 남겨주세요.' }, 429);
    }
    const id = crypto.randomUUID();
    const inserted = await db.prepare(
      'INSERT INTO dinner_comments (id, visitor_id, body) VALUES (?, ?, ?)'
    ).bind(id, body.visitorId, comment).run();
    if (!inserted.success) throw new Error('Insert failed');
    const row = await db.prepare(
      'SELECT id, body, created_at FROM dinner_comments WHERE id = ?'
    ).bind(id).first();
    return json({ comment: format(row) }, 201);
  } catch {
    return json({ error: '댓글 저장소가 준비되지 않았어요. 잠시 후 다시 시도해 주세요.' }, 503);
  }
}
