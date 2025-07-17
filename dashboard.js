// =======================================================
// الكود الكامل والنهائي لملف dashboard.js
// =======================================================

const SUPABASE_URL = 'https://gtznbmpueunibhwlpmtk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0em5ibXB1ZXVuaWJod2xwbXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTA3NjYsImV4cCI6MjA2ODE2Njc2Nn0.0A4csTHneN1_SUDygKA9qvpRv_dPaU7QNCfLz1oG_Xs';

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
    setupNavigation();

    // 4. تحميل البيانات بناءً على دور المشرف
    initializeDashboard(adminData.role);

    // 5. ربط الأحداث (Event Listeners)
    setupEventListeners();
});

// --- إعداد التنقل والواجهة ---
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
}

function initializeDashboard(role) {
    if (role === 'super_admin') {
        // صاحب الموقع يرى كل شيء
        loadOverviewStats();
        // يمكنك استدعاء دوال تحميل باقي الأقسام هنا
        populateLevelDropdown();
    } else if (role === 'assistant') {
        // المساعد يرى أقساماً محددة فقط (يمكن تخصيصها)
        // مثال: إخفاء قسم إدارة الأعضاء والعروض
        document.querySelector('a[href="#admins"]').parentElement.style.display = 'none';
        document.querySelector('a[href="#offers"]').parentElement.style.display = 'none';
        // يمكنك تحميل البيانات التي يحتاجها المساعد هنا
    }
}

function setupEventListeners() {
    // تسجيل الخروج
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    // نموذج إضافة المحتوى
    const addContentForm = document.getElementById('add-content-form');
    if(addContentForm) {
        addContentForm.addEventListener('submit', handleAddContent);
    }
    // يمكنك إضافة باقي الـ event listeners هنا (للفلاتر، البحث، الخ)
}

// --- وظائف تحميل البيانات (Data Loading) ---
async function loadOverviewStats() {
    const statsGrid = document.getElementById('stats-grid');
    if (!statsGrid) return;
    statsGrid.innerHTML = `<div>جاري تحميل الإحصائيات...</div>`;

    // جلب عدد المستخدمين
    const { count: totalUsers, error: totalErr } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true });
    const { count: paidUsers, error: paidErr } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'paid');
    
    if (totalErr || paidErr) {
        statsGrid.innerHTML = `<div>خطأ في تحميل الإحصائيات</div>`;
        return;
    }

    // جلب سعر الاشتراك المدفوع (نفترض أن له id = 1)
    const { data: offerData, error: offerErr } = await supabaseClient.from('offers').select('price').eq('id', 1).single();
    const offerPrice = offerData?.price || 10; // سعر افتراضي 10 إذا لم يتم العثور عليه
    
    const estimatedRevenue = (paidUsers || 0) * offerPrice;

    statsGrid.innerHTML = `
        <div class="stat-card"><h4>إجمالي المستخدمين</h4><p>${totalUsers || 0}</p></div>
        <div class="stat-card"><h4>الاشتراكات المدفوعة</h4><p>${paidUsers || 0}</p></div>
        <div class="stat-card"><h4>الاشتراكات المجانية</h4><p>${(totalUsers || 0) - (paidUsers || 0)}</p></div>
        <div class="stat-card"><h4>الأرباح الشهرية (تقديري)</h4><p>${estimatedRevenue} د.ت</p></div>
    `;
}


// --- وظائف إدارة المحتوى ---
function populateLevelDropdown() {
    const levelDropdown = document.getElementById('content-level');
    if (!levelDropdown) return;
    
    for (let i = 1; i <= 6; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `السنة ${i} ابتدائي`;
        levelDropdown.appendChild(option);
    }
}

async function handleAddContent(event) {
    event.preventDefault();
    const form = event.target;
    
    const title = form.querySelector('#content-title').value;
    const gdriveLink = form.querySelector('#gdrive-link').value;
    const category = form.querySelector('#content-category').value;
    const level = form.querySelector('#content-level').value;
    const trimester = form.querySelector('#content-trimester').value;

    // تحويل رابط جوجل درايف من رابط عرض إلى رابط تحميل مباشر
    const downloadLink = gdriveLink.replace('/view?usp=sharing', '/preview').replace('/file/d/', '/uc?id=').replace('/view', '/uc?export=download&id=');
    
    const newContent = {
        title,
        gdrive_link: downloadLink,
        category,
        level,
        trimester,
        // subject_id سيتم إضافته لاحقاً
    };

    const { data, error } = await supabaseClient.from('content').insert([newContent]);

    if (error) {
        console.error('Error adding content:', error);
        alert('حدث خطأ أثناء إضافة المحتوى. راجع الـ console.');
    } else {
        alert('تم إضافة المحتوى بنجاح!');
        form.reset();
        // يمكنك هنا استدعاء دالة لإعادة تحميل قائمة المحتوى
    }
}