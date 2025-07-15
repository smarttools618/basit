// استبدل بالبيانات الخاصة بك
const SUPABASE_URL = 'https://gtznbmpueunibhwlpmtk.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0em5ibXB1ZXVuaWJod2xwbXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTA3NjYsImV4cCI6MjA2ODE2Njc2Nn0.0A4csTHneN1_SUDygKA9qvpRv_dPaU7QNCfLz1oG_Xs';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- العناصر الرئيسية في الصفحة ---
const adminNameEl = document.getElementById('admin-name');
const adminRoleEl = document.getElementById('admin-role');
const logoutBtn = document.getElementById('logout-btn');

const statsSection = document.getElementById('stats-section');
const requestsSection = document.getElementById('requests-section');
const usersSection = document.getElementById('users-section');


// --- وظيفة عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. تحقق من وجود مستخدم مسجل دخوله
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        // إذا لم يكن هناك مستخدم، أعده إلى صفحة الدخول الرئيسية
        alert('يرجى تسجيل الدخول أولاً.');
        window.location.href = 'index.html'; // افترض أن صفحة الدخول اسمها index.html
        return;
    }

    // 2. تحقق من أن هذا المستخدم موجود في جدول الـ admins
    const { data: adminData, error } = await supabaseClient
        .from('admins')
        .select('role, full_name') // جلب الدور والاسم
        .eq('user_id', user.id)
        .single(); // .single() لأنه يجب أن يكون هناك مشرف واحد فقط بهذا الـ user_id

    if (error || !adminData) {
        // إذا لم يكن المستخدم مشرفًا، اعرض رسالة خطأ وأعده
        alert('ليس لديك صلاحية الوصول لهذه الصفحة.');
        window.location.href = 'index.html';
        return;
    }

    // 3. بناء لوحة التحكم بناءً على الدور
    const adminRole = adminData.role;
    const adminFullName = adminData.full_name;

    adminNameEl.textContent = adminFullName;
    adminRoleEl.textContent = adminRole === 'super_admin' ? 'صاحب الموقع' : 'مساعد';
    
    buildDashboard(adminRole);
});


// --- وظيفة بناء الواجهة حسب الدور ---
function buildDashboard(role) {
    if (role === 'super_admin') {
        // صاحب الموقع يرى كل شيء
        statsSection.classList.remove('hidden');
        requestsSection.classList.remove('hidden');
        usersSection.classList.remove('hidden');

        // استدعاء وظائف تحميل البيانات
        loadStats();
        loadSubscriptionRequests();
        loadAllUsers();

    } else if (role === 'assistant') {
        // المساعد يرى فقط طلبات الاشتراك
        requestsSection.classList.remove('hidden');

        // استدعاء وظيفة تحميل طلبات الاشتراك فقط
        loadSubscriptionRequests();
    }
}


// --- وظائف تحميل البيانات (نماذج أولية) ---

async function loadStats() {
    console.log("جاري تحميل الإحصائيات...");
    // هنا ستكتب كود جلب الإحصائيات من Supabase
    document.getElementById('stats-content').innerHTML = '<p>إجمالي المستخدمين: ...</p><p>الاشتراكات المدفوعة: ...</p>';
}

async function loadSubscriptionRequests() {
    console.log("جاري تحميل طلبات الاشتراك...");
    // هنا ستكتب كود جلب المستخدمين الذين ينتظرون الموافقة
     document.getElementById('requests-table-body').innerHTML = `
        <tr>
            <td>اسم مستخدم تجريبي</td>
            <td>test@example.com</td>
            <td>2023-10-27</td>
            <td><button>تأكيد الاشتراك</button></td>
        </tr>
     `;
}

async function loadAllUsers() {
    console.log("جاري تحميل كل المستخدمين...");
    // هنا ستكتب كود جلب كل المستخدمين وعرضهم في جدول
    document.getElementById('users-content').innerHTML = '<p>جدول كل المستخدمين سيظهر هنا...</p>';
}


// --- تسجيل الخروج ---
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
});