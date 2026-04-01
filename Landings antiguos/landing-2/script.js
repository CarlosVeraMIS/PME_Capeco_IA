/* ── Modal ── */
const overlay = document.getElementById('modal-overlay');
function openModal() { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal(e) { if (!e || e.target === overlay || e.currentTarget.classList.contains('modal-close')) { overlay.classList.remove('open'); document.body.style.overflow = ''; } }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
function togglePw() { const el = document.getElementById('pw'); el.type = el.type === 'password' ? 'text' : 'password'; }

/* ── Mobile nav ── */
function toggleNav() { document.getElementById('mobile-menu').classList.toggle('open'); }

/* ── Audience form pre-fill ── */
function setAudience(val) {
    const sel = document.getElementById('interest-select');
    if (sel) sel.value = val;
    document.querySelectorAll('.pab').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.querySelector('.contact-form-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Animated counters ── */
function animateCounters() {
    document.querySelectorAll('[data-target]').forEach(el => {
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const dur = 2000; const start = performance.now();
        (function step(now) {
            const p = Math.min((now - start) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.floor(ease * target).toLocaleString('es-PE') + suffix;
            if (p < 1) requestAnimationFrame(step);
        })(start);
    });
}
let countersRan = false;
const statsEl = document.querySelector('.stats-strip');
if (statsEl) new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !countersRan) { countersRan = true; animateCounters(); }
}, { threshold: 0.3 }).observe(statsEl);

/* ── Scroll reveal ── */
document.querySelectorAll('.ab-item,.ucg-card,.t-card,.sc-pack,.kpi,.ucw-item,.tl-item').forEach((el, i) => {
    el.style.cssText += `opacity:0;transform:translateY(18px);transition:opacity .5s ease ${i * 0.06}s,transform .5s ease ${i * 0.06}s`;
    new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }
    }, { threshold: 0.12 }).observe(el);
});

/* ── Animate bar widths ── */
document.querySelectorAll('.dpb-bar > div').forEach(bar => {
    const w = bar.style.width;
    bar.style.width = '0';
    new IntersectionObserver(([e]) => {
        if (e.isIntersecting) setTimeout(() => { bar.style.width = w; }, 200);
    }, { threshold: 0.4 }).observe(bar);
});

/* ── Form submit ── */
function handleForm(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Recibido — te contactamos pronto';
    btn.style.background = '#1a7a3c'; btn.disabled = true;
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.disabled = false; e.target.reset(); }, 5000);
}
