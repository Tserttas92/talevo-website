// ── NAVBAR SCROLL ──
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
}

// ── MOBILE MENU ──
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
    // close on outside click
    document.addEventListener('click', e => {
        if (!navbar.contains(e.target)) {
            navLinks.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// ── REVEAL ON SCROLL (Intersection Observer) ──
if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el    = entry.target;
            const delay = parseInt(el.dataset.delay || '0', 10);
            setTimeout(() => el.classList.add('revealed'), delay);
            revealObserver.unobserve(el);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));
}

// ── STEPPER HIGHLIGHT ON SCROLL ──
const stepperItems = document.querySelectorAll('.stepper-item');
if (stepperItems.length && 'IntersectionObserver' in window) {
    const stepObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const icon = entry.target.querySelector('.stepper-icon');
            if (!icon) return;
            if (entry.isIntersecting) {
                icon.style.background = 'var(--purple)';
                icon.style.color      = '#fff';
                icon.style.borderColor = 'var(--purple)';
            } else {
                icon.style.background  = 'var(--surface)';
                icon.style.color       = 'var(--purple)';
                icon.style.borderColor = 'var(--purple-lt)';
            }
        });
    }, { threshold: 0.6 });
    stepperItems.forEach(item => stepObs.observe(item));
}

// ── SMOOTH SCROLL ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const top = target.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// ── CONTACT FORM ──
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', () => {
        const btn = contactForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Gönderiliyor…'; }
    });
}

// ── ANIMATE SCORE BARS (trigger on visibility) ──
if ('IntersectionObserver' in window) {
    const barObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.querySelectorAll('.mock-bar-fill, .score-fill, .oa-bar-fill').forEach(bar => {
                const w = bar.style.width || getComputedStyle(bar).getPropertyValue('--w');
                bar.style.width = '0';
                requestAnimationFrame(() => {
                    bar.style.transition = 'width .9s cubic-bezier(.4,0,.2,1)';
                    bar.style.width = w;
                });
            });
            barObs.unobserve(entry.target);
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.mockup-body, .score-chips, .oa-scores').forEach(el => barObs.observe(el));
}
