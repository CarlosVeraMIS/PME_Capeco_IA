/* ═══════════════════════════════════════════
   SCRIPTS — PME CAPECO PROVEEDORES
═══════════════════════════════════════════ */

// Navbar Toggle
function toggleNav() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('active');
}

// Modal Toggle
function openModal() {
  document.getElementById('modal-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (!e || e.target.id === 'modal-overlay' || e.target.className === 'modal-close') {
    document.getElementById('modal-overlay').style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

function togglePw() {
  const pw = document.getElementById('pw');
  pw.type = pw.type === 'password' ? 'text' : 'password';
}

// Handle Form
function handleForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.innerText;
  
  btn.innerText = 'Enviando...';
  btn.disabled = true;
  
  setTimeout(() => {
    btn.innerText = '✓ Solicitud Enviada';
    btn.style.background = '#00a859';
    btn.style.color = '#fff';
    
    setTimeout(() => {
      btn.innerText = originalText;
      btn.style.background = '#00C8FF';
      btn.style.color = '#001228';
      btn.disabled = false;
      e.target.reset();
    }, 3000);
  }, 1500);
}

// Set Audience from buttons
function setAudience(val) {
  const select = document.getElementById('interest-select');
  if (select) {
    select.value = val;
    document.getElementById('cform').scrollIntoView({ behavior: 'smooth' });
  }
}

// Stats Animation
const stats = document.querySelectorAll('.stat-num');
const observerOptions = {
  threshold: 0.5
};

const statsObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateStat(entry.target);
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

function animateStat(el) {
  const target = parseInt(el.getAttribute('data-target'));
  const suffix = el.getAttribute('data-suffix') || '';
  let count = 0;
  const speed = 2000 / target;
  
  const updateCount = () => {
    const increment = Math.ceil(target / 100);
    if (count < target) {
      count += increment;
      if (count > target) count = target;
      el.innerText = count + suffix;
      setTimeout(updateCount, 20);
    } else {
      el.innerText = target + suffix;
    }
  };
  
  updateCount();
}

stats.forEach(s => statsObserver.observe(s));

// Scroll effect for Navbar
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 50) {
    nav.style.background = 'rgba(4, 13, 22, 0.95)';
    nav.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
  } else {
    nav.style.background = 'rgba(4, 13, 22, 0.88)';
    nav.style.boxShadow = 'none';
  }
});
