// =======================================================
// الخطوة 1: إعداد الربط مع Supabase
// =======================================================

// استبدل 'YOUR_SUPABASE_URL' و 'YOUR_SUPABASE_ANON_KEY' بالمفاتيح التي نسختها
const SUPABASE_URL = 'https://gtznbmpueunibhwlpmtk.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0em5ibXB1ZXVuaWJod2xwbXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTA3NjYsImV4cCI6MjA2ODE2Njc2Nn0.0A4csTHneN1_SUDygKA9qvpRv_dPaU7QNCfLz1oG_Xs';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase Client Initialized:', supabaseClient);

// =======================================================
// الكود السابق للتحكم في الواجهة (بدون تغيير)
// =======================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- اختيار العناصر ---
    const pages = document.querySelectorAll('.page');
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    // ... (باقي العناصر كما هي)
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');

    // روابط التنقل
    const gotoLoginLink = document.getElementById('goto-login');
    const gotoSignupLink = document.getElementById('goto-signup');
    const gotoForgotPasswordLink = document.getElementById('goto-forgot-password');
    const backToLoginLink = document.getElementById('back-to-login-1');
    
    // عناصر الرسالة المنبثقة
    const successPopup = document.getElementById('success-popup');
    const closePopupBtn = document.getElementById('close-popup-btn');

    // --- وظيفة التنقل بين الصفحات ---
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        const activePage = document.getElementById(pageId);
        if (activePage) {
            activePage.classList.add('active');
        }
    }

    // --- ربط الأحداث (Events) ---
    gotoLoginLink.addEventListener('click', (e) => { e.preventDefault(); showPage('login-page'); });
    gotoSignupLink.addEventListener('click', (e) => { e.preventDefault(); showPage('signup-page'); });
    gotoForgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); showPage('forgot-password-page'); });
    backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showPage('login-page'); });
    
    // --- منطق النماذج المربوطة بـ Supabase ---

    // 1. عند تقديم نموذج إنشاء الحساب (تم تحديثه)
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // جلب البيانات من النموذج
        const firstName = e.target[0].value;
        const lastName = e.target[1].value;
        const email = e.target[2].value;
        const password = e.target[3].value;
        const level = e.target[4].value;

        // إرسال البيانات إلى Supabase لإنشاء مستخدم جديد
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                // هنا نضع البيانات الإضافية
                data: { 
                    first_name: firstName,
                    last_name: lastName,
                    level: level,
                    subscription_type: 'none' // لم يختر عرضاً بعد
                }
            }
        });

        if (error) {
            alert('حدث خطأ: ' + error.message);
        } else {
            console.log('User created successfully:', data);
            // إظهار رسالة النجاح
            successPopup.classList.add('active');
        }
    });

    // 2. عند إغلاق رسالة النجاح
    closePopupBtn.addEventListener('click', () => {
        successPopup.classList.remove('active');
        showPage('login-page'); // الانتقال لصفحة تسجيل الدخول
    });

    // 3. عند تقديم نموذج تسجيل الدخول (سيتم ربطه لاحقاً)
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('سيتم ربط تسجيل الدخول بـ Supabase قريباً.');
        // للمحاكاة الآن، ننتقل لصفحة العروض
        showPage('offer-page');
    });
    
    // (باقي النماذج سيتم ربطها لاحقاً)
    
    // --- إظهار الصفحة الأولى عند تحميل الموقع ---
    showPage('signup-page');
});