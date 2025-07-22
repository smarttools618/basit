// ==================================================
// 1. Supabase Configuration
// ==================================================
const SUPABASE_URL = 'https://yhfqnfunkmhhxbwtrjns.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZnFuZnVua21oaHhid3Ryam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTAwODMsImV4cCI6MjA2ODY2NjA4M30.tLLs2S0wqnuJ2H7K5tucFJk3phktsgpMCYa92q0jopc';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================================================
// 2. DOM Element References
// ==================================================
const userWelcomeSpan = document.getElementById('user-welcome');
const logoutButton = document.getElementById('logout-button');
const contentGrid = document.getElementById('content-grid');
const userAvatarButton = document.getElementById('user-avatar-button');
const userDropdownMenu = document.getElementById('user-dropdown-menu');

// ==================================================
// 3. Functions
// ==================================================
const checkAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.replace('index.html');
    return null;
  }
  return user;
};

const updateUserInfo = (user) => {
  if (userWelcomeSpan && user?.user_metadata?.full_name) {
    userWelcomeSpan.textContent = `أهلاً بك، ${user.user_metadata.full_name.split(' ')[0]}`;
  } else if (userWelcomeSpan) {
    userWelcomeSpan.textContent = `أهلاً بك`;
  }
};

const loadContent = () => {
  const sampleContent = [
    { title: 'أساسيات الرياضيات', subject: 'الرياضيات', icon: 'fa-calculator', color: '#2ecc71' },
    { title: 'قواعد اللغة العربية', subject: 'اللغة العربية', icon: 'fa-book', color: '#3498db' },
    { title: 'مقدمة في العلوم', subject: 'العلوم', icon: 'fa-flask', color: '#e67e22' },
    { title: 'تاريخ وجغرافيا', subject: 'الدراسات الاجتماعية', icon: 'fa-globe-africa', color: '#9b59b6' },
    { title: 'مهارات البرمجة للمبتدئين', subject: 'التكنولوجيا', icon: 'fa-code', color: '#e74c3c' },
    { title: 'فن الرسم والتلوين', subject: 'الفنون', icon: 'fa-palette', color: '#1abc9c' },
  ];
  contentGrid.innerHTML = sampleContent.map(item => `
    <div class="content-card">
      <div class="card-icon" style="background-color: ${item.color};"><i class="fas ${item.icon}"></i></div>
      <div class="card-body"><h3>${item.title}</h3><p>${item.subject}</p></div>
      <div class="card-footer"><a href="#">ابدأ الدرس <i class="fas fa-arrow-left"></i></a></div>
    </div>
  `).join('');
};

const handleLogout = async () => {
  await supabase.auth.signOut();
  window.location.replace('index.html');
};

// ==================================================
// 4. Initialization & Event Listeners
// ==================================================
document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  if (user) {
    updateUserInfo(user);
    loadContent();

    userAvatarButton.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdownMenu.classList.toggle('hidden');
    });

    logoutButton.addEventListener('click', handleLogout);

    document.addEventListener('click', () => {
      if (!userDropdownMenu.classList.contains('hidden')) {
        userDropdownMenu.classList.add('hidden');
      }
    });
  }
});