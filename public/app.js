(() => {
  'use strict';
  const { questions, recommend } = window.DinnerRecommendations;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let step = 0, answers = {}, result = null, selected = null, round = 0;
  const focusHeading = selector => { $(selector).focus({preventScroll:true}); $(selector).scrollIntoView({block:'center',behavior:'auto'}); };
  function drawSteps() {
    $('#steps').innerHTML = questions.map((q,i) => `<li><button type="button" class="step ${answers[q.key]?'done':''}" data-step="${i}" ${i===step?'aria-current="step"':''} ${i>step&&!answers[questions[i-1].key]?'disabled':''}><span aria-hidden="true">${answers[q.key]?'✓':i+1}</span>${q.short}</button></li>`).join('');
  }
  function drawQuestion(focus = true) {
    $('#quiz').hidden = false; $('#results').hidden = true; $('#final').hidden = true;
    const q = questions[step];
    drawSteps();
    $('#stepCount').textContent = `STEP ${String(step+1).padStart(2,'0')} / ${String(questions.length).padStart(2,'0')}`;
    $('#questionTitle').textContent = q.title; $('#questionHint').textContent = q.hint;
    $('#choices').className = q.options.length===2 ? 'two' : q.options.length>=4 ? 'four' : '';
    $('#choices').innerHTML = `<legend class="sr-only">${q.title}</legend>` + q.options.map(([value,icon,label]) => `<label class="choice"><input type="radio" name="${q.key}" value="${value}" aria-label="${label}" ${answers[q.key]===value?'checked':''}><span class="choice-body"><span class="choice-head"><span class="emoji" aria-hidden="true">${icon}</span><span class="check" aria-hidden="true">✓</span></span><strong>${label}</strong></span></label>`).join('');
    $('#back').disabled = step===0;
    $('#next').textContent = step===questions.length-1 ? '추천 메뉴 3개 보기' : '다음으로 →';
    updateSelection();
    if(focus) focusHeading('#questionTitle');
  }
  function updateSelection() {
    $('#next').disabled = !answers[questions[step].key];
    $('#selectionStatus').textContent = `${Object.keys(answers).length} / ${questions.length} 선택 완료`;
  }
  $('#choices').addEventListener('change', event => {
    if (!event.target.matches('input[type="radio"]')) return;
    answers[questions[step].key] = event.target.value;
    result = null; selected = null; round = 0;
    drawSteps(); updateSelection();
  });
  $('#back').addEventListener('click', () => { if(step>0){step--;drawQuestion();} });
  $('#next').addEventListener('click', () => {
    if(!answers[questions[step].key]) return;
    if(step<questions.length-1){step++;drawQuestion();} else showResults();
  });
  $('#steps').addEventListener('click', event => {
    const button = event.target.closest('button[data-step]');
    if(!button || button.disabled) return;
    step = Number(button.dataset.step); drawQuestion();
  });
  function showResults() {
    result = recommend(answers, round); selected = null;
    $('#quiz').hidden = true; $('#results').hidden = false; $('#final').hidden = true;
    $('#answerSummary').innerHTML = questions.map(q => {
      const option = q.options.find(o => o[0]===answers[q.key]);
      return `<span>${option[1]} ${escape(option[2])}</span>`;
    }).join('');
    $('#familyTitle').textContent = result.family.title;
    $('#reason').textContent = result.reason; $('#moodReason').textContent = result.moodReason;
    $('#cards').innerHTML = result.meals.map((meal,i) => {
      const photoAttrs = meal.photo
        ? `role="img" aria-label="${escape(meal.name)} 사진" style="--food-image:url('food-atlas-${String(meal.photo.sheet).padStart(2,'0')}.jpg');--food-position:${meal.photo.x}% ${meal.photo.y}%"`
        : '';
      return `<article class="meal-card" data-id="${meal.id}"><div class="meal-photo" ${photoAttrs}><div class="meal-overlay"><span class="meal-number">추천 0${i+1}${i===0?' · 먼저 추천':''}</span><h3>${escape(meal.name)}</h3><p>${escape(meal.description)}</p><button class="quiet" type="button" data-meal="${meal.id}" aria-pressed="false" aria-label="${escape(meal.name)} 선택">이 메뉴로 할래요</button></div></div></article>`;
    }).join('');
    $('#live').textContent = '선택에 맞는 같은 음식군의 메뉴 세 가지를 추천했어요.';
    focusHeading('#resultTitle');
  }
  $('#cards').addEventListener('click', event => {
    const button = event.target.closest('button[data-meal]');
    if(!button || !result) return;
    selected = result.meals.find(meal => meal.id===button.dataset.meal);
    if(!selected) return;
    document.querySelectorAll('.meal-card').forEach(card => {
      const chosen = card.dataset.id===selected.id;
      card.classList.toggle('chosen',chosen);
      const control = card.querySelector('button');
      control.setAttribute('aria-pressed',String(chosen)); control.textContent = chosen?'오늘 저녁으로 선택했어요 ✓':'이 메뉴로 할래요';
    });
    $('#final').hidden = false;
    $('#finalTitle').textContent = `오늘 저녁은 ${selected.name}!`;
    $('#finalDescription').textContent = `${selected.name}, 오늘 가장 끌리는 방식으로 즐겨보세요.${selected.ingredients.includes('완성된')?' 완성된 육수를 사용하는 기준이며, 육수를 직접 우리는 시간은 별도예요.':''}`;
    const tips = [`주요 재료: ${selected.ingredients}`,`계절에 어울리는 ${questions.find(q=>q.key==='season').options.find(o=>o[0]===answers.season)[2]} 별미예요.`,`메뉴의 재료와 양념은 취향에 맞게 준비해 주세요.`];
    $('#finalTips').innerHTML = `<ul>${tips.map(tip=>`<li>${escape(tip)}</li>`).join('')}</ul>`;
    $('#copy').textContent = '메뉴 복사하기'; $('#share').textContent = '친구에게 공유하기';
    $('#live').textContent = `오늘 저녁 메뉴를 선택했어요: ${selected.name}.`;
    focusHeading('#finalTitle');
  });
  $('#edit').addEventListener('click', () => {step=0;drawQuestion();});
  $('#more').addEventListener('click', () => {round++;showResults();});
  $('#restart').addEventListener('click', () => {step=0;answers={};result=null;selected=null;round=0;drawQuestion();});
  $('#reselect').addEventListener('click', () => { $('#final').hidden=true; $('#cards button').focus(); $('#cards').scrollIntoView({block:'center'}); });
  $('#copy').addEventListener('click', async () => {
    if(!selected) return;
    try { await navigator.clipboard.writeText(`오늘 저녁은 ${selected.name}!`); $('#copy').textContent='복사했어요 ✓'; $('#live').textContent='메뉴를 복사했어요.'; }
    catch { $('#live').textContent='복사하지 못했어요. 메뉴 이름을 직접 복사해 주세요.'; }
  });
  $('#share').addEventListener('click', async () => {
    if(!selected) return;
    const text = `오늘 저녁은 ${selected.name}! 너는 뭐 먹을래?`, url = location.origin+location.pathname;
    try {
      if(navigator.share) await navigator.share({title:'오늘 저녁 뭐 먹지?',text,url});
      else {await navigator.clipboard.writeText(text+' '+url);$('#share').textContent='공유 문구 복사 완료';}
    } catch(error) {if(error.name!=='AbortError') $('#live').textContent='공유하지 못했어요. 메뉴 복사하기를 이용해 주세요.';}
  });
  const partnerForm = $('#partnerForm');
  const partnerDialog = $('#partnerDialog');
  const openPartner = $('#openPartner');
  const closePartner = $('#closePartner');
  function hidePartnerDialog() {
    partnerDialog.hidden = true;
    document.body.classList.remove('partner-dialog-open');
    openPartner.focus();
  }
  openPartner.addEventListener('click', () => {
    partnerDialog.hidden = false;
    document.body.classList.add('partner-dialog-open');
    partnerForm.querySelector('input[name="name"]').focus();
  });
  closePartner.addEventListener('click', hidePartnerDialog);
  partnerDialog.addEventListener('click', event => {
    if (event.target === partnerDialog) hidePartnerDialog();
  });
  partnerDialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      hidePartnerDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...partnerDialog.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)')];
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  partnerForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = partnerForm.querySelector('button[type="submit"]');
    const status = $('#partnerStatus');
    button.disabled = true;
    status.textContent = '문의 내용을 보내고 있어요…';
    status.classList.remove('is-error', 'is-success');
    try {
      const response = await fetch(partnerForm.action, {
        method: 'POST',
        body: new FormData(partnerForm),
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Form submission failed');
      partnerForm.reset();
      status.textContent = '문의가 접수됐어요. 제휴 제안 감사합니다!';
      status.classList.add('is-success');
    } catch {
      status.textContent = '전송에 실패했어요. 잠시 후 다시 시도해 주세요.';
      status.classList.add('is-error');
    } finally {
      button.disabled = false;
    }
  });
  drawQuestion(false);
})();
