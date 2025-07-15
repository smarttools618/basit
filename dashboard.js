// استبدل بالبيانات الخاصة بك
const SUPABASE_URL = 'https://gtznbmpueunibhwlpmtk.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0em5ibXB1ZXVuaWJod2xwbXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTA3NjYsImV4cCI6MjA2ODE2Njc2Nn0.0A4csTHneN1_SUDygKA9qvpRv_dPaU7QNCfLz1oG_Xs';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- عناصر الواجهة ---
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
        alert('يرجى تسجيل الدخول أولاً.');
        window.location.href = 'index.html';
        return;
    }

    // 2. تحقق من أن هذا المستخدم موجود في جدول الـ admins
    const { data: adminData, error } = await supabaseClient
        .from('admins')
        .select('role, full_name')
        .eq('user_id', user.id)
        .single();

    if (error || !adminData) {
        alert('ليس لديك صلاحية الوصول لهذه الصفحة.');
        await supabaseClient.auth.signOut(); // تسجيل الخروج للأمان
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
        statsSection.classList.remove('hidden');
        requestsSection.classList.remove('hidden');
        usersSection.classList.remove('hidden');
        loadStats();
        loadSubscriptionRequests();
        loadAllUsers();

    } else if (role === 'assistant') {
        requestsSection.classList.remove('hidden');
        loadSubscriptionRequests();
    }
}

// --- وظائف تحميل البيانات الحقيقية ---

async function loadStats() {
    const statsGrid = document.getElementById('stats-grid');
    statsGrid.innerHTML = '<div class="loading">جاري تحميل الإحصائيات...</div>';

    // جلب عدد كل المستخدمين
    const { count: totalUsers, error: totalError } = await supabaseClient
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // جلب عدد المشتركين في الباقة المدفوعة
    const { count: paidUsers, error: paidError } = await supabaseClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'paid');
    
    if(totalError || paidError) {
        statsGrid.innerHTML = '<p>حدث خطأ في جلب الإحصائيات.</p>';
        console.error(totalError || paidError);
        return;
    }

    statsGrid.innerHTML = `
        <div class="stat-card">
            <h4>إجمالي المستخدمين</h4>
            <p>${totalUsers}</p>
        </div>
        <div class="stat-card">
            <h4>الاشتراكات المدفوعة</h4>
            <p>${paidUsers}</p>
        </div>
         <div class="stat-card">
            <h4>النسبة المئوية للمدفوع</h4>
            <p>%${totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : 0}</p>
        </div>
    `;
}

async function loadSubscriptionRequests() {
    const tableBody = document.getElementById('requests-table-body');
    tableBody.innerHTML = '<tr><td colspan="4" class="loading">جاري تحميل الطلبات...</td></tr>';
    
    // جلب المستخدمين الذين ينتظرون الموافقة (pending_paid)
    const { data: requests, error } = await supabaseClient
        .from('profiles')
        .select('id, full_name, email, created_at')
        .eq('subscription_status', 'pending_paid');

    if (error) {
        tableBody.innerHTML = '<tr><td colspan="4">خطأ في تحميل الطلبات.</td></tr>';
        console.error(error);
        return;
    }

    if (requests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">لا توجد طلبات اشتراك جديدة حالياً.</td></tr>';
        return;
    }

    tableBody.innerHTML = requests.map(req => `
        <tr>
            <td>${req.full_name}</td>
            <td>${req.email}</td>
            <td>${new Date(req.created_at).toLocaleDateString('ar-EG')}</td>
            <td><button class="action-btn" data-userid="${req.id}">تأكيد الاشتراك</button></td>
        </tr>
    `).join('');
}

async function loadAllUsers() {
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = '<tr><td colspan="4" class="loading">جاري تحميل المستخدمين...</td></tr>';
    
    const { data: users, error } = await supabaseClient
        .from('profiles')
        .select('full_name, email, subscription_status, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        tableBody.innerHTML = '<tr><td colspan="4">خطأ في تحميل المستخدمين.</td></tr>';
        console.error(error);
        return;
    }

    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">لا يوجد مستخدمون مسجلون بعد.</td></tr>';
        return;
    }

    const statusMap = {
        'paid': { text: 'مدفوع', class: 'status-paid' },
        'free': { text: 'مجاني', class: 'status-free' },
        'pending_paid': { text: 'بانتظار الموافقة', class: 'status-pending' },
        'none': { text: 'لم يختر', class: 'status-free' }
    };

    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td>
                <span class="status-badge ${statusMap[user.subscription_status]?.class || 'status-free'}">
                    ${statusMap[user.subscription_status]?.text || 'غير محدد'}
                </span>
            </td>
            <td>${new Date(user.created_at).toLocaleDateString('ar-EG')}</td>
        </tr>
    `).join('');
}

// --- وظيفة لتأكيد الاشتراك ---
async function approveSubscription(userId) {
    // حساب تاريخ انتهاء الاشتراك (شهر من الآن)
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    const { error } = await supabaseClient
        .from('profiles')
        .update({ 
            subscription_status: 'paid',
            subscription_end_date: subscriptionEndDate.toISOString()
        })
        .eq('id', userId);

    if (error) {
        alert('حدث خطأ أثناء تأكيد الاشتراك: ' + error.message);
    } else {
        alert('تم تأكيد اشتراك المستخدم بنجاح!');
        // إعادة تحميل البيانات لتحديث الواجهة
        loadSubscriptionRequests();
        if (usersSection.classList.contains('hidden') === false) {
             loadAllUsers();
             loadStats();
        }
    }
}

// --- ربط الأحداث ---
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
});

// ربط حدث النقر على أزرار تأكيد الاشتراك
document.getElementById('requests-table-body').addEventListener('click', (e) => {
    if (e.target.matches('.action-btn')) {
        const userId = e.target.dataset.userid;
        if (confirm('هل أنت متأكد من رغبتك في تفعيل الاشتراك المدفوع لهذا المستخدم؟')) {
            approveSubscription(userId);
        }
    }
});