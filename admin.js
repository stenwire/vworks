// SHA-256 hash of the admin password. Change by running:
//   echo -n 'yournewpassword' | shasum -a 256
// and replacing the string below. Never store the plaintext password here.
const ADMIN_PASSWORD_HASH = 'e6e4e250c1932503e4c2bc9b64e8f846e4ea0a6af8b2256018f7294b41588844';

async function hashPassword(password) {
  const encoded = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_CONTENT = {
  hero: {
    headline: { line1: 'Work.', line2: 'Sip.', line3: ' Game.' },
    subtext: "Olambe's boldest co-working hub — fast WiFi, cold brew, and PS5 stations under one roof."
  },
  services: {
    workspace: { title: 'Workspace', desc: 'Hot desks, private pods, and a buzzing open floor. Plug in, focus up.' },
    coffee:    { title: 'Coffee Spot', desc: 'Cold brew, espresso, and snacks to keep your workflow fuelled all day.' },
    gaming:    { title: 'PS5 Gaming', desc: 'Unwind between sessions on our PS5 stations. Book a slot or walk in.' }
  },
  hours: {
    mon: '8:00 AM – 7:00 PM',
    tue: '8:00 AM – 7:00 PM',
    wed: '8:00 AM – 7:00 PM',
    thu: '8:00 AM – 7:00 PM',
    fri: '8:00 AM – 7:00 PM',
    sat: '8:00 AM – 7:00 PM',
    sun: 'Closed'
  },
  visibility: { gallery: true, amenities: true }
};

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function deepMerge(base, override) {
  const result = Object.assign({}, base);
  for (const key of Object.keys(override)) {
    if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
      result[key] = deepMerge(base[key] || {}, override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

function loadContent() {
  try {
    const raw = localStorage.getItem('vworks_content');
    if (raw) return deepMerge(DEFAULT_CONTENT, JSON.parse(raw));
  } catch (_) {}
  return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
}

function showDashboard() {
  document.getElementById('auth-gate').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  loadContentIntoFields();
}

function loadContentIntoFields() {
  const content = loadContent();

  document.querySelectorAll('[data-field]').forEach(input => {
    const val = getNestedValue(content, input.dataset.field);
    if (val !== null && val !== undefined) input.value = val;
  });

  document.querySelectorAll('[data-toggle]').forEach(checkbox => {
    const key = checkbox.dataset.toggle;
    checkbox.checked = content.visibility && content.visibility[key] !== false;
  });
}

function validateFields() {
  const criticalFields = ['hero.headline.line1', 'hero.headline.line2', 'hero.subtext'];
  let valid = true;

  // Clear previous errors
  document.querySelectorAll('[data-field]').forEach(el => {
    el.classList.remove('invalid');
    const errEl = el.parentElement.querySelector('.field-error');
    if (errEl) errEl.remove();
  });

  criticalFields.forEach(fieldPath => {
    const el = document.querySelector(`[data-field="${fieldPath}"]`);
    if (el && el.value.trim() === '') {
      el.classList.add('invalid');
      const err = document.createElement('span');
      err.className = 'field-error';
      err.textContent = 'This field cannot be empty.';
      el.parentElement.appendChild(err);
      valid = false;
    }
  });

  return valid;
}

function saveContent() {
  if (!validateFields()) {
    showStatus('Please fill in all required fields.', 'error');
    return;
  }

  const content = loadContent();

  document.querySelectorAll('[data-field]').forEach(input => {
    setNestedValue(content, input.dataset.field, input.value.trim());
  });

  document.querySelectorAll('[data-toggle]').forEach(checkbox => {
    content.visibility[checkbox.dataset.toggle] = checkbox.checked;
  });

  try {
    localStorage.setItem('vworks_content', JSON.stringify(content));
    showStatus('Saved successfully!', 'success');
  } catch (_) {
    showStatus('Could not save — storage unavailable.', 'error');
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById('save-status');
  const saveBtn = document.getElementById('save-btn');

  statusEl.textContent = message;
  statusEl.className = 'save-status visible' + (type === 'error' ? ' error' : '');

  if (type === 'success') {
    saveBtn.disabled = true;
    setTimeout(() => {
      statusEl.classList.remove('visible');
      saveBtn.disabled = false;
    }, 2200);
  }
}

// ─── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Check if already authenticated
  try {
    if (localStorage.getItem('vworks_admin_auth') === 'true') {
      showDashboard();
    }
  } catch (_) {}

  // Auth
  const passwordInput = document.getElementById('admin-password');
  const loginBtn = document.getElementById('login-btn');
  const authError = document.getElementById('auth-error');

  loginBtn.addEventListener('click', async () => {
    loginBtn.disabled = true;
    const hash = await hashPassword(passwordInput.value);
    loginBtn.disabled = false;
    if (hash === ADMIN_PASSWORD_HASH) {
      try { localStorage.setItem('vworks_admin_auth', 'true'); } catch (_) {}
      showDashboard();
    } else {
      authError.classList.remove('hidden');
      passwordInput.value = '';
      passwordInput.focus();
    }
  });

  passwordInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') loginBtn.click();
    if (authError && !authError.classList.contains('hidden')) {
      authError.classList.add('hidden');
    }
  });

  // Logout — removes auth flag only, never touches content
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      try { localStorage.removeItem('vworks_admin_auth'); } catch (_) {}
      location.reload();
    });
  }

  // Save
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveContent);
  }
});
