/**************************************************************
*  ملف dashboard.js - نسخة التحقيق والتشخيص الكاملة
**************************************************************/
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
const statsGrid = document.getElementById('stats-grid');

// --- وظيفة عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("=============== STARTING DASHBOARD SCRIPT ===============");

    // 1. تحقق من وجود مستخدم مسجل دخوله
    console.log("1. Checking for active user session...");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError) {
        console.error("   -> Error getting user session:", userError);
        alert("حدث خطأ أثناء التحقق من الجلسة. يرجى إعادة المحاولة.");
        window.location.href = 'index.html';
        return;
    }

    if (!user) {
        console.log("   -> No active user found. Redirecting to login page.");
        alert('يرجى تسجيل الدخول أولاً.');
        window.location.href = 'index.html';
        return;
    }
    
    console.log("   -> Active user found! User ID:", user.id);
    console.log("   -> User Email:", user.email);

    // 2. تحقق من أن هذا المستخدم موجود في جدول الـ admins
    console.log("2. Checking if user is in 'admins' table...");
    const { data: adminData, error: adminError } = await supabaseClient
        .from('admins')
        .select('role, full_name')
        .eq('user_id', user.id)
        .single();

    if (adminError) {
        console.error("   -> Error fetching from 'admins' table:", adminError);
        console.log("   -> This is the critical error. The RLS policy might be blocking the request or the JWT is invalid.");
        alert('خطأ في الوصول لبيانات المشرف. تأكد من أن RLS Policies صحيحة أو قم بتسجيل الدخول مرة أخرى.');
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
        return;
    }
    
    if (!adminData) {
        console.error("   -> User is NOT an admin. The query returned no data.");
        console.log("   -> This means the user.id does not match any user_id in the 'admins' table.");
        alert('ليس لديك صلاحية الوصول لهذه الصفحة.');
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
        return;
    }

    console.log("   -> SUCCESS! User is an admin. Role:", adminData.role);

    // 3. بناء لوحة التحكم بناءً على الدور
    const adminRole = adminData.role;
    const adminFullName = adminData.full_name;

    adminNameEl.textContent = adminFullName;
    adminRoleEl.textContent = adminRole === 'super_admin' ? 'صاحب الموقع' : 'مساعد';
    
    buildDashboard(adminRole);
});

function buildDashboard(role) {
    console.log("3. Building dashboard for role:", role);
    if (role === 'super_admin') {
        statsSection.classList.remove('hidden');
        usersSection.classList.remove('hidden');
        loadStats();
        loadAllUsers();
    } else if (role === 'assistant') {
        usersSection.classList.remove('hidden');
        loadAllUsers('pending_paid');
        if(userFilters) userFilters.querySelectorAll('button').forEach(btn => {
            if (btn.dataset.filter !== 'pending_paid') btn.disabled = true;
        });
    }
}

async function loadStats() {
    console.log("   -> Loading stats...");
    if(statsGrid) statsGrid.innerHTML = '<div class="loading">جاري تحميل الإحصائيات...</div>';

    const { count: totalUsers, error: totalError } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true });
    const { count: paidUsers, error: paidError } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'paid');
    
    if(totalError || paidError) {
        console.error("   -> Error loading stats:", totalError || paidError);
        if(statsGrid) statsGrid.innerHTML = '<p>حدث خطأ في جلب الإحصائيات.</p>';
        return;
    }

    console.log("   -> Stats loaded successfully.");
    if(statsGrid) statsGrid.innerHTML = `
        <div class="stat-card"><h4>إجمالي المستخدمين</h4><p>${totalUsers}</p></div>
        <div class="stat-card"><h4>الاشتراكات المدفوعة</h4><p>${paidUsers}</p></div>
        <div class="stat-card"><h4>النسبة المئوية للمدفوع</h4><p>%${totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : 0}</p></div>
    `;
}

async function loadAllUsers(filter = 'all', searchTerm = '') {
    console.log(`4. Loading users with filter: '${filter}' and search: '${searchTerm}'`);
    if(usersTableBody) usersTableBody.innerHTML = '<tr><td colspan="5" class="loading">جاري تحميل المستخدمين...</td></tr>';
    
    let query = supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });

    if (filter !== 'all') { query = query.eq('subscription_status', filter); }
    if (searchTerm) { query = query.ilike('email', `%${searchTerm}%`); }

    const { data: users, error } = await query;
    if (error) { 
        console.error("   -> CRITICAL ERROR fetching from 'profiles':", error);
        if(usersTableBody) usersTableBody.innerHTML = '<tr><td colspan="5">خطأ في تحميل المستخدمين. تحقق من الـ Console.</td></tr>'; 
        return; 
    }
    
    console.log("   -> Successfully fetched", users.length, "users.");

    if (users.length === 0) {
        if(usersTableBody) usersTableBody.innerHTML = '<tr><td colspan="5">لا يوجد مستخدمون يطابقون هذا البحث.</td></tr>';
        return;
    }

    const statusMap = {
        'paid': { text: 'مدفوع', class: 'status-paid' },
        'free': { text: 'مجاني', class: 'status-free' },
        'pending_paid': { text: 'بانتظار الموافقة', class: 'status-pending' },
        'none': { text: 'لم يختر', class: 'status-free' }
    };

    if(usersTableBody) usersTableBody.innerHTML = users.map(user => {
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

async function approveSubscription(userId) {
    console.log(`   -> Approving subscription for user: ${userId}`);
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    const { error } = await supabaseClient
        .from('profiles')
        .update({ subscription_status: 'paid', subscription_end_date: subscriptionEndDate.toISOString() })
        .eq('id', userId);

    if (error) {
        alert('حدث خطأ أثناء تأكيد الاشتراك: ' + error.message);
    } else {
        alert('تم تأكيد اشتراك المستخدم بنجاح!');
        loadAllUsers(userFilters.querySelector('.active').dataset.filter, userSearch.value);
        loadStats();
    }
}

async function deleteUser(userId) {
    console.log(`   -> Attempting to delete user: ${userId}`);
    alert("ميزة حذف المستخدم تتطلب وظيفة Edge Function آمنة على الخادم. هذه الميزة ستكون جاهزة في الخطوة التالية من التطوير.");
}

// --- ربط الأحداث ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        console.log("User clicked logout.");
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });
}

if (userFilters) {
    userFilters.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            userFilters.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            const filter = e.target.dataset.filter;
            loadAllUsers(filter, userSearch.value);
        }
    });
}

let searchTimeout;
if (userSearch) {
    userSearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const filter = userFilters.querySelector('.active').dataset.filter;
            loadAllUsers(filter, e.target.value);
        }, 500);
    });
}

if (usersTableBody) {
    usersTableBody.addEventListener('click', (e) => {
        const target = e.target;
        if (!target.dataset.userid) return;
        
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
}