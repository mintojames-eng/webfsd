/* ============================================================
   DigiLocker Redesign — App JavaScript
   ============================================================ */

const app = (() => {
    // ── Theme ─────────────────────────────────────────────────
    function initTheme() {
        const saved = localStorage.getItem('dl-theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        updateThemeIcon(saved);
    }
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('dl-theme', next);
        updateThemeIcon(next);
        showToast(`Switched to ${next} mode`, 'info');
    }
    function updateThemeIcon(theme) {
        const btn = document.getElementById('themeToggle');
        if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // ── Navbar scroll effect ───────────────────────────────────
    function initNavbar() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
        }, { passive: true });
    }

    // ── Mobile hamburger ───────────────────────────────────────
    function initHamburger() {
        const btn = document.getElementById('hamburger');
        const nav = document.getElementById('mobileNav');
        if (!btn || !nav) return;
        btn.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('open');
            btn.classList.toggle('open', isOpen);
            btn.setAttribute('aria-expanded', String(isOpen));
        });
        // Close on outside click
        document.addEventListener('click', e => {
            if (!btn.contains(e.target) && !nav.contains(e.target)) {
                nav.classList.remove('open');
                btn.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ── Search Modal ───────────────────────────────────────────
    function initSearch() {
        const openBtn = document.getElementById('searchBtn');
        const closeBtn = document.getElementById('searchClose');
        const modal = document.getElementById('searchModal');
        const input = document.getElementById('searchInput');
        if (!modal) return;

        openBtn?.addEventListener('click', () => {
            modal.classList.add('open');
            setTimeout(() => input?.focus(), 50);
        });
        closeBtn?.addEventListener('click', closeSearch);
        modal.addEventListener('click', e => {
            if (e.target === modal) closeSearch();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeSearch();
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                modal.classList.add('open');
                setTimeout(() => input?.focus(), 50);
            }
        });
    }
    function closeSearch() {
        const modal = document.getElementById('searchModal');
        modal?.classList.remove('open');
    }
    function fillSearch(query) {
        const input = document.getElementById('searchInput');
        if (input) {
            input.value = query;
            input.focus();
            showToast(`Searching for "${query}"…`, 'info');
        }
    }

    // ── Animated counters ──────────────────────────────────────
    function initCounters() {
        const counters = document.querySelectorAll('.stat-number[data-target]');
        if (!counters.length) return;
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(c => obs.observe(c));
    }
    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const step = (target / (duration / 16));
        let current = 0;
        const timer = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = Math.floor(current) + suffix;
            if (current >= target) clearInterval(timer);
        }, 16);
    }

    // ── Scroll reveal ──────────────────────────────────────────
    function initReveal() {
        const els = document.querySelectorAll('.reveal');
        if (!els.length) return;
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        els.forEach(el => obs.observe(el));
    }

    // ── Toast notifications ────────────────────────────────────
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const icons = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type === 'success' ? 'success' : 'info'}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span>${message}</span>
      <button class="toast-close" aria-label="Close notification">✕</button>
    `;
        toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
        container.appendChild(toast);
        setTimeout(() => removeToast(toast), 4000);
    }
    function removeToast(toast) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }

    // ── Category cards ─────────────────────────────────────────
    function openCategory(cat) {
        showToast(`Opening ${cat} documents…`, 'info');
        setTimeout(() => window.location.href = 'signin.html', 800);
    }

    // ── State selector ─────────────────────────────────────────
    function selectState(el, state) {
        document.querySelectorAll('.state-pill').forEach(p => p.classList.remove('active'));
        el.classList.add('active');
        showToast(`Showing issuers for ${state}`, 'success');
    }

    // ── Sign-in page ───────────────────────────────────────────
    let otpSent = false;
    let otpTimer = null;

    function switchTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

        const tabBtn = document.getElementById(`tab-${tab}`);
        const form = document.getElementById(`form-${tab}`);
        if (tabBtn) { tabBtn.classList.add('active'); tabBtn.setAttribute('aria-selected', 'true'); }
        if (form) form.classList.add('active');
    }

    function handleSignIn() {
        const mobileInput = document.getElementById('signin-mobile');
        const otpGroup = document.getElementById('otp-group');
        const cta = document.getElementById('signinCta');
        if (!mobileInput) return;

        const val = mobileInput.value.trim();
        if (!val || val.length < 10) {
            showToast('Please enter a valid mobile or Aadhaar number', 'error');
            mobileInput.focus();
            return;
        }
        if (!otpSent) {
            otpGroup.style.display = 'block';
            cta.textContent = 'Verify & Sign In →';
            otpSent = true;
            showToast('OTP sent to your registered mobile number! (Demo: use 123456)', 'success');
            startOTPTimer();
        } else {
            const otp = document.getElementById('signin-otp')?.value.trim();
            if (!otp || otp.length < 6) {
                showToast('Please enter the 6-digit OTP', 'error');
                return;
            }
            showToast('Verifying OTP…', 'info');
            setTimeout(() => {
                showToast('Welcome back! Redirecting to your vault…', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            }, 1200);
        }
    }

    function startOTPTimer() {
        let secs = 300;
        const timerEl = document.getElementById('otp-timer');
        if (otpTimer) clearInterval(otpTimer);
        otpTimer = setInterval(() => {
            secs--;
            if (timerEl) {
                const m = Math.floor(secs / 60);
                const s = secs % 60;
                timerEl.textContent = `OTP sent to your registered mobile. Valid for ${m}:${String(s).padStart(2, '0')}`;
            }
            if (secs <= 0) {
                clearInterval(otpTimer);
                if (timerEl) timerEl.textContent = 'OTP expired. Please click Resend.';
            }
        }, 1000);
    }

    function resendOTP() {
        otpSent = true;
        showToast('New OTP sent to your mobile number!', 'success');
        startOTPTimer();
    }

    function verifyAadhaar() {
        const val = document.getElementById('reg-aadhaar')?.value.trim();
        if (!val || val.length < 12) {
            showToast('Please enter a valid 12-digit Aadhaar number', 'error');
            return;
        }
        showToast('Aadhaar verification successful! ✅', 'success');
    }

    function handleRegister() {
        const name = document.getElementById('reg-name')?.value.trim();
        const mobile = document.getElementById('reg-mobile')?.value.trim();
        const aadhaar = document.getElementById('reg-aadhaar')?.value.trim();
        const username = document.getElementById('reg-username')?.value.trim();
        const pin = document.getElementById('reg-pin')?.value.trim();

        if (!name || !mobile || !aadhaar || !username || !pin) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        if (mobile.length < 10) { showToast('Invalid mobile number', 'error'); return; }
        if (aadhaar.length < 12) { showToast('Invalid Aadhaar number', 'error'); return; }
        if (pin.length < 6) { showToast('PIN must be 6 digits', 'error'); return; }

        showToast('Creating your account…', 'info');
        setTimeout(() => {
            showToast('Account created successfully! Welcome to DigiLocker 🎉', 'success');
            setTimeout(() => window.location.href = 'dashboard.html', 1200);
        }, 1500);
    }

    // ── Dashboard filters ──────────────────────────────────────
    function filterCards(cat, btn) {
        // Update buttons
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        // Filter cards
        const cards = document.querySelectorAll('.doc-card');
        cards.forEach(card => {
            const match = cat === 'all' || card.dataset.cat === cat;
            card.style.display = match ? 'block' : 'none';
        });
    }

    function filterDocs(cat, btn) {
        // Keep sidebar active state in sync
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        if (btn) btn.classList.add('active');
        // Also update filter bar
        const fbBtn = document.getElementById(`fb-${cat}`);
        filterCards(cat, fbBtn);
    }

    // ── Document actions ───────────────────────────────────────
    function viewDoc(name) {
        showToast(`Opening "${name}" — document viewer coming soon!`, 'info');
    }
    function shareDoc(name) {
        const link = `https://digilocker.example.com/share/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}-${crypto.randomUUID?.().slice(0, 8) || Math.random().toString(36).slice(2, 10)}`;
        navigator.clipboard?.writeText(link).then(() => {
            showToast(`Share link for "${name}" copied to clipboard! 🔗`, 'success');
        }).catch(() => {
            showToast(`Share link generated for "${name}"! 🔗`, 'success');
        });
    }

    // ── Keyboard accessibility for category cards ──────────────
    function initCardKeyboard() {
        document.querySelectorAll('.category-card[tabindex]').forEach(card => {
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    }

    // ── Smooth scroll for anchor links ─────────────────────────
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', e => {
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Close mobile nav if open
                    document.getElementById('mobileNav')?.classList.remove('open');
                    document.getElementById('hamburger')?.classList.remove('open');
                }
            });
        });
    }

    // ── Init ───────────────────────────────────────────────────
    function init() {
        initTheme();
        initNavbar();
        initHamburger();
        initSearch();
        initCounters();
        initReveal();
        initCardKeyboard();
        initSmoothScroll();

        // Theme toggle binding
        document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    }

    document.addEventListener('DOMContentLoaded', init);

    // Public API
    return {
        toggleTheme,
        showToast,
        openCategory,
        selectState,
        switchTab,
        handleSignIn,
        handleRegister,
        resendOTP,
        verifyAadhaar,
        filterCards,
        filterDocs,
        viewDoc,
        shareDoc,
        fillSearch,
        closeSearch,
    };
})();
