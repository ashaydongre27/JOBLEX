// ============================================================================
// Authentication Logic
// ============================================================================
let currentMode = 'login';
let selectedRole = 'student';

function setAuthMode(mode) {
  currentMode = mode;
  updateFormLayout();
}

function selectRole(role) {
  selectedRole = role;
  const roles = ['student', 'academy', 'industry'];
  roles.forEach(r => {
    const tab = document.getElementById(`tab-${r}`);
    if (tab) {
      if (r === role) {
        tab.className = "py-2 text-xs font-semibold rounded-lg transition border border-stone-900 dark:border-white bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs flex items-center justify-center gap-1.5";
      } else {
        tab.className = "py-2 text-xs font-semibold rounded-lg transition border border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white flex items-center justify-center gap-1.5";
      }
    }
  });

  const badge = document.getElementById('role-hint-badge');
  if (badge) {
    if (role === 'student') {
      badge.className = "text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#2D5542]/10 text-[#2D5542] dark:text-[#4EBA87] border border-[#2D5542]/20 dark:border-[#4EBA87]/20 flex items-center gap-1.5";
      badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-[#2D5542] dark:bg-[#4EBA87] animate-pulse"></span><span>Student / Scholar</span>';
    } else if (role === 'academy') {
      badge.className = "text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#855828]/10 text-[#855828] dark:text-[#D4973B] border border-[#855828]/20 dark:border-[#D4973B]/20 flex items-center gap-1.5";
      badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-[#855828] dark:bg-[#D4973B] animate-pulse"></span><span>Collegiate Academy</span>';
    } else {
      badge.className = "text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#944C23]/10 text-[#944C23] dark:text-[#E07A48] border border-[#944C23]/20 dark:border-[#E07A48]/20 flex items-center gap-1.5";
      badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-[#944C23] dark:bg-[#E07A48] animate-pulse"></span><span>Industry & Enterprise</span>';
    }
  }

  // Dynamic labels & input placeholders based on role
  const labelOrg = document.getElementById('label-org');
  const inputOrg = document.getElementById('input-org');
  const labelEmail = document.getElementById('label-email');
  const inputEmail = document.getElementById('input-email');
  const fieldDept = document.getElementById('field-dept-container');
  const labelDept = document.getElementById('label-dept');
  const inputDept = document.getElementById('input-dept');
  const fieldIndustryUid = document.getElementById('field-industry-uid');
  const labelTerms = document.getElementById('label-terms');
  const resetModalTitle = document.getElementById('reset-modal-title');
  const resetModalLabel = document.querySelector('label[for="reset-input-email"]');

  if (role === 'industry') {
    if (labelOrg) labelOrg.innerHTML = 'Company Name <span class="text-rose-500">*</span>';
    if (inputOrg) inputOrg.placeholder = 'Enter company or enterprise name';
    if (labelEmail) labelEmail.innerHTML = 'Company Email Address <span class="text-rose-500">*</span>';
    if (inputEmail) inputEmail.placeholder = 'name@company.com';
    if (fieldDept) fieldDept.classList.add('hidden');
    if (fieldIndustryUid) {
      if (currentMode === 'register') fieldIndustryUid.classList.remove('hidden');
      else fieldIndustryUid.classList.add('hidden');
    }
    if (labelTerms) labelTerms.textContent = 'I certify my authorized corporate affiliation and enterprise representation.';
    if (resetModalTitle) resetModalTitle.textContent = 'Reset Corporate Password';
    if (resetModalLabel) resetModalLabel.innerHTML = 'Registered Corporate Email <span class="text-rose-500">*</span>';
  } else {
    if (labelOrg) labelOrg.innerHTML = 'College / Institution <span class="text-rose-500">*</span>';
    if (inputOrg) inputOrg.placeholder = 'Enter college or university';
    if (labelEmail) labelEmail.innerHTML = 'Institutional Email Address <span class="text-rose-500">*</span>';
    if (inputEmail) inputEmail.placeholder = 'name@institution.edu';
    if (fieldIndustryUid) fieldIndustryUid.classList.add('hidden');
    if (currentMode === 'register') {
      if (fieldDept) fieldDept.classList.remove('hidden');
    } else {
      if (fieldDept) fieldDept.classList.add('hidden');
    }
    if (labelDept) labelDept.textContent = 'Department / Faculty';
    if (inputDept) inputDept.placeholder = role === 'student' ? 'Enter department (e.g. Computer Science)' : 'Enter faculty or department';
    if (labelTerms) labelTerms.textContent = 'I certify my institutional affiliation under academic accreditation and statutory guidelines.';
    if (resetModalTitle) resetModalTitle.textContent = 'Reset Institutional Password';
    if (resetModalLabel) resetModalLabel.innerHTML = 'Registered Institutional Email <span class="text-rose-500">*</span>';
  }

  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.querySelector('span').textContent = currentMode === 'login'
      ? `Authenticate to ${capitalize(role)} Portal ➔`
      : `Create & Register ${capitalize(role)} Account ➔`;
  }

  const switchPrompt = document.getElementById('switch-mode-prompt');
  if (switchPrompt) {
    if (currentMode === 'login') {
      switchPrompt.textContent = role === 'industry' ? "Need a corporate partner account?" : "Need an institutional account?";
    } else {
      switchPrompt.textContent = role === 'industry' ? "Already have a corporate account?" : "Already have an institutional account?";
    }
  }

  updateFormLayout();
}

function updateFormLayout() {
  const formGrid = document.getElementById('form-columns-container');
  const mainWrapper = document.getElementById('auth-main-wrapper');
  const fieldName = document.getElementById('field-name-container');
  const fieldOrg = document.getElementById('field-org-container');
  const fieldDept = document.getElementById('field-dept-container');
  const fieldIndustryUid = document.getElementById('field-industry-uid');
  const registerTerms = document.getElementById('register-terms');
  const passwordContainer = document.getElementById('field-password-container');
  const emailContainer = document.getElementById('field-email-container');
  const confirmPassContainer = document.getElementById('confirm-password-container');
  const confirmPassInput = document.getElementById('input-confirm-password');
  const labelPassword = document.getElementById('label-password');
  const submitBtn = document.getElementById('submit-btn');
  const switchPrompt = document.getElementById('switch-mode-prompt');
  const switchAction = document.getElementById('switch-mode-action');
  const forgotPassBtn = document.getElementById('login-forgot-pass');
  const roleSelectorLabel = document.getElementById('role-selector-label');
  const btnLogin = document.getElementById('btn-mode-login');
  const btnRegister = document.getElementById('btn-mode-register');

  const activeModeClass = "py-2 text-xs font-semibold rounded-lg transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer";
  const inactiveModeClass = "py-2 text-xs font-semibold rounded-lg transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 cursor-pointer bg-transparent";

  if (currentMode === 'login') {
    if (btnLogin) btnLogin.className = activeModeClass;
    if (btnRegister) btnRegister.className = inactiveModeClass;
    // Restore compact size for Sign In page (max-w-lg)
    if (mainWrapper) mainWrapper.className = "w-full max-w-lg mx-auto px-4 py-8 flex-1 flex items-center justify-center relative z-10 transition-all duration-300";
    if (formGrid) formGrid.className = "space-y-3.5";

    // In Login mode: Email and Password sit in single stacked column
    if (formGrid) {
      if (emailContainer) formGrid.appendChild(emailContainer);
      if (passwordContainer) formGrid.appendChild(passwordContainer);
    }

    if (fieldName) fieldName.classList.add('hidden');
    if (fieldOrg) fieldOrg.classList.add('hidden');
    if (fieldDept) fieldDept.classList.add('hidden');
    if (fieldIndustryUid) fieldIndustryUid.classList.add('hidden');
    if (confirmPassContainer) confirmPassContainer.classList.add('hidden');
    if (confirmPassInput) confirmPassInput.removeAttribute('required');

    if (emailContainer) emailContainer.classList.remove('hidden');
    if (passwordContainer) passwordContainer.classList.remove('hidden');

    if (registerTerms) registerTerms.classList.add('hidden');
    if (forgotPassBtn) forgotPassBtn.classList.remove('hidden');
    if (labelPassword) labelPassword.innerHTML = 'Password <span class="text-rose-500">*</span>';
    if (roleSelectorLabel) roleSelectorLabel.textContent = 'Sign In Portal:';
    if (submitBtn) {
      submitBtn.className = "w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-950 font-semibold text-xs tracking-wide shadow-xs transition-all duration-150 mt-3 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]";
      submitBtn.querySelector('span').textContent = `Authenticate to ${capitalize(selectedRole)} Portal ➔`;
    }
    if (switchPrompt) switchPrompt.textContent = selectedRole === 'industry' ? "Need a corporate partner account?" : "Need an institutional account?";
    if (switchAction) switchAction.textContent = "Register Here";
  } else {
    if (btnRegister) btnRegister.className = activeModeClass;
    if (btnLogin) btnLogin.className = inactiveModeClass;
    // 2-column linear grid for Create Account (Register) mode
    if (mainWrapper) mainWrapper.className = "w-full max-w-2xl md:max-w-[760px] mx-auto px-4 py-8 flex-1 flex items-center justify-center relative z-10 transition-all duration-300";
    if (formGrid) formGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-4 items-start";

    // In Register mode: Append 6 fields directly into formGrid in exact row pairs:
    // Row 1: Name (Left) | Org/Company (Right)
    // Row 2: Dept or Employee UID (Left) | Email (Right)
    // Row 3: Create Password (Left) | Confirm Password (Right)
    if (formGrid) {
      if (fieldName) {
        fieldName.classList.remove('hidden');
        formGrid.appendChild(fieldName);
      }
      if (fieldOrg) {
        fieldOrg.classList.remove('hidden');
        formGrid.appendChild(fieldOrg);
      }

      if (selectedRole === 'industry') {
        if (fieldDept) fieldDept.classList.add('hidden');
        if (fieldIndustryUid) {
          fieldIndustryUid.classList.remove('hidden');
          formGrid.appendChild(fieldIndustryUid);
        }
      } else {
        if (fieldIndustryUid) fieldIndustryUid.classList.add('hidden');
        if (fieldDept) {
          fieldDept.classList.remove('hidden');
          formGrid.appendChild(fieldDept);
        }
      }

      if (emailContainer) {
        emailContainer.classList.remove('hidden');
        formGrid.appendChild(emailContainer);
      }
      if (passwordContainer) {
        passwordContainer.classList.remove('hidden');
        formGrid.appendChild(passwordContainer);
      }
      if (confirmPassContainer) {
        confirmPassContainer.classList.remove('hidden');
        formGrid.appendChild(confirmPassContainer);
      }
    }

    if (confirmPassInput) confirmPassInput.setAttribute('required', 'required');
    if (registerTerms) registerTerms.classList.remove('hidden');
    if (forgotPassBtn) forgotPassBtn.classList.add('hidden');
    if (labelPassword) labelPassword.innerHTML = 'Create Password <span class="text-rose-500">*</span>';
    if (roleSelectorLabel) roleSelectorLabel.textContent = 'REGISTRATION PORTAL:';
    if (submitBtn) {
      submitBtn.className = "w-full py-3.5 rounded-xl bg-white text-[#070709] dark:bg-[#F4F4F6] dark:text-[#070709] font-bold text-xs sm:text-sm hover:bg-stone-100 transition-all tactile-btn shadow-md flex items-center justify-center gap-2 cursor-pointer";
      submitBtn.querySelector('span').textContent = `Create & Register ${capitalize(selectedRole)} Account ➔`;
    }
    if (switchPrompt) switchPrompt.textContent = selectedRole === 'industry' ? "Already have a corporate account?" : "Already have an institutional account?";
    if (switchAction) switchAction.textContent = "Sign In Here";
  }
}

function toggleAuthMode() {
  setAuthMode(currentMode === 'login' ? 'register' : 'login');
}

function openForgotPasswordModal() {
  const currentEmail = (document.getElementById('input-email')?.value || '').trim();
  const resetInput = document.getElementById('reset-input-email');
  if (resetInput && currentEmail) {
    resetInput.value = currentEmail;
  }
  const statusDiv = document.getElementById('reset-modal-status');
  if (statusDiv) {
    statusDiv.className = 'hidden text-xs p-3 rounded-xl border';
    statusDiv.textContent = '';
  }
  const modal = document.getElementById('forgot-password-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => resetInput?.focus(), 50);
  }
}

function closeForgotPasswordModal() {
  const modal = document.getElementById('forgot-password-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function handleForgotPasswordSubmit(event) {
  event.preventDefault();
  const email = (document.getElementById('reset-input-email')?.value || '').trim();
  const submitBtn = document.getElementById('reset-submit-btn');
  const statusDiv = document.getElementById('reset-modal-status');

  if (!email) {
    const msg = selectedRole === 'industry' ? 'Please enter your corporate email address.' : 'Please enter your institutional email address.';
    if (statusDiv) {
      statusDiv.className = 'text-xs p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 dark:text-rose-400 block';
      statusDiv.textContent = msg;
    }
    if (window.showToast) window.showToast(msg, 'Password Recovery', 'warning');
    return;
  }

  submitBtn.disabled = true;
  const originalText = submitBtn.querySelector('span').textContent;
  submitBtn.querySelector('span').textContent = 'Dispatching Link...';

  if (statusDiv) {
    statusDiv.className = 'hidden text-xs p-3 rounded-xl border';
    statusDiv.textContent = '';
  }

  try {
    const res = await JoblexApiClient.resetPassword(email);
    if (statusDiv) {
      statusDiv.className = 'text-xs p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 block';
      statusDiv.textContent = res.message || `Password recovery link dispatched to ${email}. Check your inbox or spam folder.`;
    }
    if (window.showToast) {
      window.showToast(`Password recovery link dispatched to ${email}.`, 'Password Recovery', 'success');
    }
    setTimeout(() => {
      closeForgotPasswordModal();
    }, 2200);
  } catch (err) {
    if (statusDiv) {
      statusDiv.className = 'text-xs p-3 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 block';
      statusDiv.textContent = err.message || 'Failed to dispatch recovery email. Please check your address and try again.';
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = originalText;
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showAuthError(msg) {
  const banner = document.getElementById('auth-error-banner');
  const bannerText = document.getElementById('auth-error-banner-text');
  if (banner && bannerText) {
    bannerText.textContent = msg;
    banner.classList.remove('hidden');
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  if (window.showToast) {
    window.showToast(msg, 'Authentication Notice', 'error');
  }
}

function clearAuthError() {
  const banner = document.getElementById('auth-error-banner');
  if (banner) banner.classList.add('hidden');
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  clearAuthError();
  const email = document.getElementById('input-email').value.trim();
  const password = document.getElementById('input-password').value;
  const submitBtn = document.getElementById('submit-btn');

  if (!email || !password) {
    showAuthError('Please provide both email address and password.');
    return;
  }

  const originalText = submitBtn.querySelector('span').textContent;
  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Authenticating...';

  try {
    if (currentMode === 'login') {
      const res = await JoblexApiClient.login(email, password, selectedRole);
      let redirect = new URLSearchParams(window.location.search).get('redirect');

      // Handle onboarding gate for students
      if (res.user.role === 'student' && !(res.user.isOnboardingCompleted ?? res.user.onboarding_completed)) {
        redirect = '/onboarding';
      } else if (!redirect) {
        redirect = `${res.user.role}.html`;
      } else if (!redirect.startsWith('/') && !redirect.startsWith('http') && !redirect.startsWith('src/')) {
        redirect = '/' + redirect;
      }
      window.location.href = redirect;
    } else {
      const name = document.getElementById('input-name').value.trim();
      const org = document.getElementById('input-org').value.trim();
      const confirmPassword = document.getElementById('input-confirm-password').value;
      const termsAgreed = document.getElementById('terms-agree').checked;
      const dept = document.getElementById('input-dept')?.value.trim() || '';
      const orgLabel = selectedRole === 'industry' ? 'Company Name' : 'College / Institution';

      if (!termsAgreed) {
        showAuthError('Please check the certification box first to create your account.');
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = originalText;
        document.getElementById('terms-agree').focus();
        return;
      }

      if (!name || !org) {
        showAuthError(`Full Legal Name and ${orgLabel} are required for registration.`);
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = originalText;
        return;
      }

      let empUid = null;
      if (selectedRole === 'industry') {
        empUid = document.getElementById('input-employee-uid')?.value.trim();
        if (!empUid) {
          showAuthError('Employee UID / ID No. is required for corporate registration.');
          submitBtn.disabled = false;
          submitBtn.querySelector('span').textContent = originalText;
          return;
        }
      }

      if (password !== confirmPassword) {
        showAuthError('Passwords do not match. Please ensure both passwords match before registering.');
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = originalText;
        return;
      }

      if (password.length < 6) {
        showAuthError('Password must be at least 6 characters long.');
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = originalText;
        return;
      }

      const userData = {
        name,
        email,
        password,
        role: selectedRole,
        institution: selectedRole === 'industry' ? null : org,
        company: selectedRole === 'industry' ? org : null,
        employee_uid: empUid,
        employee_id: empUid,
        department: selectedRole === 'industry' ? null : (dept || (selectedRole === 'student' ? 'General Academic Studies' : 'Academic Faculty')),
        year: selectedRole === 'student' ? '1st Year Undergraduate' : null,
        designation: selectedRole === 'academy' ? 'Faculty Researcher' : (selectedRole === 'industry' ? 'Industry Representative' : null)
      };

      const res = await JoblexApiClient.register(userData);
      let redirect = new URLSearchParams(window.location.search).get('redirect');

      // New students always go to onboarding first
      if (res.user.role === 'student' && !(res.user.isOnboardingCompleted ?? res.user.onboarding_completed)) {
        redirect = '/onboarding';
      } else if (!redirect) {
        redirect = `${res.user.role}.html`;
      } else if (!redirect.startsWith('/') && !redirect.startsWith('http') && !redirect.startsWith('src/')) {
        redirect = '/' + redirect;
      }
      window.location.href = redirect;
    }
  } catch (err) {
    let msg = err.message || 'Authentication error. Please check your credentials.';
    if (msg.includes('Unexpected token') || msg.includes('not valid JSON') || msg.includes('non-JSON') || msg.includes('The page could not be found')) {
      msg = 'Authentication failed. Please verify your credentials or register a new account.';
    }
    showAuthError(msg);
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = originalText;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = urlParams.get('role');
  if (roleParam && ['student', 'academy', 'industry'].includes(roleParam.toLowerCase())) {
    selectRole(roleParam.toLowerCase());
  } else {
    selectRole('student');
  }

  const modeParam = urlParams.get('mode');
  if (modeParam && ['login', 'register'].includes(modeParam.toLowerCase())) {
    setAuthMode(modeParam.toLowerCase());
  } else {
    setAuthMode('login');
  }

  // Close modal on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeForgotPasswordModal();
  });

  // Close modal on backdrop click
  const modalBackdrop = document.getElementById('forgot-password-modal');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeForgotPasswordModal();
    });
  }
});