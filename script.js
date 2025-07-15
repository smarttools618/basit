// =======================================================
// الخطوة 1: إعداد الربط مع Supabase
// =======================================================

// تأكد من استبدال هذه القيم بالقيم الحقيقية الخاصة بك
const SUPABASE_URL = 'https://gtznbmpueunibhwlpmtk.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0em5ibXB1ZXVuaWJod2xwbXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTA3NjYsImV4cCI6MjA2ODE2Njc2Nn0.0A4csTHneN1_SUDygKA9qvpRv_dPaU7QNCfLz1oG_Xs';

// تهيئة عميل Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase Client Initialized');

// =======================================================
// الكود العام للتحكم في الواجهة
// =======================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- اختيار عناصر الواجهة (DOM Elements) ---
    const pages = document.querySelectorAll('.page');
    const mainContainer = document.querySelector('.main-container');

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
    
    // أزرار العروض
    const offerButtons = document.querySelectorAll('.select-offer-btn');
    
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
    
    // --- وظيفة عرض الصفحة الرئيسية للمستخدم المسجل ---
    function showDashboard(user) {
        mainContainer.style.display = 'none';
        const firstName = user.user_metadata.first_name;
        const subscription = user.user_metadata.subscription_type;
        document.body.innerHTML += `
            <div class="dashboard-container">
                <h1>مرحباً بعودتك، ${firstName}!</h1>
                <p>أنت مشترك في: <strong>${subscription === 'paid' ? 'العرض المدفوع' : 'العرض المجاني'}</strong></p>
                <p>هنا ستظهر لوحة التحكم الخاصة بك بالدروس والتمارين.</p>
                <button id="logout-btn">تسجيل الخروج</button>
            </div>
        `;
        // إضافة حدث لزر تسجيل الخروج
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.reload(); // إعادة تحميل الصفحة للعودة لشاشة الدخول
        });
    }


    // =======================================================
    // ربط الأحداث (Event Listeners)
    // =======================================================

    // 1. التنقل بين النماذج
    gotoLoginLink.addEventListener('click', (e) => { e.preventDefault(); showPage('login-page'); });
    gotoSignupLink.addEventListener('click', (e) => { e.preventDefault(); showPage('signup-page'); });
    gotoForgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); showPage('forgot-password-page'); });
    backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showPage('login-page'); });

    // 2. نموذج إنشاء الحساب
    signupForm.addEventListener('submit', async (e) => {
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
                    subscription_type: 'none', // لم يختر عرضاً بعد
                    subscription_end_date: null,
                }
            }
        });

        if (error) {
            alert('حدث خطأ: ' + error.message);
        } else {
            successPopup.querySelector('p').textContent = 'تم إنشاء حسابك بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.';
            successPopup.classList.add('active');
        }
    });

    // 3. إغلاق الرسالة المنبثقة
    closePopupBtn.addEventListener('click', () => {
        successPopup.classList.remove('active');
        showPage('login-page');
    });

    // 4. نموذج تسجيل الدخول
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const [email, password] = [...e.target].map(input => input.value);

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            alert('خطأ في تسجيل الدخول: ' + error.message);
        } else if (data.user) {
            const subscription = data.user.user_metadata.subscription_type;
            if (subscription === 'none' || !subscription) {
                showPage('offer-page');
            } else {
                showDashboard(data.user);
            }
        }
    });

    // 5. نموذج نسيت كلمة السر
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target[0].value;
        
        // **هام:** يجب تفعيل خيار "Secure email change" في إعدادات Supabase
        // (Authentication -> Providers -> Email -> Secure email change)
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, // الرابط الذي سيعود إليه المستخدم بعد الضغط على الرابط في الإيميل
        });

        if (error) {
            alert("خطأ: " + error.message);
        } else {
            alert("تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. الرجاء تفقد البريد.");
            showPage('login-page');
        }
    });
    
    // 6. نموذج إعادة تعيين كلمة السر الجديدة
    // هذا النموذج يتم الوصول إليه عبر الرابط في البريد الإلكتروني
    // Supabase سيتكفل بعرض النموذج تلقائياً
    // لكننا سنبرمج منطق التحديث إذا عاد المستخدم للصفحة بعد التحقق
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
            showPage('reset-password-page');
            resetPasswordForm.addEventListener('submit', async (e) => {
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
                    showPage('login-page');
                }
            });
        }
    });

    // 7. أزرار اختيار العرض
    offerButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const offerType = button.closest('.offer-card').classList.contains('free') ? 'free' : 'paid';
            
            if (offerType === 'paid') {
                // منطق العرض المدفوع
                alert('الاشتراك المدفوع قيد التطوير. سيتم توجيهك الآن للمنصة بالعرض المجاني.');
                // مؤقتاً، سنقوم بتسجيله في العرض المجاني
                updateUserSubscription('free');
            } else {
                // منطق العرض المجاني
                updateUserSubscription('free');
            }
        });
    });
    
    // وظيفة تحديث اشتراك المستخدم
    async function updateUserSubscription(subscriptionType) {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            alert('لا يمكن تحديث الاشتراك. يرجى تسجيل الدخول مرة أخرى.');
            return;
        }

        const { data, error } = await supabaseClient.auth.updateUser({
            data: { 
                subscription_type: subscriptionType 
            }
        });

        if (error) {
            alert('حدث خطأ أثناء تحديث الاشتراك: ' + error.message);
        } else {
            alert(`تم اشتراكك في ${subscriptionType === 'free' ? 'العرض المجاني' : 'العرض المدفوع'} بنجاح!`);
            showDashboard(data.user);
        }
    }


    // --- التحقق من حالة المستخدم عند تحميل الصفحة ---
    // هذا الجزء مهم لمعرفة ما إذا كان المستخدم مسجلاً دخوله بالفعل
    async function checkUserSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            const user = session.user;
            const subscription = user.user_metadata.subscription_type;
            if (subscription && subscription !== 'none') {
                showDashboard(user);
            } else {
                showPage('offer-page');
            }
        } else {
            showPage('login-page'); // إذا لم يكن هناك جلسة، اذهب لصفحة تسجيل الدخول
        }
    }

    // ابدأ بفحص جلسة المستخدم
    checkUserSession();
});