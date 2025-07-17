// =======================================================
// الخطوة 1: إعداد الربط مع Supabase
// =======================================================

const SUPABASE_URL = 'https://yjujdodudllhlgvhrhsw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdWpkb2R1ZGxsaGxndmhyaHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTQxMzIsImV4cCI6MjA2ODM3MDEzMn0.P7rLD-7hu9fRTSFfm_RuoGqjTmvXTUmPELQC0e7rOmU';

// تهيئة عميل Supabase
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
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');

    // الروابط
    const gotoLoginLink = document.getElementById('goto-login');
    const gotoSignupLink = document.getElementById('goto-signup');
    const gotoForgotPasswordLink = document.getElementById('goto-forgot-password');
    const backToLoginLink = document.getElementById('back-to-login-1');
    
    // أيقونات إظهار/إخفاء كلمة السر
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');

    // --- وظيفة التنقل بين الصفحات ---
    function showPage(pageId) {
        // تأكد من أن حاوية النماذج موجودة قبل محاولة إظهار صفحة
        if (!authWrapper) return; 
        
        pages.forEach(page => {
            if (page) page.classList.remove('active');
        });
        const activePage = document.getElementById(pageId);
        if (activePage) {
            activePage.classList.add('active');
        }
    }
    
    // --- وظيفة عرض الصفحة الرئيسية للطالب المسجل ---
    function showStudentDashboard(user) {
        if (authWrapper) authWrapper.style.display = 'none';
        
        // مسح محتوى الصفحة بالكامل لضمان عدم تداخل العناصر
        document.body.innerHTML = '';
        
        const firstName = user.user_metadata?.first_name || 'الطالب';
        const subscription = user.user_metadata?.subscription_type || 'مجاني';

        document.body.innerHTML = `
            <div class="dashboard-container" style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; text-align: center; padding: 40px; font-family: 'Tajawal', sans-serif;">
                <h1>مرحباً بعودتك، ${firstName}!</h1>
                <p style="font-size: 1.2rem;">أنت مشترك في: <strong>${subscription === 'paid' ? 'العرض المدفوع' : 'العرض المجاني'}</strong></p>
                <p>هنا ستظهر لوحة التحكم الخاصة بك بالدروس والتمارين.</p>
                <button id="logout-btn-student" style="background: #ef4444; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">تسجيل الخروج</button>
            </div>
        `;
        document.getElementById('logout-btn-student').addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html'; // توجيه لصفحة الدخول بعد الخروج
        });
    }

    // =======================================================
    // ربط الأحداث (Event Listeners)
    // =======================================================

    // 1. التنقل بين النماذج
    if (gotoLoginLink) gotoLoginLink.addEventListener('click', (e) => { e.preventDefault(); showPage('login-page'); });
    if (gotoSignupLink) gotoSignupLink.addEventListener('click', (e) => { e.preventDefault(); showPage('signup-page'); });
    if (gotoForgotPasswordLink) gotoForgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); showPage('forgot-password-page'); });
    if (backToLoginLink) backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showPage('login-page'); });

    // 2. نموذج إنشاء الحساب
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
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    level: level
                }
            }
        });

        if (error) {
            alert('حدث خطأ: ' + error.message);
        } else {
            alert('تم إنشاء حسابك بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.');
            showPage('login-page');
        }
    });

    // 3. نموذج تسجيل الدخول (مع المنطق الذكي للتوجيه)
    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputs = e.target.elements;
        const email = inputs[0].value;
        const password = inputs[1].value;

        const { data: { user }, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            alert('خطأ في تسجيل الدخول: ' + error.message);
            return;
        }

        if (user) {
            const { data: adminData } = await supabaseClient
                .from('admins')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (adminData) {
                // نعم، هو مشرف! قم بتوجيهه إلى لوحة التحكم
                window.location.href = 'dashboard.html';
            } else {
                // لا، هو طالب عادي. اعرض له لوحة تحكم الطالب
                showStudentDashboard(user);
            }
        }
    });

    // 4. منطق إظهار/إخفاء كلمة السر
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const passwordInput = icon.previousElementSibling;
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // 5. نموذج نسيت كلمة السر
    if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // ... نفس الكود السابق
    });
    
    // 6. نموذج إعادة تعيين كلمة السر الجديدة
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
            // ... نفس الكود السابق
        }
    });


    // =======================================================
    // وظيفة التحقق من الجلسة عند تحميل الصفحة (للتوجيه التلقائي)
    // =======================================================
    async function checkUserSessionAndRedirect() {
        // 1. احصل على الجلسة الحالية من Supabase (الذي يتحقق من localStorage)
        const { data: { session } } = await supabaseClient.auth.getSession();

        // 2. إذا كان هناك جلسة نشطة (المستخدم مسجل دخوله بالفعل)
        if (session) {
            const user = session.user;
            
            // 3. تحقق إذا كان هذا المستخدم مشرفاً
            const { data: adminData } = await supabaseClient
                .from('admins')
                .select('role')
                .eq('user_id', user.id)
                .single();

            // 4. قم بالتوجيه بناءً على النتيجة
            if (adminData) {
                // إذا كان مشرف، وجهه مباشرة إلى لوحة التحكم
                // تحقق أننا لسنا بالفعل في صفحة التحكم لتجنب التوجيه المتكرر
                if (!window.location.pathname.includes('dashboard.html')) {
                    window.location.href = 'dashboard.html';
                }
            } else {
                // إذا كان طالباً، اعرض له لوحة تحكمه الخاصة
                showStudentDashboard(user);
            }
        } else {
            // 5. إذا لم يكن هناك جلسة، اعرض صفحة إنشاء الحساب كالمعتاد
            showPage('signup-page');
        }
    }

    // --- تشغيل وظيفة التحقق عند تحميل الصفحة ---
    checkUserSessionAndRedirect();
});