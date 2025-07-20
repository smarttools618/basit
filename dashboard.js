// =======================================================
// الكود الكامل والنهائي لملف dashboard.js
// =======================================================

const SUPABASE_URL = 'https://yjujdodudllhlgvhrhsw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdWpkb2R1ZGxsaGxndmhyaHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTQxMzIsImV4cCI6MjA2ODM3MDEzMn0.P7rLD-7hu9fRTSFfm_RuoGqjTmvXTUmPELQC0e7rOmU';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loader = document.getElementById('loader');
let currentAdmin = null;

// --- التهيئة عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', async () => {
    showLoader(true);
    await checkSessionAndInitialize();
    setupEventListeners();
    showLoader(false);
});

// --- التحقق من الجلسة والصلاحيات ---
async function checkSessionAndInitialize() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session) {
        window.location.href = 'index.html';
        return;
    }

    const { data: adminData, error: adminError } = await supabaseClient
        .from('admins')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

    if (adminError || !adminData || !['admin', 'super_admin'].includes(adminData.role)) {
        alert('ليس لديك صلاحية الوصول لهذه الصفحة.');
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
        return;
    }
    
    currentAdmin = adminData;
    initializeDashboard();
}

// --- إعداد الواجهة بناءً على الدور ---
function initializeDashboard() {
    const roleNames = { 'super_admin': 'مدير أعلى', 'admin': 'مدير' };
    document.getElementById('admin-name').textContent = currentAdmin.full_name;
    document.getElementById('admin-role').textContent = roleNames[currentAdmin.role];

    setupNavigation();
    loadAllData();
}

function loadAllData() {
    loadOverviewStats();
    loadContent(); // تحميل المحتوى المعلق والمنشور
    
    if (['admin', 'super_admin'].includes(currentAdmin.role)) {
        loadOffers();
    }
    if (currentAdmin.role === 'super_admin') {
        loadAdmins();
    }
}

// --- إعداد التنقل وإظهار/إخفاء الأقسام ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    if (['admin', 'super_admin'].includes(currentAdmin.role)) {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }
    if (currentAdmin.role === 'super_admin') {
        document.querySelectorAll('.super-admin-only').forEach(el => el.style.display = 'block');
    }
}

// --- ربط كل الأحداث (Event Listeners) ---
function setupEventListeners() {
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    // تبويبات المحتوى
    document.querySelector('.tabs').addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-link')) {
            document.querySelectorAll('.tab-link').forEach(tab => tab.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(e.target.dataset.tab).classList.add('active');
        }
    });

    // أحداث إدارة المحتوى
    document.getElementById('pending-content-table').addEventListener('click', handleContentAction);
    document.getElementById('approved-content-table').addEventListener('click', handleContentAction);

    // أحداث إدارة العروض
    document.getElementById('offer-form').addEventListener('submit', handleOfferSubmit);
    document.getElementById('cancel-edit-offer').addEventListener('click', cancelOfferEdit);
    document.getElementById('offers-table-body').addEventListener('click', handleOfferActions);

    // أحداث إدارة الأعضاء
    document.getElementById('add-admin-form').addEventListener('submit', handleAddAdmin);
    document.getElementById('admins-table-body').addEventListener('click', handleAdminActions);
    
    // أحداث الإعدادات
    document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
}

// --- وظائف قسم نظرة عامة ---
async function loadOverviewStats() {
    const statsGrid = document.getElementById('stats-grid');
    statsGrid.innerHTML = `<div>جاري تحميل الإحصائيات...</div>`;
    // ... يمكن إضافة منطق إحصائيات أكثر تعقيداً هنا
    const { count: pendingCount } = await supabaseClient.from('content').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    statsGrid.innerHTML = `
        <div class="stat-card pending">
            <div class="icon"><i class="fas fa-hourglass-half"></i></div>
            <div class="info"><h4>محتوى قيد المراجعة</h4><p>${pendingCount || 0}</p></div>
        </div>
    `;
}

// --- وظائف قسم إدارة المحتوى ---
async function loadContent() {
    showLoader(true);
    const { data, error } = await supabaseClient
        .from('content')
        .select(`*, admin:admins(full_name)`)
        .in('status', ['pending', 'approved', 'rejected']);
    
    showLoader(false);
    if (error) { console.error('Error loading content:', error); return; }

    const pending = data.filter(item => item.status === 'pending');
    const approved = data.filter(item => item.status === 'approved' || item.status === 'rejected');
    
    document.getElementById('pending-count-badge').textContent = pending.length;
    
    const pendingTable = document.getElementById('pending-content-table').querySelector('tbody');
    const approvedTable = document.getElementById('approved-content-table').querySelector('tbody');

    const catNames = { lesson: 'درس', exercise: 'تمرين', summary: 'ملخص' };

    pendingTable.innerHTML = pending.length ? pending.map(item => `
        <tr data-id="${item.id}">
            <td>${item.title}</td>
            <td>${catNames[item.category] || item.category}</td>
            <td>السنة ${item.level}</td>
            <td>${item.admin?.full_name || 'غير معروف'}</td>
            <td class="action-buttons">
                <a href="${item.gdrive_link}" target="_blank" title="عرض الملف" class="edit-btn"><i class="fas fa-eye"></i></a>
                <button class="approve-btn" title="موافقة"><i class="fas fa-check"></i></button>
                <button class="reject-btn" title="رفض"><i class="fas fa-times"></i></button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="5">لا يوجد محتوى للمراجعة حالياً.</td></tr>';
    
    const statusInfo = { approved: {text: 'مقبول', class: 'approve'}, rejected: {text: 'مرفوض', class: 'danger'} };
    approvedTable.innerHTML = approved.length ? approved.map(item => `
        <tr data-id="${item.id}">
            <td>${item.title}</td>
            <td>${catNames[item.category] || item.category}</td>
            <td>السنة ${item.level}</td>
            <td>${item.admin?.full_name || 'غير معروف'} (<span class="status-badge-${statusInfo[item.status].class}">${statusInfo[item.status].text}</span>)</td>
            <td class="action-buttons">
                <button class="delete-btn" title="حذف نهائي"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="5">لا يوجد محتوى منشور أو مرفوض حالياً.</td></tr>';
}

async function handleContentAction(e) {
    const button = e.target.closest('button');
    if (!button) return;
    const row = button.closest('tr');
    const contentId = row.dataset.id;

    showLoader(true);
    if (button.classList.contains('approve-btn')) {
        await supabaseClient.from('content').update({ status: 'approved' }).eq('id', contentId);
    } else if (button.classList.contains('reject-btn')) {
        await supabaseClient.from('content').update({ status: 'rejected' }).eq('id', contentId);
    } else if (button.classList.contains('delete-btn')) {
        if (confirm("هل أنت متأكد من الحذف النهائي لهذا المحتوى؟ لا يمكن التراجع عن هذا الإجراء.")) {
            await supabaseClient.from('content').delete().eq('id', contentId);
        }
    }
    showLoader(false);
    loadContent();
    loadOverviewStats();
}

// --- وظائف قسم إدارة العروض ---
async function loadOffers() {
    const { data, error } = await supabaseClient.from('offers').select('*').order('price');
    if (error) { console.error("Error loading offers:", error); return; }
    
    const tableBody = document.getElementById('offers-table-body');
    tableBody.innerHTML = data.length ? data.map(offer => `
        <tr data-offer='${JSON.stringify(offer)}'>
            <td>${offer.name}</td>
            <td>${offer.price} د.ت</td>
            <td>${offer.duration_days === 30 ? 'شهري' : offer.duration_days === 365 ? 'سنوي' : `${offer.duration_days} يوم`}</td>
            <td class="action-buttons">
                <button class="edit-btn" title="تعديل"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" title="حذف"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="4">لم يتم إضافة عروض بعد.</td></tr>';
}

async function handleOfferSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const offerId = form.querySelector('#offer-id').value;
    const offerData = {
        name: form.querySelector('#offer-name').value,
        price: form.querySelector('#offer-price').value,
        duration_days: form.querySelector('#offer-duration').value,
        description: form.querySelector('#offer-description').value,
    };
    showLoader(true);
    const { error } = offerId
        ? await supabaseClient.from('offers').update(offerData).eq('id', offerId)
        : await supabaseClient.from('offers').insert([offerData]);
    showLoader(false);

    if (error) alert("خطأ في حفظ العرض: " + error.message);
    else { cancelOfferEdit(); loadOffers(); }
}

function handleOfferActions(e) {
    const button = e.target.closest('button');
    if (!button) return;
    const row = button.closest('tr');
    const offer = JSON.parse(row.dataset.offer);

    if (button.classList.contains('edit-btn')) {
        document.getElementById('offer-id').value = offer.id;
        document.getElementById('offer-name').value = offer.name;
        document.getElementById('offer-price').value = offer.price;
        document.getElementById('offer-duration').value = offer.duration_days;
        document.getElementById('offer-description').value = offer.description;
        document.getElementById('cancel-edit-offer').classList.remove('hidden');
    } else if (button.classList.contains('delete-btn')) {
        if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
            deleteOffer(offer.id);
        }
    }
}

function cancelOfferEdit() {
    document.getElementById('offer-form').reset();
    document.getElementById('offer-id').value = '';
    document.getElementById('cancel-edit-offer').classList.add('hidden');
}

async function deleteOffer(id) {
    showLoader(true);
    const { error } = await supabaseClient.from('offers').delete().eq('id', id);
    showLoader(false);
    if (error) alert("خطأ في حذف العرض: " + error.message); 
    else loadOffers();
}

// --- وظائف قسم إدارة الأعضاء (Super Admin) ---
async function loadAdmins() {
    const { data, error } = await supabaseClient.from('admins').select('id, role, full_name, user_id');
    if (error) { console.error("Error loading admins:", error); return; }

    const tableBody = document.getElementById('admins-table-body');
    tableBody.innerHTML = data.map(admin => `
        <tr>
            <td>${admin.full_name || 'N/A'}</td>
            <td><span class="role-badge">${admin.role === 'super_admin' ? 'مدير أعلى' : admin.role === 'admin' ? 'مدير' : 'مساعد'}</span></td>
            <td class="action-buttons">
                ${admin.user_id !== currentAdmin.user_id ? `<button class="delete-btn" data-userid="${admin.user_id}" title="حذف"><i class="fas fa-trash"></i></button>` : 'حسابك الحالي'}
            </td>
        </tr>
    `).join('');
}

async function handleAddAdmin(e) {
    e.preventDefault();
    alert("تنبيه أمني: إضافة مشرف جديد يجب أن تتم عبر دالة سحابية (Edge Function) لتأمين المفاتيح السرية.\nهذه محاكاة للعملية فقط ولا تقوم بإضافة فعلية.");
    // للتنفيذ الفعلي، ستقوم باستدعاء دالة سحابية هنا
    // await supabaseClient.functions.invoke('create-admin-user', { body: { ... } })
}

async function handleAdminActions(e) {
    const button = e.target.closest('.delete-btn');
    if (!button) return;
    
    if (confirm("هل أنت متأكد من حذف هذا العضو؟ سيتم حذف حسابه بالكامل. هذا الإجراء لا يمكن التراجع عنه.")) {
        alert("تنبيه أمني: حذف مشرف يجب أن يتم عبر دالة سحابية (Edge Function).");
        // للتنفيذ الفعلي، ستقوم باستدعاء دالة سحابية هنا
        // await supabaseClient.functions.invoke('delete-admin-user', { body: { userId: button.dataset.userid } })
    }
}

// --- وظائف قسم الإعدادات ---
async function handleChangePassword(e) {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    if (newPassword.length < 6) { alert("يجب أن تكون كلمة السر 6 أحرف على الأقل."); return; }
    
    showLoader(true);
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    showLoader(false);

    if (error) {
        alert("حدث خطأ أثناء تغيير كلمة السر: " + error.message);
    } else {
        alert("تم تغيير كلمة السر بنجاح. سيتم تسجيل خروجك الآن.");
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    }
}

// --- وظيفة إظهار/إخفاء التحميل ---
function showLoader(show) {
    loader.style.display = show ? 'flex' : 'none';
}