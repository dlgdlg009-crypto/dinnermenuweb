(function () {
  const form = document.getElementById('commentForm');
  const textarea = document.getElementById('commentText');
  const anonymous = document.getElementById('anonymousComment');
  const list = document.getElementById('commentList');
  const status = document.getElementById('commentStatus');
  const length = document.getElementById('commentLength');
  const count = document.getElementById('commentCount');
  const panel = document.querySelector('.comments-aside');
  if (!form || !textarea || !list || !status) return;
  if (panel && window.matchMedia('(max-width: 640px)').matches) panel.open = false;

  const visitorKey = 'dinner-menu-comment-visitor';
  function getVisitorId() {
    try {
      let id = localStorage.getItem(visitorKey);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '')) {
        id = crypto.randomUUID();
        localStorage.setItem(visitorKey, id);
      }
      return id;
    } catch {
      return crypto.randomUUID();
    }
  }

  function renderComments(comments) {
    list.replaceChildren();
    for (const comment of comments) {
      const item = document.createElement('li');
      item.className = 'comment-item';
      const header = document.createElement('div');
      header.className = 'comment-item-header';
      const author = document.createElement('strong');
      author.textContent = '저녁 손님';
      const time = document.createElement('time');
      time.dateTime = comment.createdAt;
      const date = new Date(comment.createdAt);
      time.textContent = Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(date);
      const body = document.createElement('p');
      body.textContent = comment.body;
      header.append(author, time);
      item.append(header, body);
      list.append(item);
    }
  }

  async function loadComments() {
    try {
      const response = await fetch('/api/comments', { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '댓글을 불러오지 못했어요.');
      renderComments(data.comments || []);
      if (count) count.textContent = `댓글 ${Number(data.totalComments) || 0}개`;
      status.textContent = data.comments?.length ? `최근 댓글 ${data.comments.length}개를 보여드려요.` : '아직 댓글이 없어요. 첫 한마디를 남겨주세요.';
    } catch {
      if (count) count.textContent = '집계 준비 중';
      status.textContent = '댓글 저장소가 준비되지 않았어요. 잠시 후 다시 확인해 주세요.';
    }
  }

  textarea.addEventListener('input', () => {
    length.textContent = `${textarea.value.length} / 500`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = textarea.value.trim();
    if (!body) {
      textarea.focus();
      status.textContent = '댓글 내용을 입력해 주세요.';
      return;
    }
    if (!anonymous.checked) {
      anonymous.focus();
      status.textContent = '비회원 작성 확인을 체크해 주세요.';
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    status.textContent = '댓글을 등록하는 중이에요.';
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          body,
          visitorId: getVisitorId(),
          website: form.elements.website.value
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '댓글을 등록하지 못했어요.');
      textarea.value = '';
      length.textContent = '0 / 500';
      await loadComments();
      status.textContent = '댓글을 등록했어요.';
    } catch (error) {
      status.textContent = error.message || '댓글을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.';
    } finally {
      submit.disabled = false;
    }
  });

  loadComments();
})();

