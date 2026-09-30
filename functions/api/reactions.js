const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_MENU_NAME_LENGTH = 64;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function validMenuName(value) {
  return typeof value === 'string' && value === value.trim() && value.length > 0 &&
    value.length <= MAX_MENU_NAME_LENGTH && !/[\u0000-\u001f\u007f]/.test(value);
}

function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin;
}

function database(context) {
  return context.env?.REACTIONS_DB;
}

export async function onRequestGet(context) {
  if (!sameOrigin(context.request)) return json({ error: 'Cross-origin requests are not allowed.' }, 403);
  const db = database(context);
  if (!db) return json({ error: 'Reaction storage is not configured.' }, 503);

  let names;
  try { names = JSON.parse(new URL(context.request.url).searchParams.get('menus') || 'null'); }
  catch { return json({ error: 'Invalid menu list.' }, 400); }
  if (!Array.isArray(names) || names.length < 1 || names.length > 3 ||
      names.some(name => !validMenuName(name)) || new Set(names).size !== names.length) {
    return json({ error: 'Invalid menu list.' }, 400);
  }

  const visitor = context.request.headers.get('X-Reaction-Visitor') || '';
  if (visitor && !UUID_V4.test(visitor)) return json({ error: 'Invalid visitor ID.' }, 400);
  const placeholders = names.map(() => '?').join(', ');
  try {
    const countResult = await db.prepare(
      `SELECT menu_name, COUNT(*) AS count FROM menu_reactions WHERE menu_name IN (${placeholders}) GROUP BY menu_name`
    ).bind(...names).all();
    const counts = Object.fromEntries(names.map(name => [name, 0]));
    for (const row of countResult.results || []) counts[row.menu_name] = Number(row.count) || 0;

    let liked = [];
    if (visitor) {
      const likedResult = await db.prepare(
        `SELECT menu_name FROM menu_reactions WHERE voter_id = ? AND menu_name IN (${placeholders})`
      ).bind(visitor, ...names).all();
      liked = (likedResult.results || []).map(row => row.menu_name);
    }
    return json({ counts, liked });
  } catch {
    return json({ error: 'Could not load menu reactions.' }, 503);
  }
}

export async function onRequestPost(context) {
  if (!sameOrigin(context.request)) return json({ error: 'Cross-origin requests are not allowed.' }, 403);
  const db = database(context);
  if (!db) return json({ error: 'Reaction storage is not configured.' }, 503);
  const contentLength = Number(context.request.headers.get('Content-Length') || 0);
  if (contentLength > 1024) return json({ error: 'Request is too large.' }, 413);

  let body;
  try { body = await context.request.json(); }
  catch { return json({ error: 'Invalid JSON body.' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Invalid reaction.' }, 400);
  }
  const menu = typeof body.menu === 'string' ? body.menu.normalize('NFC') : '';
  if (!validMenuName(menu) || !UUID_V4.test(body.visitor || '') || typeof body.liked !== 'boolean') {
    return json({ error: 'Invalid reaction.' }, 400);
  }
  const headerVisitor = context.request.headers.get('X-Reaction-Visitor');
  if (headerVisitor && headerVisitor !== body.visitor) return json({ error: 'Visitor ID mismatch.' }, 400);

  try {
    if (body.liked) {
      await db.prepare('INSERT OR IGNORE INTO menu_reactions (menu_name, voter_id) VALUES (?, ?)')
        .bind(menu, body.visitor).run();
    } else {
      await db.prepare('DELETE FROM menu_reactions WHERE menu_name = ? AND voter_id = ?')
        .bind(menu, body.visitor).run();
    }
    const row = await db.prepare('SELECT COUNT(*) AS count FROM menu_reactions WHERE menu_name = ?')
      .bind(menu).first();
    return json({ count: Number(row?.count) || 0, liked: body.liked });
  } catch {
    return json({ error: 'Could not save menu reaction.' }, 503);
  }
}
