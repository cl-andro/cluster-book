// Mobile sidebar toggle & backdrop overlay
document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
        if (toggle) toggle.innerHTML = '☰';
    }

    function openSidebar() {
        if (sidebar) sidebar.classList.add('open');
        if (backdrop) backdrop.classList.add('active');
        if (toggle) toggle.innerHTML = '✕';
    }

    if (toggle && sidebar) {
        toggle.addEventListener('click', function() {
            if (sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
        
        if (backdrop) {
            backdrop.addEventListener('click', closeSidebar);
        }

        // Close sidebar when clicking on a link (mobile)
        sidebar.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    closeSidebar();
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
