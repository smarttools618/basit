// ==================================================
// 1. Configuration & Supabase Client
// ==================================================
const SUPABASE_URL = 'https://yhfqnfunkmhhxbwtrjns.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZnFuZnVua21oaHhid3Ryam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTAwODMsImV4cCI6MjA2ODY2NjA4M30.tLLs2S0wqnuJ2H7K5tucFJk3phktsgpMCYa92q0jopc';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================================================
// 2. DOM Elements
// ==================================================
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginMessageContainer = document.getElementById('login-message-container');
const signupMessageContainer = document.getElementById('signup-message-container');

// Initialize Password Toggle Functionality
document.addEventListener('DOMContentLoaded', () => {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const targetId = toggle.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const icon = toggle.querySelector('i');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                toggle.setAttribute('aria-label', 'إخفاء كلمة المرور');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                toggle.setAttribute('aria-label', 'إظهار كلمة المرور');
            }
        });
    });
});

// ==================================================
// 3. Utility Functions
// ==================================================

// Password Strength Checker
const checkPasswordStrength = (password) => {
    let strength = 0;
    const strengthBars = document.querySelector('.strength-bars');
    const strengthText = document.querySelector('.strength-text');

    // Length check
    if (password.length >= 8) strength++;
    
    // Contains numbers
    if (/\d/.test(password)) strength++;
    
    // Contains letters
    if (/[a-zA-Z]/.test(password)) strength++;
    
    // Contains special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    // Update UI
    strengthBars?.classList.remove('weak', 'medium', 'strong', 'very-strong');
    
    if (password.length === 0) {
        strengthText.textContent = 'قوة كلمة المرور';
    } else if (strength === 1) {
        strengthBars?.classList.add('weak');
        strengthText.textContent = 'ضعيفة';
    } else if (strength === 2) {
        strengthBars?.classList.add('medium');
        strengthText.textContent = 'متوسطة';
    } else if (strength === 3) {
        strengthBars?.classList.add('strong');
        strengthText.textContent = 'قوية';
    } else {
        strengthBars?.classList.add('very-strong');
        strengthText.textContent = 'قوية جداً';
    }
};
const showMessage = (container, message, type = 'error') => {
  if (container) {
    container.innerHTML = `<div class="message ${type}">${message}</div>`;
  }
};

const setButtonLoading = (button, isLoading) => {
  if (button) {
    const originalText = button.dataset.originalText || button.innerHTML;
    if (!button.dataset.originalText) {
      button.dataset.originalText = originalText;
    }
    button.disabled = isLoading;
    button.innerHTML = isLoading ? 
      `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري...` : 
      originalText;
  }
};

// ==================================================
// 4. Form Handlers
// ==================================================
const handleLogin = async (e) => {
  e.preventDefault();
  const submitButton = loginForm.querySelector('button[type="submit"]');
  setButtonLoading(submitButton, true);
  
  const { error } = await supabase.auth.signInWithPassword({
    email: document.getElementById('login-email')?.value || '',
    password: document.getElementById('login-password')?.value || '',
  });

  if (error) {
    showMessage(loginMessageContainer, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  } else {
    // Store auth state
    localStorage.setItem('isAuthenticated', 'true');
    // Redirect to home page
    window.location.href = 'home.html';
  }
  
  setButtonLoading(submitButton, false);
};

const handleSignup = async (e) => {
  e.preventDefault();
  const submitButton = signupForm.querySelector('button[type="submit"]');
  setButtonLoading(submitButton, true);

  const email = document.getElementById('signup-email')?.value || '';
  const password = document.getElementById('signup-password')?.value || '';
  const fullName = document.getElementById('signup-name')?.value || '';

  if (!document.getElementById('terms')?.checked) {
    showMessage(signupMessageContainer, 'يجب الموافقة على الشروط والأحكام للمتابعة.');
    setButtonLoading(submitButton, false);
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });

  if (error) {
    showMessage(signupMessageContainer, error.message);
  } else {
    showMessage(signupMessageContainer, 'تم إنشاء حسابك بنجاح! تحقق من بريدك الإلكتروني لتأكيد حسابك.', 'success');
    // Store signup success state
    localStorage.setItem('signupSuccess', 'true');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 3000);
  }
  
  setButtonLoading(submitButton, false);
};

// Initialize Password Strength Checker
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('signup-password');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            checkPasswordStrength(e.target.value);
        });
    }
});

// ==================================================
// 5. Initialize
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
  // Setup password toggles
  // Handle password visibility toggle
const handlePasswordToggles = () => {
  document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const input = document.getElementById(toggle.dataset.target);
      const icon = toggle.querySelector('i');
      
      if (input && icon) {
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }
    });
  });
};

// Initialize password toggles
handlePasswordToggles();

  // Attach form handlers
  loginForm?.addEventListener('submit', handleLogin);
  signupForm?.addEventListener('submit', handleSignup);
});
