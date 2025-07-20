import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// =======================================================
// الكود الكامل والنهائي لملف dashboard.js - نسخة شاملة
// =======================================================

const SUPABASE_URL = 'https://yjujdodudllhlgvhrhsw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdWpkb2R1ZGxsaGxndmhyaHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTQxMzIsImV4cCI6MjA2ODM3MDEzMn0.P7rLD-7hu9fRTSFfm_RuoGqjTmvXTUmPELQC0e7rOmU';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentAdmin = null;

// --- Role to Text Mapping ---
const roleMap = {
    super_admin: 'صاحب الموقع',
    admin: 'مدير',
    assistant: 'مساعد'
};

// --- تهيئة عناصر الواجهة الرئيسية ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const { data: adminData, error } = await supabaseClient.from('admins').select('id, role, full_name, user_id, email').eq('user_id', user.id).single();
    if (!adminData || error) {
        alert('ليس لديك صلاحية الوصول لهذه الصفحة.');
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
        return;
    }
    currentAdmin = adminData;

    document.getElementById('admin-name').textContent = currentAdmin.full_name;
    document.getElementById('admin-role').textContent = roleMap[currentAdmin.role] || 'غير معروف';

    setupNavigationAndInterface(currentAdmin.role);
    initializeDashboard(currentAdmin.role, user.id);
    setupEventListeners(currentAdmin.role);
});

// --- وظائف إعداد الواجهة والتنقل ---
function setupNavigationAndInterface(role) {
    const navItems = document.querySelectorAll('.sidebar-menu li');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(li => {
        const access = li.dataset.roleAccess;
        if (access === 'all' || access.split(',').some(r => role.includes(r.trim()))) {
            li.style.display = 'block';
        } else {
            li.style.display = 'none';
        }
    });

    let defaultPage = 'overview';
    if (role === 'assistant') defaultPage = 'add-content';
    else if (role === 'admin') defaultPage = 'content';
    
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));

    const defaultLink = document.querySelector(`a[href="#${defaultPage}"]`);
    if(defaultLink) defaultLink.classList.add('active');
    const defaultPageElement = document.getElementById(defaultPage);
    if(defaultPageElement) defaultPageElement.classList.add('active');


    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });
}

function initializeDashboard(role, currentAdminId) {
    loadOverviewStats();
    updatePendingCountBadge();
    if (role === 'super_admin' || role === 'admin') {
        loadCourseContent();
        loadSubmissions();
        loadOffers();
    }
    if (role === 'super_admin') {
        loadAdmins(currentAdminId);
    }
    if (role === 'assistant') {
        loadMySubmissions();
    }
}

function setupEventListeners(role) {
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });
    document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);

    if (role === 'super_admin' || role === 'admin') {
        document.getElementById('content-form').addEventListener('submit', handleContentFormSubmit);
        document.getElementById('cancel-edit-content').addEventListener('click', cancelContentEdit);
        document.getElementById('content-table-body').addEventListener('click', handleContentActions);
        document.getElementById('submissions-table-body').addEventListener('click', handleSubmissionAction);
        document.getElementById('offer-form').addEventListener('submit', handleOfferSubmit);
        document.getElementById('cancel-edit-offer').addEventListener('click', cancelOfferEdit);
        document.getElementById('offers-table-body').addEventListener('click', handleOfferActions);
    }
    if (role === 'super_admin') {
         document.getElementById('add-admin-form').addEventListener('submit', handleAddAdmin);
         document.getElementById('admins-table-body').addEventListener('click', handleAdminActions);
    }
    if (role === 'assistant') {
        document.getElementById('content-submission-form').addEventListener('submit', handleContentSubmission);
        document.getElementById('my-submissions-table-body').addEventListener('click', handleMySubmissionActions);
        document.getElementById('cancel-edit-submission').addEventListener('click', cancelSubmissionEdit);
    }
}

// --- قسم نظرة عامة (محسّن) ---
async function loadOverviewStats() {
    const statsGrid = document.getElementById('stats-grid');
    if (!statsGrid) return;
    statsGrid.innerHTML = `<div>جاري تحميل الإحصائيات...</div>`;

    const { count: totalUsers } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalContent } = await supabaseClient.from('course_content').select('*', { count: 'exact', head: true });
    const { count: pendingSubmissions } = await supabaseClient.from('content_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: totalAdmins } = await supabaseClient.from('admins').select('*', { count: 'exact', head: true });

    statsGrid.innerHTML = `
        <div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><h4>إجمالي المستخدمين</h4><p>${totalUsers || 0}</p></div></div>
        <div class="stat-card"><div class="stat-icon"><i class="fas fa-book-reader"></i></div><div class="stat-info"><h4>إجمالي المحتوى</h4><p>${totalContent || 0}</p></div></div>
        <div class="stat-card"><div class="stat-icon"><i class="fas fa-inbox"></i></div><div class="stat-info"><h4>طلبات معلقة</h4><p>${pendingSubmissions || 0}</p></div></div>
        <div class="stat-card"><div class="stat-icon"><i class="fas fa-user-shield"></i></div><div class="stat-info"><h4>فريق العمل</h4><p>${totalAdmins || 0}</p></div></div>
    `;
}

async function updatePendingCountBadge() {
    const badge = document.getElementById('pending-count-badge');
    const { count } = await supabaseClient.from('content_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// --- قسم الإعدادات ---
async function handleChangePassword(e) {
    e.preventDefault();
    const form = e.target;
    const newPassword = form.querySelector('#new-password').value;
    const confirmPassword = form.querySelector('#confirm-password').value;

    if (newPassword.length < 6) {
        alert("يجب أن تكون كلمة المرور 6 أحرف على الأقل.");
        return;
    }
    if (newPassword !== confirmPassword) {
        alert("كلمتا المرور غير متطابقتين.");
        return;
    }

    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) {
        alert("خطأ في تحديث كلمة المرور: " + error.message);
    } else {
        alert("تم تغيير كلمة المرور بنجاح.");
        form.reset();
    }
}

// --- قسم إدارة المحتوى ---
function convertGoogleDriveLink(url) {
    const regex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    if (match && match[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
    return null;
}

async function loadCourseContent() {
    const { data, error } = await supabaseClient.from('course_content').select('*').order('created_at', { ascending: false });
    if (error) { console.error("Error loading course content:", error); return; }
    
    const tableBody = document.getElementById('content-table-body');
    tableBody.innerHTML = data.map(item => `
        <tr data-content='${JSON.stringify(item)}'>
            <td>${item.title}</td>
            <td>${item.subject}</td>
            <td>${item.level}</td>
            <td class="action-buttons">
                <button class="edit-btn" title="تعديل"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" title="حذف"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function handleContentFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const contentId = form.querySelector('#content-id').value;
    const driveLink = form.querySelector('#content-drive-link').value;
    const downloadLink = convertGoogleDriveLink(driveLink);

    if (!downloadLink) {
        alert("رابط Google Drive غير صالح. يرجى استخدام رابط بصيغة '.../file/d/FILE_ID/...'");
        return;
    }

    const contentData = {
        title: form.querySelector('#content-title').value,
        drive_link: driveLink,
        download_link: downloadLink,
        trimester: form.querySelector('#content-trimester').value,
        subject: form.querySelector('#content-subject').value,
        level: form.querySelector('#content-level').value,
        added_by: currentAdmin.user_id
    };

    const query = contentId
        ? supabaseClient.from('course_content').update(contentData).eq('id', contentId)
        : supabaseClient.from('course_content').insert([contentData]);

    const { error } = await query;
    if (error) {
        alert("خطأ في حفظ المحتوى: " + error.message);
    } else {
        alert("تم حفظ المحتوى بنجاح!");
        cancelContentEdit();
        loadCourseContent();
        loadOverviewStats();
    }
}

function handleContentActions(e) {
    const button = e.target.closest('button');
    if (!button) return;
    const row = button.closest('tr');
    const content = JSON.parse(row.dataset.content);

    if (button.classList.contains('edit-btn')) {
        document.getElementById('content-id').value = content.id;
        document.getElementById('content-title').value = content.title;
        document.getElementById('content-drive-link').value = content.drive_link;
        document.getElementById('content-trimester').value = content.trimester;
        document.getElementById('content-subject').value = content.subject;
        document.getElementById('content-level').value = content.level;
        document.getElementById('cancel-edit-content').classList.remove('hidden');
        document.querySelector('#content-form button[type="submit"]').textContent = 'تحديث المحتوى';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (button.classList.contains('delete-btn')) {
        if (confirm("هل أنت متأكد من حذف هذا المحتوى؟")) {
            deleteContent(content.id);
        }
    }
}

function cancelContentEdit() {
    document.getElementById('content-form').reset();
    document.getElementById('content-id').value = '';
    document.getElementById('cancel-edit-content').classList.add('hidden');
    document.querySelector('#content-form button[type="submit"]').textContent = 'حفظ المحتوى';
}

async function deleteContent(id) {
    const { error } = await supabaseClient.from('course_content').delete().eq('id', id);
    if (error) { alert("خطأ في حذف المحتوى: " + error.message); } 
    else { 
        loadCourseContent(); 
        loadOverviewStats();
    }
}

// --- قسم إدارة الأعضاء ---
async function loadAdmins(currentAdminId) {
    const { data, error } = await supabaseClient.from('admins').select('id, role, full_name, user_id, email');
    if (error) { console.error("Error loading admins:", error); return; }

    const tableBody = document.getElementById('admins-table-body');
    tableBody.innerHTML = data.map(admin => `
        <tr>
            <td>${admin.full_name || 'N/A'} (${admin.email})</td>
            <td><span class="role-badge role-${admin.role}">${roleMap[admin.role] || admin.role}</span></td>
            <td class="action-buttons">
                ${admin.user_id !== currentAdminId ? `<button class="delete-btn" data-id="${admin.id}" data-userid="${admin.user_id}" title="حذف"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function handleAddAdmin(e) {
    e.preventDefault();
    const form = e.target;
    const fullName = form.querySelector('#admin-full-name').value;
    const email = form.querySelector('#admin-email').value;
    const password = form.querySelector('#admin-password').value;
    const role = form.querySelector('#admin-role-select').value;

    if(password.length < 6) {
        alert("يجب أن تكون كلمة السر المؤقتة 6 أحرف على الأقل.");
        return;
    }
    
    // NOTE: You need to create Supabase Edge Functions named 'create-admin-user' and 'delete-admin-user'
    const { data, error } = await supabaseClient.functions.invoke('create-admin-user', {
        body: { email, password, fullName, role },
    });

    if (error) {
        alert("خطأ في إضافة العضو: " + error.message);
    } else if (data.error) {
         alert("خطأ من السيرفر: " + data.error);
    } else {
        alert("تم إضافة العضو بنجاح!");
        form.reset();
        loadAdmins(currentAdmin.user_id);
        loadOverviewStats();
    }
}

async function handleAdminActions(e) {
    const button = e.target.closest('button');
    if (!button || !button.classList.contains('delete-btn')) return;
    
    if (confirm("هل أنت متأكد من حذف هذا العضو؟ سيتم حذف حسابه بالكامل.")) {
        const adminUserId = button.dataset.userid;
        const { data, error } = await supabaseClient.functions.invoke('delete-admin-user', {
            body: { userId: adminUserId },
        });
        if (error) {
            alert("خطأ في حذف العضو: " + error.message);
        } else if (data.error) {
            alert("خطأ من السيرفر: " + data.error);
        } else {
            alert("تم حذف العضو بنجاح.");
            loadAdmins(currentAdmin.user_id);
            loadOverviewStats();
        }
    }
}

// --- قسم إدارة الطلبات (للمدراء) ---
async function loadSubmissions() {
    const { data, error } = await supabaseClient
        .from('content_submissions')
        .select(`*, admin:admins(full_name)`)
        .eq('status', 'pending');

    if (error) { console.error("Error loading submissions:", error); return; }

    const tableBody = document.getElementById('submissions-table-body');
    if (!data.length) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">لا توجد طلبات معلقة حالياً.</td></tr>`;
        return;
    }
    tableBody.innerHTML = data.map(sub => `
        <tr data-submission='${JSON.stringify(sub)}'>
            <td>${sub.title}</td>
            <td>${sub.type === 'exercise' ? 'تمرين' : 'ملخص'}</td>
            <td>${sub.admin?.full_name || 'غير معروف'}</td>
            <td class="action-buttons">
                <button class="approve-btn" data-id="${sub.id}" title="قبول"><i class="fas fa-check"></i></button>
                <button class="reject-btn" data-id="${sub.id}" title="رفض"><i class="fas fa-times"></i></button>
            </td>
        </tr>
    `).join('');
}

async function handleSubmissionAction(e) {
    const button = e.target.closest('button');
    if (!button) return;
    const id = button.dataset.id;
    let status = '';

    if (button.classList.contains('approve-btn')) {
        status = 'approved';
    } else if (button.classList.contains('reject-btn')) {
        status = 'rejected';
    } else {
        return;
    }
    
    const { error } = await supabaseClient
        .from('content_submissions')
        .update({ status: status })
        .eq('id', id);
        
    if (error) {
        alert("حدث خطأ: " + error.message);
    } else {
        alert(`تم ${status === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح.`);
        loadSubmissions();
        loadOverviewStats();
        updatePendingCountBadge();
    }
}

// --- قسم إضافة المحتوى (للمساعد) ---
async function loadMySubmissions() {
    const { data, error } = await supabaseClient
        .from('content_submissions')
        .select('*')
        .eq('submitted_by', currentAdmin.user_id)
        .order('created_at', { ascending: false });
        
    if (error) { console.error("Error loading my submissions:", error); return; }
    
    const statusMap = {
        pending: { text: 'قيد المراجعة', class: 'status-pending' },
        approved: { text: 'مقبول', class: 'status-approved' },
        rejected: { text: 'مرفوض', class: 'status-rejected' },
    };

    const tableBody = document.getElementById('my-submissions-table-body');
    if (!data.length) {
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">لم تقم بإضافة أي محتوى بعد.</td></tr>`;
        return;
    }
    tableBody.innerHTML = data.map(sub => `
        <tr data-submission='${JSON.stringify(sub)}'>
            <td>${sub.title}</td>
            <td><span class="status-badge ${statusMap[sub.status].class}">${statusMap[sub.status].text}</span></td>
            <td class="action-buttons">
                ${sub.status === 'pending' ? `
                    <button class="edit-btn" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="حذف"><i class="fas fa-trash"></i></button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

async function handleContentSubmission(e) {
    e.preventDefault();
    const form = e.target;
    const id = form.querySelector('#submission-id').value;
    const submissionData = {
        title: form.querySelector('#submission-title').value,
        type: form.querySelector('#submission-type').value,
        content: form.querySelector('#submission-content').value,
        submitted_by: currentAdmin.user_id,
        status: 'pending'
    };

    const query = id
        ? supabaseClient.from('content_submissions').update(submissionData).eq('id', id)
        : supabaseClient.from('content_submissions').insert([submissionData]);
    
    const { error } = await query;
    if (error) {
        alert("خطأ في حفظ الطلب: " + error.message);
    } else {
        alert("تم حفظ طلبك بنجاح وسيتم مراجعته.");
        cancelSubmissionEdit();
        loadMySubmissions();
    }
}

function handleMySubmissionActions(e) {
    const button = e.target.closest('button');
    if (!button) return;
    const row = button.closest('tr');
    const submission = JSON.parse(row.dataset.submission);

    if (button.classList.contains('edit-btn')) {
        document.getElementById('submission-id').value = submission.id;
        document.getElementById('submission-title').value = submission.title;
        document.getElementById('submission-type').value = submission.type;
        document.getElementById('submission-content').value = submission.content;
        document.getElementById('cancel-edit-submission').classList.remove('hidden');
        document.querySelector('#content-submission-form button[type="submit"]').textContent = 'تحديث الطلب';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (button.classList.contains('delete-btn')) {
        if (confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
            deleteMySubmission(submission.id);
        }
    }
}

function cancelSubmissionEdit() {
    document.getElementById('content-submission-form').reset();
    document.getElementById('submission-id').value = '';
    document.getElementById('cancel-edit-submission').classList.add('hidden');
    document.querySelector('#content-submission-form button[type="submit"]').textContent = 'إرسال للمراجعة';
}

async function deleteMySubmission(id) {
    const { error } = await supabaseClient.from('content_submissions').delete().eq('id', id);
    if (error) { alert("خطأ في حذف الطلب: " + error.message); } 
    else { loadMySubmissions(); }
}

// --- قسم إدارة العروض ---
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

    const query = offerId
        ? supabaseClient.from('offers').update(offerData).eq('id', offerId)
        : supabaseClient.from('offers').insert([offerData]);

    const { error } = await query;

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
    
    if (button.classList.contains('edit-btn')) {
        const row = button.closest('tr');
        const offer = JSON.parse(row.dataset.offer);
        document.getElementById('offer-id').value = offer.id;
        document.getElementById('offer-name').value = offer.name;
        document.getElementById('offer-price').value = offer.price;
        document.getElementById('offer-duration').value = offer.duration_days;
        document.getElementById('offer-description').value = offer.description;
        document.getElementById('cancel-edit-offer').classList.remove('hidden');
        document.querySelector('#offer-form button[type="submit"]').textContent = 'تحديث العرض';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (button.classList.contains('delete-btn')) {
        const id = button.dataset.id;
        if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
            deleteOffer(id);
        }
    }
}

function cancelOfferEdit() {
    document.getElementById('offer-form').reset();
    document.getElementById('offer-id').value = '';
    document.getElementById('cancel-edit-offer').classList.add('hidden');
    document.querySelector('#offer-form button[type="submit"]').textContent = 'حفظ العرض';
}

async function deleteOffer(id) {
    const { error } = await supabaseClient.from('offers').delete().eq('id', id);
    if (error) { alert("خطأ في حذف العرض: " + error.message); } 
    else { loadOffers(); }
}