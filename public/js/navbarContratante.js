document.querySelectorAll('[data-contractor-sidebar]').forEach((sidebar) => {
  const collapseToggle = sidebar.querySelector('[data-sidebar-collapse]');
  const mobileToggle = document.querySelector('[data-sidebar-mobile-toggle]');
  const backdrop = document.querySelector('[data-sidebar-backdrop]');
  const mobileViewport = window.matchMedia('(max-width: 760px)');
  const tabletViewport = window.matchMedia('(max-width: 1024px) and (min-width: 761px)');
  const nav = sidebar.querySelector('.sidebar-nav');

  if (!collapseToggle || !mobileToggle || !backdrop || !nav) return;

  const navLinks = Array.from(nav.querySelectorAll('.sidebar-nav__link'));
  const activeLink = nav.querySelector('.sidebar-nav__link.active');
  const previousIndex = sessionStorage.getItem('contractor-sidebar-previous-link');
  const previousLink = previousIndex === null ? null : navLinks[Number(previousIndex)];
  const indicator = nav.querySelector('.sidebar-nav__indicator');

  nav.addEventListener('click', (event) => {
    const link = event.target.closest('.sidebar-nav__link');
    if (!link) return;
    sessionStorage.setItem('contractor-sidebar-previous-link', String(navLinks.indexOf(link)));
  });

  if (activeLink && indicator) {
    const navTop = nav.getBoundingClientRect().top;
    const targetTop = activeLink.getBoundingClientRect().top - navTop + 9;
    indicator.style.top = `${targetTop}px`;

    if (previousLink && previousLink !== activeLink && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const previousTop = previousLink.getBoundingClientRect().top - navTop + 9;
      indicator.animate(
        [
          { transform: `translateY(${previousTop - targetTop}px)` },
          { transform: 'translateY(0)' },
        ],
        { duration: 2000, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
    }
  }
  sessionStorage.removeItem('contractor-sidebar-previous-link');

  const setCollapsed = (collapsed) => {
    sidebar.classList.toggle('is-collapsed', collapsed);
    collapseToggle.setAttribute('aria-expanded', String(!collapsed));
    collapseToggle.setAttribute(
      'aria-label',
      collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'
    );
  };

  const setBackgroundInert = (inert) => {
    Array.from(document.body.children).forEach((element) => {
      if (
        element === sidebar ||
        element === mobileToggle ||
        element === backdrop ||
        element.tagName === 'SCRIPT'
      ) return;

      element.inert = inert;
    });
  };

  const setMobileOpen = (open, returnFocus = false) => {
    sidebar.classList.toggle('is-open', open);
    document.body.classList.toggle('sidebar-mobile-open', open);
    sidebar.inert = !open;
    mobileToggle.inert = open;
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileToggle.setAttribute('aria-label', open ? 'Fechar navegação' : 'Abrir navegação');
    backdrop.hidden = !open;
    setBackgroundInert(open);

    if (open) {
      nav.querySelector('a')?.focus();
    } else if (returnFocus) {
      mobileToggle.focus();
    }
  };

  const updateViewportMode = () => {
    if (mobileViewport.matches) {
      setCollapsed(false);
      setMobileOpen(false);
      return;
    }

    setMobileOpen(false);
    sidebar.inert = false;
    setCollapsed(tabletViewport.matches);
  };

  collapseToggle.addEventListener('click', () => {
    if (mobileViewport.matches) {
      setMobileOpen(false, true);
      return;
    }

    setCollapsed(!sidebar.classList.contains('is-collapsed'));
  });

  mobileToggle.addEventListener('click', () => {
    setMobileOpen(!sidebar.classList.contains('is-open'));
  });

  backdrop.addEventListener('click', () => setMobileOpen(false, true));

  nav.addEventListener('click', (event) => {
    if (mobileViewport.matches && event.target.closest('a')) {
      setMobileOpen(false);
    }
  });

  sidebar.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (mobileViewport.matches && sidebar.classList.contains('is-open')) {
        event.preventDefault();
        setMobileOpen(false, true);
      } else if (!mobileViewport.matches && !sidebar.classList.contains('is-collapsed')) {
        setCollapsed(true);
        collapseToggle.focus();
      }
      return;
    }

    if (event.key !== 'Tab' || !mobileViewport.matches || !sidebar.classList.contains('is-open')) return;

    const focusable = Array.from(sidebar.querySelectorAll('a[href], button:not([disabled])'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  mobileViewport.addEventListener('change', updateViewportMode);
  tabletViewport.addEventListener('change', updateViewportMode);

  updateViewportMode();
});
