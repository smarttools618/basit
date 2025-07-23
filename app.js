document.addEventListener('DOMContentLoaded', () => {

    // ==================================================
    // 1. Supabase Configuration
    // ==================================================
    const SUPABASE_URL = 'https://yhfqnfunkmhhxbwtrjns.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZnFuZnVua21oaHhid3Ryam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTAwODMsImV4cCI6MjA2ODY2NjA4M30.tLLs2S0wqnuJ2H7K5tucFJk3phktsgpMCYa92q0jopc';
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ==================================================
    // 2. DOM Element References (Forms)
    // ==================================================
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');

    // ==================================================
    // 3. Helper Functions
    // ==================================================
    const showMessage = (containerId, message, type = 'error') => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="message ${type}">${message}</div>`;
        }
    };

    const setButtonLoading = (form, isLoading) => {
        const button = form.querySelector('button[type="submit"]');
        if (button) {
            if (isLoading) {
                button.dataset.originalText = button.innerHTML;
                button.innerHTML = 'جاري...';
                button.disabled = true;
            } else {
                button.innerHTML = button.dataset.originalText;
                button.disabled = false;
            }
        }
    };

    const validateForm = (form, messageContainerId) => {
        const inputs = form.querySelectorAll('input[required]');
        for (const input of inputs) {
            const inputGroup = input.parentElement;
            if (input.type === 'checkbox' && !input.checked) {
                showMessage(messageContainerId, 'يجب الموافقة على شروط الاستخدام للمتابعة.', 'error');
                return false;
            }
            if (!input.value.trim() && input.type !== 'checkbox') {
                showMessage(messageContainerId, `يرجى ملء حقل "${input.placeholder}".`, 'error');
                inputGroup.classList.add('error');
                input.focus();
                // Remove error style on input change
                input.addEventListener('input', () => inputGroup.classList.remove('error'), { once: true });
                return false;
            }
            inputGroup.classList.remove('error');
        }
        return true;
    };

    // ==================================================
    // 4. Feature Initializers
    // ==================================================

    // --- Password Toggle ---
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission if inside a form
            const targetId = toggle.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const icon = toggle.querySelector('i');
            
            if (!passwordInput || !icon) return; // Guard clause

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

    // --- Password Strength Meter ---
    const passwordInput = document.getElementById('signup-password');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            let strength = 0;
            if (password.length >= 8) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            const meter = document.querySelector('.strength-bars');
            const text = document.querySelector('.strength-text');
            if (!meter || !text) return;
            
            meter.className = 'strength-bars'; // Reset classes
            if (password.length > 0) {
                if (strength === 1) { meter.classList.add('weak'); text.textContent = 'ضعيفة'; }
                else if (strength === 2) { meter.classList.add('medium'); text.textContent = 'متوسطة'; }
                else if (strength === 3) { meter.classList.add('strong'); text.textContent = 'قوية'; }
                else if (strength === 4) { meter.classList.add('very-strong'); text.textContent = 'قوية جداً'; }
            } else {
                text.textContent = 'قوة كلمة المرور';
            }
        });
    }

    // --- Terms & Conditions Modal ---
    const termsModal = document.getElementById('terms-modal');
    const showTermsBtn = document.getElementById('show-terms-btn');
    const closeTermsBtn = document.getElementById('close-terms-btn');
    const acceptTermsBtn = document.getElementById('accept-terms-btn');
    if (termsModal && showTermsBtn && closeTermsBtn && acceptTermsBtn) {
        const toggleModal = (show) => {
            if (show) termsModal.style.display = 'flex';
            else termsModal.style.display = 'none';
        };
        showTermsBtn.addEventListener('click', (e) => { e.preventDefault(); toggleModal(true); });
        closeTermsBtn.addEventListener('click', () => toggleModal(false));
        acceptTermsBtn.addEventListener('click', () => {
            document.getElementById('terms').checked = true;
            toggleModal(false);
        });
        termsModal.addEventListener('click', (e) => { if (e.target === termsModal) toggleModal(false); });
    }
    
    // ==================================================
    // 5. Form Handlers
    // ==================================================

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm(loginForm, 'login-message-container')) return;
            setButtonLoading(loginForm, true);
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                showMessage('login-message-container', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'error');
            } else {
                window.location.href = 'home.html';
            }
            setButtonLoading(loginForm, false);
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm(signupForm, 'signup-message-container')) return;
            setButtonLoading(signupForm, true);
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const fullName = document.getElementById('signup-name').value;

            const { error } = await supabase.auth.signUp({
                email, password, options: { data: { full_name: fullName } }
            });

            if (error) {
                showMessage('signup-message-container', error.message, 'error');
            } else {
                showMessage('signup-message-container', 'تم إنشاء حسابك بنجاح! تحقق من بريدك الإلكتروني لتأكيد حسابك.', 'success');
                setTimeout(() => { signupForm.reset(); }, 3000);
            }
            setButtonLoading(signupForm, false);
        });
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm(forgotPasswordForm, 'forgot-message-container')) return;
            setButtonLoading(forgotPasswordForm, true);
            const email = document.getElementById('forgot-email').value;

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`, // You must create this page
            });

            if (error) {
                showMessage('forgot-message-container', error.message, 'error');
            } else {
                showMessage('forgot-message-container', 'إذا كان البريد الإلكتروني مسجلاً، فسيتم إرسال رابط الاستعادة إليه.', 'success');
            }
            setButtonLoading(forgotPasswordForm, false);
        });
    }
});