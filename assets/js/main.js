// Mobile sidebar toggle
document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggle && sidebar) {
        toggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
        
        // Close sidebar when clicking on a link (mobile)
        sidebar.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });
        });
    }
    
    // Highlight active sidebar link
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.sidebar-nav a').forEach(function(link) {
        const linkHref = link.getAttribute('href');
        if (!linkHref) return;
        const linkPath = linkHref.replace(/\/$/, '') || '/';
        if (currentPath === linkPath || (linkPath !== '/' && currentPath.endsWith(linkPath))) {
            link.classList.add('active');
        }
    });
});
