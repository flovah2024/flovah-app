/* ========================================
   FLOVAH - Sequence-style Spec App
   ======================================== */

(function () {
  'use strict';

  var TOTAL = 16;
  var current = -1; // -1 = intro
  var screens = [];
  var data = {};

  // Collect all screens
  var introScreen = document.getElementById('introScreen');
  var completeScreen = document.getElementById('completeScreen');
  for (var i = 0; i < TOTAL; i++) {
    screens.push(document.getElementById('q' + i));
  }

  var navBar = document.getElementById('navBar');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var navCounter = document.getElementById('navCounter');
  var navFill = document.getElementById('navProgressFill');

  // ========================================
  // Screen Transitions (Dissolve)
  // ========================================

  function getActiveScreen() {
    if (current === -1) return introScreen;
    if (current >= TOTAL) return completeScreen;
    return screens[current];
  }

  function goTo(index) {
    var prev = getActiveScreen();

    current = index;

    var next = getActiveScreen();

    // Dissolve out
    prev.classList.remove('active');
    prev.classList.add('dissolve-out');

    // Dissolve in
    setTimeout(function () {
      next.classList.remove('dissolve-out');
      next.classList.add('active');

      // Focus input
      var input = next.querySelector('.q-input, .q-textarea');
      if (input) {
        setTimeout(function () { input.focus(); }, 300);
      }
    }, 200);

    // Clean up old
    setTimeout(function () {
      prev.classList.remove('dissolve-out');
    }, 900);

    updateNav();
  }

  function updateNav() {
    if (current < 0 || current >= TOTAL) {
      navBar.style.display = 'none';
      return;
    }

    navBar.style.display = 'block';
    prevBtn.disabled = current === 0;
    navCounter.textContent = (current + 1) + ' / ' + TOTAL;
    navFill.style.width = ((current + 1) / TOTAL * 100) + '%';

    if (current === TOTAL - 1) {
      nextBtn.innerHTML = '제출 <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      nextBtn.classList.add('submit-btn');
    } else {
      nextBtn.innerHTML = '다음 <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      nextBtn.classList.remove('submit-btn');
    }
  }

  // ========================================
  // Option Buttons
  // ========================================

  // Single select options
  document.querySelectorAll('.q-options.single .q-option, #contactOptions .q-option').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var group = btn.closest('.q-options');
      group.querySelectorAll('.q-option').forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');

      // Store value in hidden input
      var hidden = btn.closest('.q-inner').querySelector('input[type="hidden"]');
      if (hidden) hidden.value = btn.dataset.value;
    });
  });

  // Multi select options
  document.querySelectorAll('.q-options.multi .q-option').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.classList.toggle('selected');
    });
  });

  // ========================================
  // Validation
  // ========================================

  function validate() {
    var screen = screens[current];
    if (!screen) return true;

    var required = screen.dataset.required === 'true';
    if (!required) return true;

    var errorEl = screen.querySelector('.q-error');
    if (errorEl) errorEl.textContent = '';

    // Text/email inputs
    var input = screen.querySelector('.q-input:not([type="hidden"]):not([type="date"])');
    if (input) {
      if (!input.value.trim()) {
        if (errorEl) errorEl.textContent = '이 항목은 필수입니다.';
        input.focus();
        return false;
      }
      if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        if (errorEl) errorEl.textContent = '올바른 이메일 형식을 입력해주세요.';
        input.focus();
        return false;
      }
    }

    // Textarea
    var textarea = screen.querySelector('.q-textarea');
    if (textarea && !input) {
      if (!textarea.value.trim()) {
        if (errorEl) errorEl.textContent = '이 항목은 필수입니다.';
        textarea.focus();
        return false;
      }
    }

    // Option buttons (single or multi)
    var options = screen.querySelector('.q-options');
    if (options && !input && !textarea) {
      var selected = options.querySelectorAll('.q-option.selected');
      if (selected.length === 0) {
        if (errorEl) errorEl.textContent = '하나 이상 선택해주세요.';
        return false;
      }
    }

    return true;
  }

  // ========================================
  // Navigation
  // ========================================

  function goNext() {
    if (current >= 0 && !validate()) return;

    if (current === TOTAL - 1) {
      submit();
      return;
    }

    goTo(current + 1);
  }

  function goPrev() {
    if (current <= 0) return;
    goTo(current - 1);
  }

  // Button listeners
  document.getElementById('startBtn').addEventListener('click', function () {
    goTo(0);
  });

  nextBtn.addEventListener('click', goNext);
  prevBtn.addEventListener('click', goPrev);

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (current < 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        goTo(0);
      }
      return;
    }
    if (current >= TOTAL) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      var active = document.activeElement;
      if (active && active.tagName === 'TEXTAREA') return; // allow newlines
      e.preventDefault();
      goNext();
    }
  });

  // Swipe support for mobile
  var touchStartY = 0;
  document.addEventListener('touchstart', function (e) {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (current < 0 || current >= TOTAL) return;
    var diff = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goNext();
      else goPrev();
    }
  }, { passive: true });

  // ========================================
  // Submit
  // ========================================

  function collectData() {
    var types = [];
    document.querySelectorAll('#typeOptions .q-option.selected').forEach(function (b) {
      types.push(b.dataset.value);
    });

    return {
      clientName: document.getElementById('clientName').value.trim(),
      companyName: document.getElementById('companyName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      contactMethod: document.getElementById('contactMethod').value,
      projectName: document.getElementById('projectName').value.trim(),
      projectTypes: types,
      projectGoal: document.getElementById('projectGoal').value.trim(),
      targetAudience: document.getElementById('targetAudience').value.trim(),
      coreFeatures: document.getElementById('coreFeatures').value.trim(),
      additionalFeatures: document.getElementById('additionalFeatures').value.trim(),
      designRef: document.getElementById('designRef').value.trim(),
      budget: document.getElementById('budget').value,
      startDate: document.getElementById('startDate').value,
      deadline: document.getElementById('deadline').value,
      maintenance: document.getElementById('maintenance').value,
      additionalNotes: document.getElementById('additionalNotes').value.trim(),
      submittedAt: new Date().toISOString()
    };
  }

  // ==========================================
  // Email: Web3Forms (gim@flovah.com)
  // ==========================================
  var WEB3FORMS_KEY = '273fa846-7819-42f7-96c3-63249dd6a2d5';

  function submit() {
    var d = collectData();

    nextBtn.disabled = true;
    nextBtn.textContent = '제출 중...';

    var typeLabels = {
      web: '웹사이트', app: '모바일 앱', design: 'UI/UX 디자인',
      branding: '브랜딩', marketing: '마케팅/광고', video: '영상/콘텐츠', other: '기타'
    };
    var budgetLabels = {
      under500: '500만원 미만', '500to1000': '500만원 ~ 1,000만원',
      '1000to3000': '1,000만원 ~ 3,000만원', '3000to5000': '3,000만원 ~ 5,000만원',
      '5000to1억': '5,000만원 ~ 1억', 'over1억': '1억 이상', discuss: '협의 필요'
    };

    var projectTypeText = d.projectTypes.map(function (t) { return typeLabels[t] || t; }).join(', ');
    var budgetText = budgetLabels[d.budget] || d.budget;

    var message = ''
      + '■ 기본 정보\n'
      + '담당자: ' + d.clientName + '\n'
      + '회사/브랜드: ' + d.companyName + '\n'
      + '이메일: ' + d.email + '\n'
      + '연락처: ' + (d.phone || '미입력') + '\n'
      + '선호 연락방식: ' + (d.contactMethod || '미선택') + '\n\n'
      + '■ 프로젝트 개요\n'
      + '프로젝트명: ' + d.projectName + '\n'
      + '유형: ' + projectTypeText + '\n'
      + '목적: ' + d.projectGoal + '\n'
      + '타겟 고객: ' + (d.targetAudience || '미입력') + '\n\n'
      + '■ 상세 스펙\n'
      + '핵심 기능:\n' + d.coreFeatures + '\n\n'
      + '추가 희망 기능:\n' + (d.additionalFeatures || '없음') + '\n\n'
      + '디자인 레퍼런스: ' + (d.designRef || '없음') + '\n\n'
      + '■ 일정 및 예산\n'
      + '예산: ' + budgetText + '\n'
      + '시작일: ' + (d.startDate || '미정') + '\n'
      + '완료일: ' + (d.deadline || '미정') + '\n'
      + '유지보수: ' + (d.maintenance || '미선택') + '\n\n'
      + '■ 추가 사항\n'
      + (d.additionalNotes || '없음');

    var body = {
      access_key: WEB3FORMS_KEY,
      subject: '[FLOVAH] 새 프로젝트 스펙 - ' + d.projectName + ' (' + d.companyName + ')',
      from_name: d.clientName + ' (' + d.companyName + ')',
      replyto: d.email,
      name: d.clientName,
      email: d.email,
      message: message
    };

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(function (res) { return res.json(); })
    .then(function (result) {
      showComplete(d);
      if (!result.success) console.warn('Email issue:', result);
    })
    .catch(function (err) {
      console.error('Submit error:', err);
      showComplete(d);
    })
    .finally(function () {
      try {
        var list = JSON.parse(localStorage.getItem('flovah_submissions') || '[]');
        list.push(d);
        localStorage.setItem('flovah_submissions', JSON.stringify(list));
      } catch (e) {}
    });
  }

  function showComplete(d) {
    var typeLabels = {
      web: '웹사이트', app: '모바일 앱', design: 'UI/UX 디자인',
      branding: '브랜딩', marketing: '마케팅/광고', video: '영상/콘텐츠', other: '기타'
    };
    var budgetLabels = {
      under500: '500만원 미만', '500to1000': '500만원 ~ 1,000만원',
      '1000to3000': '1,000만원 ~ 3,000만원', '3000to5000': '3,000만원 ~ 5,000만원',
      '5000to1억': '5,000만원 ~ 1억', 'over1억': '1억 이상', discuss: '협의 필요'
    };

    var html = '';
    html += row('담당자', d.clientName);
    html += row('회사', d.companyName);
    html += row('이메일', d.email);
    html += row('프로젝트', d.projectName);
    html += row('유형', d.projectTypes.map(function (t) { return typeLabels[t] || t; }).join(', '));
    html += row('예산', budgetLabels[d.budget] || d.budget);
    html += row('제출일', new Date(d.submittedAt).toLocaleString('ko-KR'));

    document.getElementById('completeSummary').innerHTML = html;
    goTo(TOTAL);
  }

  function row(label, value) {
    if (!value) return '';
    var safe = document.createElement('span');
    safe.textContent = value;
    return '<div class="summary-row"><span class="summary-label">' + label + '</span><span class="summary-value">' + safe.innerHTML + '</span></div>';
  }

})();
