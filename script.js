const body = document.body;
const toggle = document.querySelector('.theme-toggle');
let storedTheme;
try { storedTheme = localStorage.getItem('aman-theme'); } catch (_) {}

if (storedTheme === 'light') body.classList.add('light');
const updateThemeLabel = () => toggle.setAttribute('aria-label', body.classList.contains('light') ? 'Switch to dark theme' : 'Switch to light theme');
updateThemeLabel();

toggle.addEventListener('click', () => {
  body.classList.toggle('light');
  try { localStorage.setItem('aman-theme', body.classList.contains('light') ? 'light' : 'dark'); } catch (_) {}
  updateThemeLabel();
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion) {
  document.documentElement.classList.add('motion-ready');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
}

document.getElementById('year').textContent = new Date().getFullYear();

const menu = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
function closeMenu() { mobileNav.hidden = true; menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => {
  mobileNav.hidden = !mobileNav.hidden;
  menu.setAttribute('aria-expanded', String(!mobileNav.hidden));
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); } });

if (!reducedMotion) {
  const progress = document.querySelector('.reading-progress');
  let pending = false;
  function updateProgress() {
    const total = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${total > 0 ? Math.min(scrollY / total, 1) : 0})`;
    pending = false;
  }
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  updateProgress();
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.capability-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const box = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - box.left}px`);
        card.style.setProperty('--my', `${event.clientY - box.top}px`);
      });
    });
  }
}
