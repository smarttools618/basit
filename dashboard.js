const SUPABASE_URL = 'https://gtznbmpueunibhwlpmtk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0em5ibXB1ZXVuaWJod2xwbXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTA3NjYsImV4cCI6MjA2ODE2Njc2Nn0.0A4csTHneN1_SUDygKA9qvpRv_dPaU7QNCfLz1oG_Xs';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- عناصر الواجهة ---
const adminNameEl = document.getElementById('admin-name');
const adminRoleEl = document.getElementById('admin-role');
const logoutBtn = document.getElementById('logout-btn');

const statsSection = document.getElementById('stats-section');
const usersSection = document.getElementById('users-section');
const usersTableBody = document.getElementById('users-table-body');
const userFilters = document.getElementById('user-filters');
const userSearch = document.getElementById('user-search');

// --- وظيفة عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) { window.location.href = 'index.html'; return; }

    const { data: adminData, error } = await supabaseClient.from('admins').select('role, full_name').eq('user_id', user.id).single();
    if (error || !adminData) {
        alert('ليس لديك صلاحية الوصول لهذه الصفحة.');
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
        return;
    }

    adminNameEl.textContent = adminData.full_name;
    adminRoleEl.textContent = adminData.role === 'super_admin' ? 'صاحب الموقع' : 'مساعد';
    buildDashboard(adminData.role);
});

function buildDashboard(role) {
    if (role === 'super_admin') {
        statsSection.classList.remove('hidden');
        usersSection.classList.remove('hidden');
        loadStats();
        loadAllUsers(); // سيتم تحميل كل المستخدمين افتراضياً
    } else if (role === 'assistant') {
        // المساعد يرى فقط الطلبات المعلقة
        usersSection.classList.remove('hidden');
        loadAllUsers('pending_paid');
        // تعطيل الفلاتر للمساعد
        userFilters.querySelectorAll('button').forEach(btn => {
            if (btn.dataset.filter !== 'pending_paid') btn.disabled = true;
        });
    }
}

// --- وظائف تحميل البيانات ---
async function loadStats() { /* ... نفس الكود السابق ... */ }

async function loadAllUsers(filter = 'all', searchTerm = '') {
    usersTableBody.innerHTML = '<tr><td colspan="5" class="loading">جاري تحميل المستخدمين...</td></tr>';
    
    let query = supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });

    // تطبيق الفلتر
    if (filter !== 'all') {
        query = query.eq('subscription_status', filter);
    }
    // تطبيق البحث
    if (searchTerm) {
        query = query.ilike('email', `%${searchTerm}%`);
    }

    const { data: users, error } = await query;

    if (error) { usersTableBody.innerHTML = '<tr><td colspan="5">خطأ في تحميل المستخدمين.</td></tr>'; console.error(error); return; }
    if (users.length === 0) { usersTableBody.innerHTML = '<tr><td colspan="5">لا يوجد مستخدمون يطابقون هذا البحث.</td></tr>'; return; }

    const statusMap = {
        'paid': { text: 'مدفوع', class: 'status-paid' },
        'free': { text: 'مجاني', class: 'status-free' },
        'pending_paid': { text: 'بانتظار الموافقة', class: 'status-pending' },
        'none': { text: 'لم يختر', class: 'status-free' }
    };

    usersTableBody.innerHTML = users.map(user => {
        const statusInfo = statusMap[user.subscription_status] || statusMap['none'];
        return `
            <tr>
                <td>${user.full_name || 'لا يوجد اسم'}</td>
                <td>${user.email}</td>
                <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString('ar-EG')}</td>
                <td>
                    ${user.subscription_status === 'pending_paid' ? `<button class="action-btn" data-userid="${user.id}">تأكيد</button>` : ''}
                    <button class="delete-btn" data-userid="${user.id}" title="حذف المستخدم">X</button>
                </td>
            </tr>
        `;
    }).join('');
}

// --- وظائف الإجراءات ---
async function approveSubscription(userId) { /* ... نفس الكود السابق ... */ }

async function deleteUser(userId) {
    alert("ميزة حذف المستخدم تتطلب وظيفة Edge Function آمنة على الخادم. هذه الميزة ستكون جاهزة في الخطوة التالية من التطوير.");
    // للتوضيح: لا يجب حذف المستخدم مباشرة من العميل أبداً لأسباب أمنية.
    // الخطوة الصحيحة هي استدعاء وظيفة Edge Function لها صلاحيات المشرف.
    // const { error } = await supabaseClient.functions.invoke('delete-user', { body: { userId } });
}

// --- ربط الأحداث ---
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
});

// أحداث الفلترة والبحث
userFilters.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        userFilters.querySelector('.active').classList.remove('active');
        e.target.classList.add('active');
        const filter = e.target.dataset.filter;
        loadAllUsers(filter, userSearch.value);
    }
});

let searchTimeout;
userSearch.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const filter = userFilters.querySelector('.active').dataset.filter;
        loadAllUsers(filter, e.target.value);
    }, 500); // تأخير البحث لتجنب الطلبات الكثيرة أثناء الكتابة
});

// حدث النقر على أزرار الإجراءات داخل الجدول
usersTableBody.addEventListener('click', (e) => {
    const target = e.target;
    const userId = target.dataset.userid;

    if (target.matches('.action-btn')) {
        if (confirm('هل أنت متأكد من تفعيل الاشتراك المدفوع لهذا المستخدم؟')) {
            approveSubscription(userId);
        }
    } else if (target.matches('.delete-btn')) {
        if (confirm(`تحذير: سيتم حذف المستخدم وحسابه بالكامل. هل أنت متأكد؟`)) {
            deleteUser(userId);
        }
    }
});