// Coded complet pour assistant_dashboard.js

// !!! هام: استبدل بالبيانات الخاصة بمشروعك على Supabase
const SUPABASE_URL = 'https://yjujdodudllhlgvhrhsw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdWpkb2R1ZGxsaGxndmhyaHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTQxMzIsImV4cCI6MjA2ODM3MDEzMn0.P7rLD-7hu9fRTSFfm_RuoGqjTmvXTUmPELQC0e7rOmU';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loader = document.getElementById('loader');
let currentAssistant = null;

document.addEventListener('DOMContentLoaded', async () => {
    showLoader(true);
    await checkSessionAndInitialize();
    setupEventListeners();
    showLoader(false);
});

async function checkSessionAndInitialize() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        window.location.href = 'index.html';
        return;
    }

    const { data: adminData } = await supabase.from('admins').select('*').eq('user_id', session.user.id).single();

    if (!adminData || adminData.role !== 'assistant') {
        alert('ليس لديك صلاحية الوصول لهذه الصفحة.');
        await supabase.auth.signOut();
        window.location.href = 'index.html';
        return;
    }
    
    currentAssistant = adminData;
    initializeDashboard();
}

function initializeDashboard() {
    document.getElementById('admin-name').textContent = currentAssistant.full_name;
    loadMyContent();
    populateLevels();
}

function populateLevels() {
    const levelSelect = document.getElementById('content-level');
    for (let i = 1; i <= 6; i++) {
        levelSelect.innerHTML += `<option value="${i}">السنة ${i} ابتدائي</option>`;
    }
}

async function loadMyContent() {
    showLoader(true);
    const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('created_by', currentAssistant.user_id)
        .order('created_at', { ascending: false });

    showLoader(false);
    if (error) { console.error(error); return; }

    const tableBody = document.getElementById('my-content-table');
    const statusNames = { pending: 'قيد المراجعة', approved: 'مقبول', rejected: 'مرفوض' };
    tableBody.innerHTML = data.map(item => `
        <tr data-id="${item.id}" data-status="${item.status}">
            <td>${item.title}</td>
            <td><span class="status-badge ${item.status}">${statusNames[item.status]}</span></td>
            <td class="action-buttons">
                ${item.status === 'pending' ? `<button class="delete-btn" title="حذف"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function handleAddContent(e) {
    e.preventDefault();
    const form = e.target;
    const contentData = {
        title: form.querySelector('#content-title').value,
        gdrive_link: form.querySelector('#content-gdrive').value,
        category: form.querySelector('#content-category').value,
        level: form.querySelector('#content-level').value,
        trimester: form.querySelector('#content-trimester').value,
        created_by: currentAssistant.user_id,
        status: 'pending' // دائماً ترسل كـ pending
    };

    showLoader(true);
    const { error } = await supabase.from('content').insert([contentData]);
    showLoader(false);

    if (error) {
        alert("خطأ في إضافة المحتوى: " + error.message);
    } else {
        alert("تم إرسال المحتوى للمراجعة بنجاح!");
        form.reset();
        loadMyContent();
    }
}

function setupEventListeners() {
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });

    document.getElementById('add-content-form').addEventListener('submit', handleAddContent);
    
    document.getElementById('my-content-table').addEventListener('click', async (e) => {
        const button = e.target.closest('.delete-btn');
        if (button) {
            const row = button.closest('tr');
            if (row.dataset.status !== 'pending') return;
            if (confirm("هل أنت متأكد من حذف هذا المحتوى؟")) {
                showLoader(true);
                await supabase.from('content').delete().eq('id', row.dataset.id);
                showLoader(false);
                loadMyContent();
            }
        }
    });
}

function showLoader(show) {
    loader.style.display = show ? 'flex' : 'none';
}