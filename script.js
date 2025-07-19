// =======================================================
// الكود الكامل والنهائي لملف script.js (واجهة الدخول)
// =======================================================

// !!! هام: استبدل بالبيانات الخاصة بمشروعك على Supabase
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; 
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


document.addEventListener('DOMContentLoaded', () => {

    // --- اختيار عناصر الواجهة (DOM Elements) ---
    const signupPage = document.getElementById('signup-page');
    const loginPage = document.getElementById('login-page');
    const authWrapper = document.querySelector('.auth-wrapper');
    
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    const gotoLoginLink = document.getElementById('goto-login');
    const gotoSignupLink = document.getElementById('goto-signup');
    const gotoForgotPasswordLink = document.getElementById('goto-forgot-password');

    const togglePasswordIcons = document.querySelectorAll('.toggle-password');
    
    const termsLink = document.getElementById('terms-link');
    const termsModal = document.getElementById('terms-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const agreeCheckbox = document.getElementById('agree-terms-checkbox');
    const signupButton = document.getElementById('signup-button');

    // --- وظيفة التنقل بين الصفحات ---
    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const activePage = document.getElementById(pageId);
        if (activePage) activePage.classList.add('active');
    }

    // --- وظيفة عرض واجهة الطالب البسيطة ---
    function showStudentDashboard(user) {
        if (authWrapper) authWrapper.style.display = 'none';
        document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; text-align: center; font-family: 'Tajawal', sans-serif;">
                <h1>مرحباً بعودتك، ${user.user_metadata?.first_name || 'الطالب'}!</h1>
                <p>هنا ستظهر لوحة التحكم الخاصة بك. (قيد الإنشاء)</p>
                <button id="student-logout-btn" style="background: #ef4444; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; margin-top: 20px;">تسجيل الخروج</button>
            </div>
        `;
        document.getElementById('student-logout-btn').addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.reload();
        });
    }

    // --- ربط الأحداث (Event Listeners) ---

    // 1. التنقل بين النماذج
    gotoLoginLink.addEventListener('click', (e) => { e.preventDefault(); showPage('login-page'); });
    gotoSignupLink.addEventListener('click', (e) => { e.preventDefault(); showPage('signup-page'); });
    // (يمكنك إضافة منطق نسيت كلمة السر هنا إذا أردت)

    // 2. نموذج إنشاء حساب طالب
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const firstName = signupForm.querySelector('input[placeholder="الاسم"]').value;
        const lastName = signupForm.querySelector('input[placeholder="اللقب"]').value;
        const email = signupForm.querySelector('input[type="email"]').value;
        const password = signupForm.querySelector('input[type="password"]').value;
        const level = signupForm.querySelector('select').value;
        
        const { error } = await supabase.auth.signUp({
            email, password,
            options: { data: { first_name: firstName, last_name: lastName, level: level } }
        });

        if (error) {
            alert('حدث خطأ: ' + error.message);
        } else {
            alert('تم إنشاء حسابك بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب ثم تسجيل الدخول.');
            showPage('login-page');
            signupForm.reset();
        }
    });

    // 3. نموذج تسجيل الدخول (مع المنطق الذكي للتوجيه)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert('خطأ في تسجيل الدخول: ' + error.message);
            return;
        }

        if (user) {
            // تحقق من دور المستخدم في جدول admins
            const { data: adminData } = await supabase
                .from('admins')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (adminData) { // المستخدم هو عضو في الفريق
                if (adminData.role === 'assistant') {
                    window.location.href = 'assistant_dashboard.html';
                } else { // 'admin' or 'super_admin'
                    window.location.href = 'dashboard.html';
                }
            } else { // المستخدم هو طالب عادي
                showStudentDashboard(user);
            }
        }
    });

    // 4. إظهار/إخفاء كلمة السر
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const passwordInput = icon.closest('.input-with-icon').querySelector('input');
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });

    // 5. نافذة شروط الاستخدام
    termsLink.addEventListener('click', (e) => {
        e.preventDefault();
        termsModal.classList.add('show');
    });
    const closeModal = () => termsModal.classList.remove('show');
    closeModalBtn.addEventListener('click', closeModal);
    termsModal.addEventListener('click', (e) => { if (e.target === termsModal) closeModal(); });
    agreeCheckbox.addEventListener('change', () => {
        signupButton.disabled = !agreeCheckbox.checked;
    });

    // --- التحقق من الجلسة عند تحميل الصفحة ---
    (async function checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if(session) {
             const { data: adminData } = await supabase
                .from('admins')
                .select('role')
                .eq('user_id', session.user.id)
                .single();
            if (adminData) {
                if (adminData.role === 'assistant') {
                    if(!window.location.pathname.includes('assistant_dashboard.html')) window.location.href = 'assistant_dashboard.html';
                } else {
                     if(!window.location.pathname.includes('dashboard.html')) window.location.href = 'dashboard.html';
                }
            } else {
                showStudentDashboard(session.user);
            }
        }
    })();
});