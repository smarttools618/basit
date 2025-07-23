document.addEventListener('DOMContentLoaded', () => {
    // --- COMMON AUTH FUNCTIONS ---
    const setupPasswordToggles = () => {
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = toggle.dataset.target;
                const input = document.getElementById(targetId);
                if (!input) return;

                const icon = toggle.querySelector('i');
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                icon.classList.toggle('fa-eye', !isPassword);
                icon.classList.toggle('fa-eye-slash', isPassword);
                toggle.setAttribute('aria-label', isPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
            });
        });
    };

    const checkAuth = () => {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        const currentPage = window.location.pathname.split('/').pop();
        const authPages = ['login.html', 'signup.html'];

        if (!isAuthenticated && currentPage === 'home.html') {
            window.location.href = 'login.html';
        } else if (isAuthenticated && authPages.includes(currentPage)) {
            window.location.href = 'home.html';
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        window.location.href = 'login.html';
    };

    // --- FORM VALIDATION ---
    const showError = (input, message) => {
        const group = input.closest('.input-group') || input.closest('.form-check');
        const errorDiv = group.querySelector('.input-error-message');
        if (errorDiv) {
            group.classList.add('error');
            errorDiv.textContent = message;
        }
    };

    const clearError = (input) => {
        const group = input.closest('.input-group') || input.closest('.form-check');
        const errorDiv = group.querySelector('.input-error-message');
        if (errorDiv) {
            group.classList.remove('error');
            errorDiv.textContent = '';
        }
    };

    const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

    // --- PASSWORD STRENGTH ---
    const updatePasswordStrengthUI = (password) => {
        const meter = document.querySelector('.password-strength-meter');
        if (!meter) return;

        const strength = checkPasswordStrength(password);
        const textDiv = meter.querySelector('.strength-text');
        
        // Update meter class for styling
        meter.className = `password-strength-meter ${strength.barClass}`;
        
        if (textDiv) {
            textDiv.textContent = strength.text;
            textDiv.className = `strength-text ${strength.barClass}`;
        }
    };

    const checkPasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (password.length === 0) return { score: 0, text: 'قوة كلمة المرور', barClass: '' };
        if (score < 3) return { score: 1, text: 'ضعيفة', barClass: 'weak' };
        if (score < 4) return { score: 2, text: 'متوسطة', barClass: 'medium' };
        if (score < 5) return { score: 3, text: 'قوية', barClass: 'strong' };
        return { score: 4, text: 'قوية جدًا', barClass: 'very-strong' };
    };

    // --- TERMS MODAL ---
    const setupTermsModal = () => {
        const modal = document.getElementById('terms-modal');
        const termsLink = document.getElementById('terms-link');
        const closeBtn = modal?.querySelector('.close-button');
        
        if (termsLink && modal) {
            termsLink.addEventListener('click', (e) => {
                e.preventDefault();
                modal.style.display = 'flex';
            });
        }
        
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    };

    // --- INITIALIZATION ---
    checkAuth();
    setupPasswordToggles();
    setupTermsModal();

    // --- LOGIN PAGE SPECIFIC ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const email = document.getElementById('login-email');
        const password = document.getElementById('login-password');

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let valid = true;
            // Clear previous errors
            clearError(email);
            clearError(password);

            if (!email.value.trim()) {
                showError(email, 'يرجى إدخال البريد الإلكتروني');
                valid = false;
            } else if (!validateEmail(email.value.trim())) {
                showError(email, 'صيغة البريد الإلكتروني غير صحيحة');
                valid = false;
            }

            if (!password.value.trim()) {
                showError(password, 'يرجى إدخال كلمة المرور');
                valid = false;
            }

            if (valid) {
                // Mock successful login for demonstration
                console.log('Login successful');
                localStorage.setItem('isAuthenticated', 'true');
                window.location.href = 'home.html';
            }
        });
    }

    // --- FORGOT PASSWORD PAGE SPECIFIC ---
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
        const email = document.getElementById('forgot-email');
        const messageContainer = document.getElementById('forgot-message-container');

        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let valid = true;
            
            // Clear previous errors and messages
            clearError(email);
            messageContainer.className = 'message-container';
            messageContainer.textContent = '';

            if (!email.value.trim()) {
                showError(email, 'يرجى إدخال البريد الإلكتروني');
                valid = false;
            } else if (!validateEmail(email.value.trim())) {
                showError(email, 'صيغة البريد الإلكتروني غير صحيحة');
                valid = false;
            }

            if (valid) {
                // Show loading state
                const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';

                // Simulate API call
                setTimeout(() => {
                    // Reset button state
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    
                    // Show success message
                    messageContainer.className = 'message-container success';
                    messageContainer.innerHTML = '<i class="fas fa-check-circle"></i> تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني';
                    
                    // Clear form
                    email.value = '';
                    
                    // Optional: Redirect to login after a delay
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 3000);
                }, 1500);
            }
        });
    }

    // --- SIGNUP PAGE SPECIFIC ---
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        const name = document.getElementById('signup-fullname'); // Fixed ID
        const email = document.getElementById('signup-email');
        const password = document.getElementById('signup-password');
        const terms = document.getElementById('terms-agree'); // Fixed ID

        if (password) {
            password.addEventListener('input', () => updatePasswordStrengthUI(password.value));
        }

        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let valid = true;
            
            // Clear previous errors
            if (name) clearError(name);
            if (email) clearError(email);
            if (password) clearError(password);
            if (terms) clearError(terms);

            if (!name?.value.trim()) {
                showError(name, 'يرجى إدخال الاسم الكامل');
                valid = false;
            }

            if (!email?.value.trim()) {
                showError(email, 'يرجى إدخال البريد الإلكتروني');
                valid = false;
            } else if (!validateEmail(email.value.trim())) {
                showError(email, 'صيغة البريد الإلكتروني غير صحيحة');
                valid = false;
            }

            if (!password?.value.trim()) {
                showError(password, 'يرجى إدخال كلمة المرور');
                valid = false;
            } else {
                const passwordStrength = checkPasswordStrength(password.value);
                if (passwordStrength.score < 3) {
                    showError(password, 'كلمة المرور ضعيفة جدًا، يرجى تحسينها');
                    valid = false;
                }
            }

            if (!terms?.checked) {
                showError(terms, 'يجب الموافقة على شروط الاستخدام للمتابعة');
                valid = false;
            }

            if (valid) {
                // Mock successful signup for demonstration
                console.log('Signup successful');
                localStorage.setItem('isAuthenticated', 'true');
                window.location.href = 'home.html';
            }
        });
    }
});