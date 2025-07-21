// ==================================================
// 1. الإعداد والاتصال (Setup and Connection)
// ==================================================
const SUPABASE_URL = 'https://yhfqnfunkmhhxbwtrjns.supabase.co'; // <-- Paste your project URL here
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZnFuZnVua21oaHhid3Ryam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTAwODMsImV4cCI6MjA2ODY2NjA4M30.tLLs2S0wqnuJ2H7K5tucFJk3phktsgpMCYa92q0jopc'; // <-- Paste your anon public key here

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================================================
// 2. أدوات مساعدة (Helper Utilities)
// ==================================================
const messageContainer = document.getElementById('message-container');
const submitButton = document.getElementById('submit-button');

function showMessage(message, type = 'error') {
    if (!messageContainer) return;
    const messageClass = type === 'success' ? 'message success' : 'message error';
    messageContainer.innerHTML = `<div class="${messageClass}">${message}</div>`;
}

function setButtonLoading(isLoading) {
    if (!submitButton) return;
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? 'جاري...' : (document.title.includes('إنشاء حساب') ? 'إنشاء الحساب' : 'تسجيل الدخول');
}

// ==================================================
// 3. منطق الصفحات (Page Logic)
// ==================================================
const currentPage = window.location.pathname.split('/').pop();

if (currentPage === 'signup.html') {
    handleSignupPage();
} else if (currentPage === 'login.html') {
    handleLoginPage();
} else if (currentPage === 'home.html') {
    handleHomePage();
}

// ---- منطق صفحة إنشاء حساب (signup.html) ----
function handleSignupPage() {
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setButtonLoading(true);
        const fullName = document.getElementById('full-name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const gradeLevel = document.getElementById('grade-level').value;

        if (!gradeLevel) {
            showMessage('يرجى اختيار المستوى الدراسي.', 'error');
            setButtonLoading(false);
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: fullName, grade_level: gradeLevel } }
        });

        if (error) {
            showMessage(error.message, 'error');
        } else {
            showMessage('تم إنشاء الحساب بنجاح! سيتم تحويلك لصفحة تسجيل الدخول.', 'success');
            setTimeout(() => { window.location.href = 'login.html'; }, 3000);
        }
        setButtonLoading(false);
    });
}

// ---- منطق صفحة تسجيل الدخول (login.html) ----
function handleLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setButtonLoading(true);
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            showMessage('البريد الإلكتروني أو كلمة السر غير صحيحة.', 'error');
        } else {
            window.location.href = 'home.html';
        }
        setButtonLoading(false);
    });
}

// ---- منطق الصفحة الرئيسية (home.html) ----
async function handleHomePage() {
    const userWelcome = document.getElementById('user-welcome');
    const logoutButton = document.getElementById('logout-button');
    
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        alert('يجب عليك تسجيل الدخول أولاً لعرض هذه الصفحة.');
        window.location.href = 'login.html';
        return;
    }

    const user = session.user;
    const { data: profile } = await supabase.from('profiles').select('full_name, grade_level').eq('id', user.id).single();

    if (profile) {
        userWelcome.textContent = `أهلاً بك، ${profile.full_name}!`;
        loadContentForUser(profile.grade_level);
    }
    
    logoutButton.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });
}

// ---- دالة تحميل وعرض المحتوى ----
async function loadContentForUser(gradeLevel) {
    const contentGrid = document.getElementById('content-grid');
    if (!contentGrid) return;

    contentGrid.innerHTML = '<p>جاري تحميل المحتوى...</p>';

    const icons = {
        'درس': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>`,
        'تمرين': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>`,
        'ملخص': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25L3.375 9h6.75v-6.75z" /></svg>`,
    };

    const { data: content, error } = await supabase.from('content').select('title, type, file_url').eq('grade_level', gradeLevel);
    
    if (error) {
        contentGrid.innerHTML = '<p class="message error">حدث خطأ أثناء تحميل المحتوى.</p>';
        return;
    }
    if (content.length === 0) {
        contentGrid.innerHTML = '<p>لا يوجد محتوى متاح لمستواك الدراسي حالياً.</p>';
        return;
    }

    contentGrid.innerHTML = '';
    content.forEach(item => {
        const iconSvg = icons[item.type] || icons['درس']; // Default to book icon
        const cardHTML = `
            <div class="home-card">
                <div class="home-card-header">
                    <div class="home-card-icon">${iconSvg}</div>
                    <div class="home-card-header-text">
                        <h3>${item.title}</h3>
                        <p>${item.type}</p>
                    </div>
                </div>
                <div class="home-card-body">
                    <p>هنا يمكن إضافة وصف بسيط للمحتوى إذا كان متوفراً في قاعدة البيانات.</p>
                </div>
                <div class="home-card-footer">
                    <a href="${item.file_url}" target="_blank" rel="noopener noreferrer">عرض وتحميل</a>
                </div>
            </div>
        `;
        contentGrid.innerHTML += cardHTML;
    });
}