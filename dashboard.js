// =======================================================
// الكود الكامل والنهائي لملف dashboard.js
// =======================================================

const SUPABASE_URL = 'https://yjujdodudllhlgvhrhsw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdWpkb2R1ZGxsaGxndmhyaHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTQxMzIsImV4cCI6MjA2ODM3MDEzMn0.P7rLD-7hu9fRTSFfm_RuoGqjTmvXTUmPELQC0e7rOmU';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- تهيئة عناصر الواجهة الرئيسية ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. التحقق من هوية المشرف
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    const { data: adminData } = await supabaseClient.from('admins').select('role, full_name').eq('user_id', user.id).single();
    if (!adminData) {
        alert('ليس لديك صلاحية الوصول لهذه الصفحة.');
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
        return;
    }

    // 2. تعيين بيانات المشرف في الهيدر
    document.getElementById('admin-name').textContent = adminData.full_name;
    document.getElementById('admin-role').textContent = adminData.role === 'super_admin' ? 'صاحب الموقع' : 'مساعد';

    // 3. إعداد التنقل بين التبويبات
    setupNavigation(adminData.role);

    // 4. تحميل البيانات بناءً على دور المشرف
    initializeDashboard(adminData.role, user.id);

    // 5. ربط الأحداث (Event Listeners)
    setupEventListeners();
});


// --- وظائف إعداد الواجهة والتنقل ---
function setupNavigation(role) {
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

    if (role === 'assistant') {
        document.querySelector('a[href="#admins"]').parentElement.style.display = 'none';
        document.querySelector('a[href="#offers"]').parentElement.style.display = 'none';
    }
}

function initializeDashboard(role, currentAdminId) {
    if (role === 'super_admin') {
        loadOverviewStats();
        loadOffers();
        loadAdmins(currentAdminId);
        // يمكنك إضافة دوال تحميل الأقسام الأخرى هنا
    }
}

function setupEventListeners() {
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    document.getElementById('offer-form').addEventListener('submit', handleOfferSubmit);
    document.getElementById('cancel-edit-offer').addEventListener('click', cancelOfferEdit);
    document.getElementById('offers-table-body').addEventListener('click', handleOfferActions);
    document.getElementById('add-admin-form').addEventListener('submit', handleAddAdmin);
    document.getElementById('admins-table-body').addEventListener('click', handleAdminActions);
}


// --- وظائف قسم نظرة عامة (Overview) ---
async function loadOverviewStats() {
    const statsGrid = document.getElementById('stats-grid');
    if (!statsGrid) return;
    statsGrid.innerHTML = `<div>جاري تحميل الإحصائيات...</div>`;

    const { count: totalUsers } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true });
    const { count: paidUsers } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'paid');
    const { data: offers } = await supabaseClient.from('offers').select('price');
    
    // حساب تقديري للأرباح بناء على كل العروض المدفوعة
    const estimatedRevenue = (paidUsers || 0) * (offers?.find(o => o.price > 0)?.price || 10);

    statsGrid.innerHTML = `
        <div class="stat-card"><h4>إجمالي المستخدمين</h4><p>${totalUsers || 0}</p></div>
        <div class="stat-card"><h4>الاشتراكات المدفوعة</h4><p>${paidUsers || 0}</p></div>
        <div class="stat-card"><h4>الاشتراكات المجانية</h4><p>${(totalUsers || 0) - (paidUsers || 0)}</p></div>
        <div class="stat-card"><h4>الأرباح الشهرية (تقديري)</h4><p>${estimatedRevenue} د.ت</p></div>
    `;
}


// --- وظائف قسم إدارة العروض (Offers) ---
async function loadOffers() {
    const { data, error } = await supabaseClient.from('offers').select('*').order('price');
    if (error) { console.error("Error loading offers:", error); return; }
    
    const tableBody = document.getElementById('offers-table-body');
    tableBody.innerHTML = data.map(offer => `
        <tr data-offer='${JSON.stringify(offer)}'>
            <td>${offer.name}</td>
            <td>${offer.price} د.ت</td>
            <td>${offer.duration_days === 30 ? 'شهري' : 'سنوي'}</td>
            <td class="action-buttons">
                <button class="edit-btn" data-id="${offer.id}" title="تعديل"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${offer.id}" title="حذف"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
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

    const { error } = offerId
        ? await supabaseClient.from('offers').update(offerData).eq('id', offerId)
        : await supabaseClient.from('offers').insert([offerData]);

    if (error) {
        alert("خطأ في حفظ العرض: " + error.message);
    } else {
        alert("تم حفظ العرض بنجاح!");
        cancelOfferEdit();
        loadOffers();
    }
}

function handleOfferActions(e) {
    const button = e.target.closest('button');
    if (!button) return;
    const id = button.dataset.id;
    if (button.classList.contains('edit-btn')) {
        const row = button.closest('tr');
        const offer = JSON.parse(row.dataset.offer);
        document.getElementById('offer-id').value = offer.id;
        document.getElementById('offer-name').value = offer.name;
        document.getElementById('offer-price').value = offer.price;
        document.getElementById('offer-duration').value = offer.duration_days;
        document.getElementById('offer-description').value = offer.description;
        document.getElementById('cancel-edit-offer').classList.remove('hidden');
    } else if (button.classList.contains('delete-btn')) {
        if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
            deleteOffer(id);
        }
    }
}

function cancelOfferEdit() {
    document.getElementById('offer-form').reset();
    document.getElementById('offer-id').value = '';
    document.getElementById('cancel-edit-offer').classList.add('hidden');
}

async function deleteOffer(id) {
    const { error } = await supabaseClient.from('offers').delete().eq('id', id);
    if (error) { alert("خطأ في حذف العرض: " + error.message); } 
    else { loadOffers(); }
}


// --- وظائف قسم إدارة الأعضاء (Admins) ---
async function loadAdmins(currentAdminId) {
    const { data, error } = await supabaseClient.from('admins').select('id, role, full_name, user_id');
    if (error) { console.error("Error loading admins:", error); return; }

    const tableBody = document.getElementById('admins-table-body');
    tableBody.innerHTML = data.map(admin => `
        <tr>
            <td>${admin.full_name || 'N/A'}</td>
            <td>${admin.role === 'super_admin' ? 'صاحب الموقع' : 'مساعد'}</td>
            <td class="action-buttons">
                ${admin.user_id !== currentAdminId ? `<button class="delete-btn" data-id="${admin.id}" data-userid="${admin.user_id}" title="حذف"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function handleAddAdmin(e) {
    e.preventDefault();
    alert("تنبيه أمني: إضافة مشرف جديد يجب أن تتم عبر Supabase Edge Function لتأمين المفاتيح السرية.\nهذه محاكاة للعملية فقط.");
    console.log("Simulating Add Admin...");
    console.log({
        email: document.getElementById('admin-email').value,
        password: 'a-secure-password',
        full_name: document.getElementById('admin-full-name').value,
        role: document.getElementById('admin-role-select').value
    });
    document.getElementById('add-admin-form').reset();
    // In a real scenario, you would call an Edge Function here:
    // const { error } = await supabaseClient.functions.invoke('create-admin-user', { body: { ... } });
}

async function handleAdminActions(e) {
    const button = e.target.closest('button');
    if (!button || !button.classList.contains('delete-btn')) return;
    
    if (confirm("هل أنت متأكد من حذف هذا العضو؟ سيتم حذف حسابه بالكامل.")) {
        alert("تنبيه أمني: حذف مشرف يجب أن يتم عبر Supabase Edge Function.");
        // const adminUserId = button.dataset.userid;
        // const { error } = await supabaseClient.functions.invoke('delete-admin-user', { body: { userId: adminUserId } });
    }
}