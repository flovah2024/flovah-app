/* ========================================
   FLOVAH - Project Spec App
   ======================================== */

(function () {
  'use strict';

  const TOTAL_STEPS = 5;
  let currentStep = 1;
  let uploadedFiles = [];

  // DOM Elements
  const progressFill = document.getElementById('progressFill');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const navButtons = document.getElementById('navButtons');
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileInput = document.getElementById('fileUpload');
  const fileList = document.getElementById('fileList');

  // ========================================
  // Step Navigation
  // ========================================

  window.changeStep = function (direction) {
    if (direction === 1 && !validateCurrentStep()) return;

    const newStep = currentStep + direction;
    if (newStep < 1 || newStep > TOTAL_STEPS + 1) return;

    // If on last step and going forward, submit
    if (currentStep === TOTAL_STEPS && direction === 1) {
      submitForm();
      return;
    }

    currentStep = newStep;
    updateUI();
    saveToLocalStorage();
  };

  function updateUI() {
    // Update form steps
    document.querySelectorAll('.form-step').forEach(function (step) {
      step.classList.remove('active');
    });
    var activeStepEl = document.getElementById('step' + currentStep);
    if (activeStepEl) activeStepEl.classList.add('active');

    // Update progress bar
    progressFill.style.width = (currentStep / TOTAL_STEPS * 100) + '%';

    // Update step indicators
    document.querySelectorAll('.step').forEach(function (step) {
      var stepNum = parseInt(step.dataset.step);
      step.classList.remove('active', 'completed');
      if (stepNum === currentStep) {
        step.classList.add('active');
      } else if (stepNum < currentStep) {
        step.classList.add('completed');
      }
    });

    // Update buttons
    prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';

    if (currentStep === TOTAL_STEPS) {
      nextBtn.textContent = '제출하기';
      nextBtn.classList.add('submit');
    } else {
      nextBtn.textContent = '다음 단계';
      nextBtn.classList.remove('submit');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ========================================
  // Validation
  // ========================================

  function validateCurrentStep() {
    clearErrors();
    var isValid = true;

    if (currentStep === 1) {
      isValid = validateRequired('clientName', '담당자 이름을 입력해주세요.')
        & validateRequired('companyName', '회사/브랜드명을 입력해주세요.')
        & validateEmail('email')
    } else if (currentStep === 2) {
      isValid = validateRequired('projectName', '프로젝트명을 입력해주세요.')
        & validateCheckboxGroup('projectType', '프로젝트 유형을 선택해주세요.')
        & validateRequired('projectGoal', '프로젝트 목적을 입력해주세요.');
    } else if (currentStep === 3) {
      isValid = validateRequired('coreFeatures', '핵심 기능/요구사항을 입력해주세요.');
    } else if (currentStep === 4) {
      isValid = validateRequired('budget', '예산 범위를 선택해주세요.');
    } else if (currentStep === 5) {
      isValid = validateCheckbox('agreePrivacy', '개인정보 수집 동의가 필요합니다.');
    }

    return !!isValid;
  }

  function validateRequired(fieldId, message) {
    var field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      showError(field, message);
      return false;
    }
    return true;
  }

  function validateEmail(fieldId) {
    var field = document.getElementById(fieldId);
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!field.value.trim()) {
      showError(field, '이메일을 입력해주세요.');
      return false;
    }
    if (!emailRegex.test(field.value.trim())) {
      showError(field, '올바른 이메일 형식을 입력해주세요.');
      return false;
    }
    return true;
  }

  function validateCheckboxGroup(name, message) {
    var checkboxes = document.querySelectorAll('input[name="' + name + '"]');
    var checked = Array.from(checkboxes).some(function (cb) { return cb.checked; });
    if (!checked) {
      var group = checkboxes[0].closest('.form-group');
      showGroupError(group, message);
      return false;
    }
    return true;
  }

  function validateCheckbox(fieldId, message) {
    var field = document.getElementById(fieldId);
    if (!field.checked) {
      var group = field.closest('.form-group');
      showGroupError(group, message);
      return false;
    }
    return true;
  }

  function showError(field, message) {
    var group = field.closest('.form-group');
    group.classList.add('error');
    var errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    group.appendChild(errorEl);
    field.focus();
  }

  function showGroupError(group, message) {
    group.classList.add('error');
    var errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    group.appendChild(errorEl);
  }

  function clearErrors() {
    document.querySelectorAll('.form-group.error').forEach(function (group) {
      group.classList.remove('error');
    });
    document.querySelectorAll('.error-message').forEach(function (el) {
      el.remove();
    });
  }

  // ========================================
  // File Upload
  // ========================================

  if (fileUploadArea) {
    fileUploadArea.addEventListener('click', function () {
      fileInput.click();
    });

    fileUploadArea.addEventListener('dragover', function (e) {
      e.preventDefault();
      fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', function () {
      fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', function (e) {
      e.preventDefault();
      fileUploadArea.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', function () {
      handleFiles(fileInput.files);
    });
  }

  function handleFiles(files) {
    var maxSize = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach(function (file) {
      if (file.size > maxSize) {
        showToast(file.name + ' 파일이 10MB를 초과합니다.');
        return;
      }
      uploadedFiles.push(file);
    });

    renderFileList();
  }

  function renderFileList() {
    fileList.innerHTML = '';
    uploadedFiles.forEach(function (file, index) {
      var item = document.createElement('div');
      item.className = 'file-item';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'file-item-name';
      nameSpan.textContent = file.name + ' (' + formatFileSize(file.size) + ')';

      var removeBtn = document.createElement('button');
      removeBtn.className = 'file-item-remove';
      removeBtn.textContent = '\u00d7';
      removeBtn.setAttribute('type', 'button');
      removeBtn.addEventListener('click', function () {
        uploadedFiles.splice(index, 1);
        renderFileList();
      });

      item.appendChild(nameSpan);
      item.appendChild(removeBtn);
      fileList.appendChild(item);
    });
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ========================================
  // Form Submission
  // ========================================

  function submitForm() {
    var data = collectFormData();

    // Show loading
    nextBtn.disabled = true;
    nextBtn.innerHTML = '<span class="spinner"></span> 제출 중...';

    // Simulate submission (replace with actual API call)
    setTimeout(function () {
      showCompletePage(data);
      saveSubmission(data);
      localStorage.removeItem('flovah_draft');
    }, 1200);
  }

  function collectFormData() {
    var projectTypes = [];
    document.querySelectorAll('input[name="projectType"]:checked').forEach(function (cb) {
      projectTypes.push(cb.value);
    });

    var techReqs = [];
    document.querySelectorAll('input[name="techReq"]:checked').forEach(function (cb) {
      techReqs.push(cb.value);
    });

    var maintenance = '';
    var maintenanceEl = document.querySelector('input[name="maintenance"]:checked');
    if (maintenanceEl) maintenance = maintenanceEl.value;

    return {
      // Step 1
      clientName: document.getElementById('clientName').value.trim(),
      companyName: document.getElementById('companyName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      contactMethod: document.getElementById('contactMethod').value,

      // Step 2
      projectName: document.getElementById('projectName').value.trim(),
      projectTypes: projectTypes,
      projectGoal: document.getElementById('projectGoal').value.trim(),
      targetAudience: document.getElementById('targetAudience').value.trim(),

      // Step 3
      coreFeatures: document.getElementById('coreFeatures').value.trim(),
      additionalFeatures: document.getElementById('additionalFeatures').value.trim(),
      designRef: document.getElementById('designRef').value.trim(),
      techReqs: techReqs,

      // Step 4
      startDate: document.getElementById('startDate').value,
      deadline: document.getElementById('deadline').value,
      budget: document.getElementById('budget').value,
      maintenance: maintenance,

      // Step 5
      existingAssets: document.getElementById('existingAssets').value.trim(),
      competitors: document.getElementById('competitors').value.trim(),
      additionalNotes: document.getElementById('additionalNotes').value.trim(),
      files: uploadedFiles.map(function (f) { return f.name; }),

      // Meta
      submittedAt: new Date().toISOString()
    };
  }

  function showCompletePage(data) {
    // Hide all steps and nav
    document.querySelectorAll('.form-step').forEach(function (step) {
      step.classList.remove('active');
    });
    document.getElementById('stepComplete').classList.add('active');
    navButtons.style.display = 'none';
    document.querySelector('.progress-container').style.display = 'none';

    // Build summary
    var typeLabels = {
      web: '웹사이트', app: '모바일 앱', design: 'UI/UX 디자인',
      branding: '브랜딩', marketing: '마케팅/광고', video: '영상/콘텐츠', other: '기타'
    };
    var budgetLabels = {
      'under500': '500만원 미만', '500to1000': '500만원 ~ 1,000만원',
      '1000to3000': '1,000만원 ~ 3,000만원', '3000to5000': '3,000만원 ~ 5,000만원',
      '5000to1억': '5,000만원 ~ 1억', 'over1억': '1억 이상', 'discuss': '협의 필요'
    };

    var projectTypeText = data.projectTypes.map(function (t) {
      return typeLabels[t] || t;
    }).join(', ');

    var summaryHTML = ''
      + summaryRow('담당자', data.clientName)
      + summaryRow('회사/브랜드', data.companyName)
      + summaryRow('이메일', data.email)
      + summaryRow('프로젝트명', data.projectName)
      + summaryRow('프로젝트 유형', projectTypeText)
      + summaryRow('예산 범위', budgetLabels[data.budget] || data.budget)
      + summaryRow('제출 일시', new Date(data.submittedAt).toLocaleString('ko-KR'));

    document.getElementById('completeSummary').innerHTML = summaryHTML;
  }

  function summaryRow(label, value) {
    if (!value) return '';
    return '<div class="summary-item">'
      + '<span class="summary-label">' + label + '</span>'
      + '<span class="summary-value">' + escapeHtml(value) + '</span>'
      + '</div>';
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========================================
  // Local Storage (Draft Saving)
  // ========================================

  function saveToLocalStorage() {
    try {
      var data = collectFormData();
      data._currentStep = currentStep;
      localStorage.setItem('flovah_draft', JSON.stringify(data));
    } catch (e) {
      // Silent fail
    }
  }

  function loadFromLocalStorage() {
    try {
      var saved = localStorage.getItem('flovah_draft');
      if (!saved) return;

      var data = JSON.parse(saved);

      // Restore text fields
      var textFields = [
        'clientName', 'companyName', 'email', 'phone',
        'projectName', 'projectGoal', 'targetAudience',
        'coreFeatures', 'additionalFeatures', 'designRef',
        'startDate', 'deadline',
        'existingAssets', 'competitors', 'additionalNotes'
      ];

      textFields.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && data[id]) el.value = data[id];
      });

      // Restore selects
      if (data.contactMethod) document.getElementById('contactMethod').value = data.contactMethod;
      if (data.budget) document.getElementById('budget').value = data.budget;

      // Restore checkboxes
      if (data.projectTypes) {
        data.projectTypes.forEach(function (val) {
          var cb = document.querySelector('input[name="projectType"][value="' + val + '"]');
          if (cb) cb.checked = true;
        });
      }
      if (data.techReqs) {
        data.techReqs.forEach(function (val) {
          var cb = document.querySelector('input[name="techReq"][value="' + val + '"]');
          if (cb) cb.checked = true;
        });
      }

      // Restore radio
      if (data.maintenance) {
        var radio = document.querySelector('input[name="maintenance"][value="' + data.maintenance + '"]');
        if (radio) radio.checked = true;
      }

      // Restore step
      if (data._currentStep && data._currentStep <= TOTAL_STEPS) {
        currentStep = data._currentStep;
        updateUI();
      }

      showToast('이전에 작성하던 내용을 불러왔습니다.');
    } catch (e) {
      // Silent fail
    }
  }

  function saveSubmission(data) {
    try {
      var submissions = JSON.parse(localStorage.getItem('flovah_submissions') || '[]');
      submissions.push(data);
      localStorage.setItem('flovah_submissions', JSON.stringify(submissions));
    } catch (e) {
      // Silent fail
    }
  }

  // Auto-save on input
  document.addEventListener('input', debounce(function () {
    saveToLocalStorage();
  }, 1000));

  function debounce(fn, delay) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  // ========================================
  // Toast Notification
  // ========================================

  function showToast(message) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () {
        toast.remove();
      }, 400);
    }, 3000);
  }

  // ========================================
  // Keyboard Navigation
  // ========================================

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (currentStep <= TOTAL_STEPS) {
        changeStep(1);
      }
    }
  });

  // ========================================
  // Initialize
  // ========================================

  loadFromLocalStorage();
  updateUI();

})();
