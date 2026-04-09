/* ============================================
   TALEVO — main.js
   ============================================ */

// ── NAVBAR ──
const navbar = document.getElementById('navbar');
if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

// ── MOBILE MENU ──
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
    document.addEventListener('click', e => {
        if (!navbar.contains(e.target)) {
            navLinks.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
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

// ── SCROLL REVEAL ──
if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el    = entry.target;
            const delay = parseInt(el.dataset.delay || '0', 10);
            setTimeout(() => el.classList.add('revealed'), delay);
            revealObs.unobserve(el);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));
}

// ── PROCESS TABS ──
const processTabs = document.getElementById('processTabs');
if (processTabs) {
    const btns   = processTabs.querySelectorAll('.tab-btn');
    const panels = processTabs.querySelectorAll('.tab-panel');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = btn.dataset.tab;

            btns.forEach(b => {
                b.classList.remove('tab-btn--active');
                b.setAttribute('aria-selected', 'false');
            });
            panels.forEach(p => p.classList.remove('tab-panel--active'));

            btn.classList.add('tab-btn--active');
            btn.setAttribute('aria-selected', 'true');

            const panel = processTabs.querySelector(`.tab-panel[data-panel="${idx}"]`);
            if (panel) panel.classList.add('tab-panel--active');
        });
    });
}

// ── CONTACT FORM ──
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', () => {
        const btn = contactForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Gönderiliyor…'; }
    });
}
