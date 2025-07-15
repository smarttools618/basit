// =======================================================
// الخطوة 1: إعداد الربط مع Supabase
// =======================================================

const SUPABASE_URL = 'https://gtznbmpueunibhwlpmtk.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0em5ibXB1ZXVuaWJod2xwbXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTA3NjYsImV4cCI6MjA2ODE2Njc2Nn0.0A4csTHneN1_SUDygKA9qvpRv_dPaU7QNCfLz1oG_Xs';

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
    
    // أزرار العروض (إذا كانت موجودة في index.html)
    const offerButtons = document.querySelectorAll('.select-offer-btn');
    
    // عناصر الرسالة المنبثقة (إذا كانت موجودة في index.html)
    const successPopup = document.getElementById('success-popup');
    const closePopupBtn = document.getElementById('close-popup-btn');

    // --- وظيفة التنقل بين الصفحات ---
    function showPage(pageId) {
        pages.forEach(page => {
            if(page) page.classList.remove('active');
        });
        const activePage = document.getElementById(pageId);
        if (activePage) {
            activePage.classList.add('active');
        }
    }
    
    // --- وظيفة عرض الصفحة الرئيسية للطالب المسجل ---
    function showStudentDashboard(user) {
        if(authWrapper) authWrapper.style.display = 'none';
        // مسح أي عناصر قديمة في الـ body لتجنب التكرار
        const oldDashboard = document.querySelector('.dashboard-container');
        if(oldDashboard) oldDashboard.remove();
        
        const firstName = user.user_metadata.first_name || 'الطالب';
        const subscription = user.user_metadata.subscription_type;
        document.body.innerHTML += `
            <div class="dashboard-container">
                <h1>مرحباً بعودتك، ${firstName}!</h1>
                <p>أنت مشترك في: <strong>${subscription === 'paid' ? 'العرض المدفوع' : 'العرض المجاني'}</strong></p>
                <p>هنا ستظهر لوحة التحكم الخاصة بك بالدروس والتمارين.</p>
                <button id="logout-btn">تسجيل الخروج</button>
            </div>
        `;
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.reload();
        });
    }

    // =======================================================
    // ربط الأحداث (Event Listeners)
    // =======================================================

    // 1. التنقل بين النماذج
    if(gotoLoginLink) gotoLoginLink.addEventListener('click', (e) => { e.preventDefault(); showPage('login-page'); });
    if(gotoSignupLink) gotoSignupLink.addEventListener('click', (e) => { e.preventDefault(); showPage('signup-page'); });
    if(gotoForgotPasswordLink) gotoForgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); showPage('forgot-password-page'); });
    if(backToLoginLink) backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showPage('login-page'); });

    // 2. نموذج إنشاء الحساب
    if(signupForm) signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const [firstName, lastName, email, password, level] = [...e.target].map(input => input.value);

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { 
                    first_name: firstName,
                    last_name: lastName,
                    level: level,
                    subscription_type: 'none',
                    subscription_end_date: null,
                }
            }
        });

        if (error) {
            alert('حدث خطأ: ' + error.message);
        } else {
            alert('تم إنشاء حسابك بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب قبل تسجيل الدخول.');
            showPage('login-page');
        }
    });

    // 3. نموذج تسجيل الدخول (مع المنطق الذكي للتوجيه)
    if(loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const [email, password] = [...e.target].map(input => input.value);

        const { data: { user }, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            alert('خطأ في تسجيل الدخول: ' + error.message);
            return;
        }

        if (user) {
            // بعد النجاح، تحقق إذا كان المستخدم مشرفاً
            const { data: adminData, error: adminError } = await supabaseClient
                .from('admins')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (adminData) {
                // نعم، هو مشرف! قم بتوجيهه إلى لوحة التحكم
                alert('مرحباً أيها المشرف! سيتم توجيهك إلى لوحة التحكم.');
                window.location.href = 'dashboard.html';
            } else {
                // لا، هو طالب عادي. اعرض له لوحة تحكم الطالب
                showStudentDashboard(user);
            }
        }
    });

    // 4. نموذج نسيت كلمة السر
    if(forgotPasswordForm) forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target[0].value;
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, 
        });

        if (error) {
            alert("خطأ: " + error.message);
        } else {
            alert("تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. الرجاء تفقد البريد.");
            showPage('login-page');
        }
    });
    
    // 5. نموذج إعادة تعيين كلمة السر الجديدة
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
            showPage('reset-password-page');
            if(resetPasswordForm) resetPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newPassword = e.target[0].value;
                const confirmPassword = e.target[1].value;

                if(newPassword !== confirmPassword) {
                    alert("كلمتا السر غير متطابقتين!");
                    return;
                }

                const { data, error } = await supabaseClient.auth.updateUser({ password: newPassword });
                
                if (error) {
                    alert("خطأ في تحديث كلمة السر: " + error.message);
                } else {
                    alert("تم تغيير كلمة السر بنجاح. يمكنك الآن تسجيل الدخول.");
                    // إعادة التوجيه لتسجيل الخروج من جلسة استعادة كلمة المرور
                    await supabaseClient.auth.signOut();
                    showPage('login-page');
                }
            });
        }
    });

    // --- التحقق من حالة المستخدم عند تحميل الصفحة ---
    async function checkUserSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            // إذا كان هناك جلسة نشطة، تحقق من هو المستخدم ووجهه
            const user = session.user;
            const { data: adminData } = await supabaseClient.from('admins').select('role').eq('user_id', user.id).single();
            if (adminData) {
                // إذا كان مشرفاً، اتركه في صفحة الدخول ليسجل دخوله ويتجه للداشبورد
                 showPage('login-page');
            } else {
                // إذا كان طالباً، اعرض له لوحة تحكمه
                showStudentDashboard(user);
            }
        } else {
            // إذا لم يكن هناك أي جلسة، ابدأ من صفحة إنشاء حساب
            showPage('signup-page');
        }
    }

    checkUserSession();
});