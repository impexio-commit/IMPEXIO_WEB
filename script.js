/* ===================================================
   EXIM Pro — Main JavaScript
   =================================================== */

// ===== APP DATA =====
const APP_DATA = {
  clientCode: "Demo001",
  credentials: { username: "Admin", password: "Admin", role: "Administrator" },
  companies: [
    {
      id: 1,
      name: "Bharat Exports Pvt. Ltd.",
      address: "42, MIDC Industrial Area, Andheri East, Mumbai - 400093",
      gst: "27AABCE1234F1Z5",
      version: "v3.2.1"
    },
    {
      id: 2,
      name: "Global Trade Solutions LLP",
      address: "Plot No. 18, SEZ Phase II, Kandla Port, Gujarat - 370210",
      gst: "24AADCG5678H2Z3",
      version: "v3.2.1"
    },
    {
      id: 3,
      name: "IndoCom Shipping Co.",
      address: "15/A, Customs House Road, Chennai Port, Tamil Nadu - 600001",
      gst: "33AAHCI9012J3Z7",
      version: "v3.2.1"
    }
  ],
  financialYears: [
    { id: 1, label: "FY 2024-25", start: "01 April 2024", end: "31 March 2025" },
    { id: 2, label: "FY 2023-24", start: "01 April 2023", end: "31 March 2024" },
    { id: 3, label: "FY 2022-23", start: "01 April 2022", end: "31 March 2023" }
  ]
};

// Session state
let sessionState = {
  clientCode: null,
  user: null,
  company: null,
  year: null
};

// ===== PARTICLE CANVAS =====
(function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let particles = [];
  let animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.6 ? "#00c2a8" : Math.random() > 0.5 ? "#6366f1" : "#7a92b4"
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
    });
    // Draw connecting lines
    ctx.globalAlpha = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,194,168,${0.08 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    animId = requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => { resize(); });
  init();
  draw();
})();

// ===== NAVBAR SCROLL EFFECT =====
window.addEventListener("scroll", () => {
  const nav = document.getElementById("navbar");
  if (nav) nav.classList.toggle("scrolled", window.scrollY > 50);
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    navLinks.classList.toggle("open");
  });
  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      hamburger.classList.remove("open");
      navLinks.classList.remove("open");
    }
  });
}

// ===== MOBILE DROPDOWN TOGGLE =====
document.querySelectorAll(".dropdown-toggle").forEach(toggle => {
  toggle.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      const parent = toggle.closest(".dropdown");
      parent.classList.toggle("open");
    }
  });
});

// ===== COUNTER ANIMATION =====
function animateCounters() {
  document.querySelectorAll(".stat-number").forEach(el => {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current).toLocaleString();
    }, 30);
  });
}

// Trigger counters when hero is visible
const heroSection = document.querySelector(".hero-stats");
if (heroSection) {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateCounters();
      observer.disconnect();
    }
  }, { threshold: 0.5 });
  observer.observe(heroSection);
}

// ===== FEATURE CARDS ANIMATION =====
const featureCards = document.querySelectorAll(".feature-card");
featureCards.forEach((card, i) => {
  card.style.animationDelay = `${i * 0.1}s`;
});

const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, { threshold: 0.1 });
featureCards.forEach(c => cardObserver.observe(c));

// ===== AUTH FLOW =====

function showStep(showId, hideId) {
  const show = document.getElementById(showId);
  const hide = document.getElementById(hideId);
  if (hide) {
    hide.classList.add("hidden");
  }
  if (show) {
    show.classList.remove("hidden");
    show.style.animation = "none";
    show.offsetHeight; // reflow
    show.style.animation = "authCardIn 0.5s ease";
  }
}

function goBack(backTo, current) {
  showStep(backTo, current);
}

// STEP 1: Verify Client Code
function verifyClient() {
  const code = document.getElementById("clientCode");
  const errEl = document.getElementById("clientError");
  if (!code) return;
  const val = code.value.trim();
  if (val.toLowerCase() === APP_DATA.clientCode.toLowerCase()) {
    errEl.style.display = "none";
    sessionState.clientCode = val;
    // Update login badge
    const badge = document.getElementById("loginClientBadge");
    if (badge) badge.innerHTML = `<i class="fas fa-id-card" style="color:var(--teal)"></i> Client: <strong>${val}</strong>`;
    showStep("step-login", "step-client");
  } else {
    errEl.style.display = "flex";
    code.style.borderColor = "var(--error)";
    setTimeout(() => { code.style.borderColor = ""; }, 2000);
  }
}

// STEP 2: Verify Login
function verifyLogin() {
  const user = document.getElementById("username");
  const pass = document.getElementById("password");
  const errEl = document.getElementById("loginError");
  if (!user || !pass) return;
  if (
    user.value.trim().toLowerCase() === APP_DATA.credentials.username.toLowerCase() &&
    pass.value.trim() === APP_DATA.credentials.password
  ) {
    errEl.style.display = "none";
    sessionState.user = {
      name: user.value.trim(),
      role: APP_DATA.credentials.role
    };
    buildCompanyList();
    showStep("step-company", "step-login");
  } else {
    errEl.style.display = "flex";
    [user, pass].forEach(el => {
      el.style.borderColor = "var(--error)";
      setTimeout(() => { el.style.borderColor = ""; }, 2000);
    });
  }
}

// STEP 3: Build & Select Company
function buildCompanyList() {
  const container = document.getElementById("companyList");
  if (!container) return;
  container.innerHTML = "";
  APP_DATA.companies.forEach(company => {
    const card = document.createElement("div");
    card.className = "company-card";
    card.innerHTML = `
      <div class="company-version">${company.version}</div>
      <h4><i class="fas fa-building" style="color:var(--teal);margin-right:0.4rem;font-size:0.85rem"></i>${company.name}</h4>
      <div class="company-meta">
        <span class="meta-item"><i class="fas fa-map-marker-alt"></i> ${company.address}</span>
        <span class="meta-item"><i class="fas fa-receipt"></i> GST: ${company.gst}</span>
      </div>
    `;
    card.addEventListener("click", () => {
      document.querySelectorAll(".company-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      sessionState.company = company;
      setTimeout(() => {
        buildYearList();
        const info = document.getElementById("selectedCompanyInfo");
        if (info) info.innerHTML = `<i class="fas fa-building"></i> <strong>${company.name}</strong>`;
        showStep("step-year", "step-company");
      }, 300);
    });
    container.appendChild(card);
  });
}

// STEP 4: Build & Select Year
function buildYearList() {
  const container = document.getElementById("yearList");
  if (!container) return;
  container.innerHTML = "";
  APP_DATA.financialYears.forEach(year => {
    const card = document.createElement("div");
    card.className = "year-card";
    card.innerHTML = `
      <div class="year-card-icon"><i class="fas fa-calendar-alt"></i></div>
      <div>
        <h4>${year.label}</h4>
        <p>${year.start} &nbsp;→&nbsp; ${year.end}</p>
      </div>
    `;
    card.addEventListener("click", () => {
      document.querySelectorAll(".year-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      sessionState.year = year;
      // Store in sessionStorage and redirect
      sessionStorage.setItem("eximSession", JSON.stringify(sessionState));
      setTimeout(() => { window.location.href = "dashboard.html"; }, 400);
    });
    container.appendChild(card);
  });
}

// Password toggle
function togglePass() {
  const passInput = document.getElementById("password");
  const eyeIcon = document.getElementById("eyeIcon");
  if (!passInput) return;
  if (passInput.type === "password") {
    passInput.type = "text";
    eyeIcon.className = "fas fa-eye-slash";
  } else {
    passInput.type = "password";
    eyeIcon.className = "fas fa-eye";
  }
}

// Allow Enter key on auth inputs
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const step1 = document.getElementById("step-client");
  const step2 = document.getElementById("step-login");
  if (step1 && !step1.classList.contains("hidden")) verifyClient();
  else if (step2 && !step2.classList.contains("hidden")) verifyLogin();
});

// ===== DASHBOARD =====
function initDashboard() {
  const rawSession = sessionStorage.getItem("eximSession");
  const session = rawSession ? JSON.parse(rawSession) : null;

  // If no session, redirect to login
  if (!session || !session.user) {
    // For demo purposes, use default data instead of redirecting
    const defaultSession = {
      clientCode: "Demo001",
      user: { name: "Admin", role: "Administrator" },
      company: APP_DATA.companies[0],
      year: APP_DATA.financialYears[0]
    };
    populateDashboard(defaultSession);
    return;
  }
  populateDashboard(session);
}

function populateDashboard(session) {
  // Nav pills
  const navInfo = document.getElementById("dashNavInfo");
  if (navInfo) {
    navInfo.innerHTML = `
      <div class="dash-info-pill"><i class="fas fa-id-card"></i> Client: <strong>${session.clientCode || "Demo001"}</strong></div>
      <div class="dash-info-pill"><i class="fas fa-building"></i> <strong>${session.company ? session.company.name : "Bharat Exports Pvt. Ltd."}</strong></div>
      <div class="dash-info-pill"><i class="fas fa-calendar"></i> <strong>${session.year ? session.year.label : "FY 2024-25"}</strong></div>
    `;
  }

  // User avatar
  const userCircle = document.getElementById("userAvatarCircle");
  const userLabel = document.getElementById("userAvatarName");
  if (userCircle && session.user) userCircle.textContent = session.user.name.charAt(0).toUpperCase();
  if (userLabel && session.user) userLabel.textContent = session.user.name;

  // Session bar
  const sessionBar = document.getElementById("sessionBar");
  if (sessionBar) {
    const company = session.company || APP_DATA.companies[0];
    const year = session.year || APP_DATA.financialYears[0];
    const user = session.user || { name: "Admin", role: "Administrator" };
    sessionBar.innerHTML = `
      <div class="dash-info-pill"><i class="fas fa-id-card"></i> Client Code: <strong>${session.clientCode || "Demo001"}</strong></div>
      <div class="dash-info-pill"><i class="fas fa-building"></i> Company: <strong>${company.name}</strong></div>
      <div class="dash-info-pill"><i class="fas fa-calendar-alt"></i> Year: <strong>${year.label}</strong></div>
      <div class="dash-info-pill"><i class="fas fa-bars"></i> Menu: <strong>Main Dashboard</strong></div>
      <div class="dash-info-pill"><i class="fas fa-user-shield"></i> <strong>${user.name}</strong> (${user.role})</div>
    `;
  }

  // Welcome header
  const welcome = document.getElementById("dashWelcome");
  const subtitle = document.getElementById("dashSubtitle");
  const company = session.company || APP_DATA.companies[0];
  const year = session.year || APP_DATA.financialYears[0];
  if (welcome && session.user) welcome.textContent = `Welcome back, ${session.user.name}!`;
  if (subtitle && company) subtitle.textContent = `${company.name} · ${year.label}`;

  // Date
  const dateEl = document.getElementById("dashDate");
  if (dateEl) {
    const now = new Date();
    dateEl.innerHTML = `<strong>${now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong>`;
  }
}

// Logout
function logout() {
  sessionStorage.removeItem("eximSession");
  window.location.href = "login.html";
}

// User avatar dropdown
const avatarBtn = document.getElementById("userAvatarBtn");
if (avatarBtn) {
  document.addEventListener("click", (e) => {
    // handled via CSS hover
  });
}

// Run dashboard init if on dashboard page
if (document.querySelector(".dashboard-body")) {
  initDashboard();
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function(e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ===== ADD RIPPLE EFFECT TO BUTTONS =====
document.querySelectorAll(".btn-primary, .btn-auth, .menu-card, .company-card, .year-card").forEach(btn => {
  btn.addEventListener("click", function(e) {
    const ripple = document.createElement("span");
    const rect = this.getBoundingClientRect();
    ripple.style.cssText = `
      position:absolute;width:4px;height:4px;
      background:rgba(255,255,255,0.3);border-radius:50%;
      left:${e.clientX - rect.left}px;top:${e.clientY - rect.top}px;
      transform:scale(0);animation:rippleAnim 0.6s ease-out forwards;
      pointer-events:none;z-index:10;
    `;
    this.style.position = "relative";
    this.style.overflow = "hidden";
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// Inject ripple keyframe
const styleEl = document.createElement("style");
styleEl.textContent = `@keyframes rippleAnim{to{transform:scale(80);opacity:0}}`;
document.head.appendChild(styleEl);

// ===== INTERSECTION OBSERVER for fade-in sections =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
      entry.target.style.transition = "opacity 0.7s ease, transform 0.7s ease";
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(".service-block, .marketing-content, .mcard").forEach(el => {
  el.style.opacity = "0";
  el.style.transform = "translateY(20px)";
  observer.observe(el);
});

console.log("%cEXIM Pro Portal", "font-size:24px;font-weight:bold;color:#00c2a8");
console.log("%cDemo Credentials → Client: Demo001 | User: Admin | Pass: Admin", "color:#7a92b4");
