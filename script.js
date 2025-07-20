// =======================================================
// الخطوة 1: إعداد الربط مع Supabase
// =======================================================
const SUPABASE_URL = 'https://yjujdodudllhlgvhrhsw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdWpkb2R1ZGxsaGxndmhyaHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTQxMzIsImV4cCI6MjA2ODM3MDEzMn0.P7rLD-7hu9fRTSFfm_RuoGqjTmvXTUmPELQC0e7rOmU';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase Client Initialized for index.html');

// =======================================================
// الكود العام للتحكم في الواجهة
// =======================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- اختيار عناصر الواجهة (DOM Elements) ---
    const pages = document.querySelectorAll('.page');
    const authWrapper = document.querySelector('.auth-wrapper');

    // النماذج
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    // الروابط
    const gotoLoginLink = document.getElementById('goto-login');
    const gotoSignupLink = document.getElementById('goto-signup');
    const backToLoginLink = document.getElementById('back-to-login-1');
    
    // عناصر الشروط والأحكام
    const termsCheckbox = document.getElementById('terms-checkbox');
    const signupButton = document.getElementById('signup-button');
    const openTosLink = document.getElementById('open-tos-popup');
    const tosPopup = document.getElementById('tos-popup');
    const closeTosPopup = tosPopup.querySelector('.popup-close');

    // أيقونات إظهار/إخفاء كلمة السر
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');

    // --- وظيفة التنقل بين الصفحات ---
    function showPage(pageId) {
        if (!authWrapper) return;
        pages.forEach(page => page && page.classList.remove('active'));
        const activePage = document.getElementById(pageId);
        if (activePage) activePage.classList.add('active');
    }

    // --- وظيفة التوجيه الذكي بعد تسجيل الدخول ---
    async function smartRedirect(user) {
        if (!user) return;
        
        // تحقق مما إذا كان المستخدم مشرفًا
        const { data: adminData, error } = await supabaseClient
            .from('admins')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (adminData) {
            // هو مشرف، تحقق من دوره
            if (adminData.role === 'assistant') {
                window.location.href = 'assistant_dashboard.html';
            } else { // admin or super_admin
                window.location.href = 'dashboard.html';
            }
        } else {
            // هو طالب عادي
            showStudentDashboard(user);
        }
    }

    function showStudentDashboard(user) {
        if (authWrapper) authWrapper.style.display = 'none';
        document.body.innerHTML = ''; // مسح المحتوى الحالي
        
        const firstName = user.user_metadata?.first_name || 'الطالب';
        const subscription = user.user_metadata?.subscription_type || 'مجاني';

        document.body.innerHTML = `
            <div class="dashboard-container" style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; text-align: center; padding: 40px; font-family: 'Tajawal', sans-serif;">
                <h1>مرحباً بعودتك، ${firstName}!</h1>
                <p style="font-size: 1.2rem;">صفحتك الرئيسية قيد الإنشاء.</p>
                <button id="logout-btn-student" style="background: #ef4444; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; margin-top: 20px;">تسجيل الخروج</button>
            </div>
        `;
        document.getElementById('logout-btn-student').addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.reload();
        });
    }

    // =======================================================
    // ربط الأحداث (Event Listeners)
    // =======================================================

    // 1. التنقل بين النماذج
    if (gotoLoginLink) gotoLoginLink.addEventListener('click', (e) => { e.preventDefault(); showPage('login-page'); });
    if (gotoSignupLink) gotoSignupLink.addEventListener('click', (e) => { e.preventDefault(); showPage('signup-page'); });
    if (backToLoginLink) backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showPage('login-page'); });

    // 2. تفعيل زر إنشاء الحساب عند الموافقة على الشروط
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', () => {
            signupButton.disabled = !termsCheckbox.checked;
        });
    }

    // 3. فتح وإغلاق نافذة الشروط
    if (openTosLink) {
        openTosLink.addEventListener('click', (e) => {
            e.preventDefault();
            tosPopup.classList.add('active');
        });
    }
    if (closeTosPopup) {
        closeTosPopup.addEventListener('click', () => {
            tosPopup.classList.remove('active');
        });
    }
    if (tosPopup) {
        tosPopup.addEventListener('click', (e) => {
            if (e.target === tosPopup) { // الإغلاق عند الضغط على الخلفية
                tosPopup.classList.remove('active');
            }
        });
    }
    
    // 4. نموذج إنشاء الحساب
    if (signupForm) signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputs = e.target.elements;
        const firstName = inputs[0].value;
        const lastName = inputs[1].value;
        const email = inputs[2].value;
        const password = inputs[3].value;
        const level = inputs[4].value;
        
        const { data, error } = await supabaseClient.auth.signUp({
            email, password,
            options: { data: { first_name: firstName, last_name: lastName, level: level } }
        });

        if (error) {
            alert('حدث خطأ: ' + error.message);
        } else {
            alert('تم إنشاء حسابك بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.');
            showPage('login-page');
        }
    });

    // 5. نموذج تسجيل الدخول
    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputs = e.target.elements;
        const email = inputs[0].value;
        const password = inputs[1].value;

        const { data: { user }, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            alert('خطأ في تسجيل الدخول: ' + error.message);
        } else if (user) {
            await smartRedirect(user);
        }
    });

    // 6. منطق إظهار/إخفاء كلمة السر
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const passwordInput = icon.previousElementSibling;
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });

    // 7. التنقل بين صفحات تسجيل الدخول وكلمة المرور المنسية
    document.getElementById('goto-forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('forgot-password-page').classList.add('active');
    });

    document.getElementById('back-to-login-1').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('forgot-password-page').classList.remove('active');
        document.getElementById('login-page').classList.add('active');
    });

    document.getElementById('goto-login').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('signup-page').classList.remove('active');
        document.getElementById('login-page').classList.add('active');
    });

    document.getElementById('goto-signup').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('signup-page').classList.add('active');
    });

    // =======================================================
    // وظيفة التحقق من الجلسة عند تحميل الصفحة (للتوجيه التلقائي)
    // =======================================================
    async function checkUserSessionAndRedirect() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            // المستخدم مسجل دخوله بالفعل، قم بالتوجيه
            await smartRedirect(session.user);
        } else {
            // لا يوجد مستخدم، اعرض صفحة التسجيل
            showPage('signup-page');
        }
    }

    checkUserSessionAndRedirect();
});