/* ============================================
   TALEVO — main.js
   Premium interactions
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

// ── SCROLL REVEAL (fade + blur) ──
if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el    = entry.target;
            const delay = parseInt(el.dataset.delay || '0', 10);
            setTimeout(() => el.classList.add('revealed'), delay);
            revealObs.unobserve(el);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));
}

// ── HERO CANVAS MOUSE PARALLAX ──
const heroCanvas = document.getElementById('heroCanvas');
if (heroCanvas) {
    const layers = heroCanvas.querySelectorAll('[data-depth]');
    let raf = null;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    const LERP = 0.08;

    document.addEventListener('mousemove', e => {
        const rect = heroCanvas.getBoundingClientRect();
        if (rect.width === 0) return;
        // normalised -0.5 … +0.5
        targetX = (e.clientX - rect.left - rect.width  / 2) / rect.width;
        targetY = (e.clientY - rect.top  - rect.height / 2) / rect.height;
    });

    function tick() {
        // lerp toward target
        currentX += (targetX - currentX) * LERP;
        currentY += (targetY - currentY) * LERP;

        layers.forEach(layer => {
            const depth = parseFloat(layer.dataset.depth || 0);
            const dx = currentX * depth * 28;
            const dy = currentY * depth * 22;
            layer.style.transform = `translate(${dx}px, ${dy}px)`;
        });

        raf = requestAnimationFrame(tick);
    }
    tick();

    // Pause animation when page is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
        else if (!document.hidden && !raf) tick();
    });
}

// ── APPROACH ACCORDION ──
const accordion = document.getElementById('accordion');
if (accordion) {
    accordion.addEventListener('click', e => {
        const header = e.target.closest('.acc-header');
        if (!header) return;

        const item = header.closest('.acc-item');
        const isOpen = item.classList.contains('acc-item--open');

        // close all
        accordion.querySelectorAll('.acc-item').forEach(i => {
            i.classList.remove('acc-item--open');
            i.querySelector('.acc-header').setAttribute('aria-expanded', 'false');
        });

        // open clicked (toggle off if was open)
        if (!isOpen) {
            item.classList.add('acc-item--open');
            header.setAttribute('aria-expanded', 'true');
        }
    });
}

// ── SERVICES DRAG SCROLL ──
const servicesOuter = document.querySelector('.services-outer');
if (servicesOuter) {
    let isDown = false;
    let startX  = 0;
    let scrollLeft = 0;

    servicesOuter.addEventListener('mousedown', e => {
        isDown = true;
        servicesOuter.classList.add('dragging');
        startX     = e.pageX - servicesOuter.offsetLeft;
        scrollLeft = servicesOuter.scrollLeft;
    });
    servicesOuter.addEventListener('mouseleave', () => {
        isDown = false;
        servicesOuter.classList.remove('dragging');
    });
    servicesOuter.addEventListener('mouseup', () => {
        isDown = false;
        servicesOuter.classList.remove('dragging');
    });
    servicesOuter.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const x    = e.pageX - servicesOuter.offsetLeft;
        const walk = (x - startX) * 1.4;
        servicesOuter.scrollLeft = scrollLeft - walk;
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
