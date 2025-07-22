// Auth guard function to protect routes
const checkAuth = () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const currentPage = window.location.pathname.split('/').pop();
  
  // If not authenticated and trying to access protected pages
  if (!isAuthenticated && currentPage === 'home.html') {
    window.location.href = 'login.html';
    return;
  }
  
  // If authenticated and trying to access auth pages
  if (isAuthenticated && (currentPage === 'login.html' || currentPage === 'signup.html')) {
    window.location.href = 'home.html';
    return;
  }
};

// Check authentication status when page loads
document.addEventListener('DOMContentLoaded', checkAuth);

// Logout function
const handleLogout = () => {
  localStorage.removeItem('isAuthenticated');
  window.location.href = 'login.html';
};
