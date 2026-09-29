(() => {
  'use strict';
  const input = document.querySelector('#menuSearch');
  const entries = [...document.querySelectorAll('[data-menu-entry]')];
  const count = document.querySelector('#menuCount');
  const empty = document.querySelector('#menuEmpty');
  if (!input || !count || !empty) return;

  input.addEventListener('input', () => {
    const query = input.value.trim().toLocaleLowerCase('ko-KR');
    let visible = 0;
    for (const entry of entries) {
      const matches = !query || entry.textContent.toLocaleLowerCase('ko-KR').includes(query);
      entry.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = query ? `${visible}종 검색됨` : `전체 ${entries.length}종`;
    empty.hidden = visible !== 0;
  });
})();
