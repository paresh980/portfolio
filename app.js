document.addEventListener("DOMContentLoaded", async () => {
  await PF.init();
  try {
    await Promise.all([
      renderProfile(),
      renderProjects(),
      renderCertificates(),
      renderSkills(),
      renderExperience(),
    ]);
    runTerminal();
  } catch (e) {
    console.error("Failed to load portfolio data", e);
  }
  setupNav();
  setupReveal();
  setupModal();
  document.getElementById("year").textContent = new Date().getFullYear();
});

/* ---------------- Profile ---------------- */
async function renderProfile() {
  const p = await PF.getProfile();
  document.title = `${p.name} — Portfolio`;
  document.querySelectorAll("[data-field='name']").forEach((el) => (el.textContent = p.name));
  document.querySelectorAll("[data-field='role']").forEach((el) => (el.textContent = p.role));
  document.querySelectorAll("[data-field='tagline']").forEach((el) => (el.textContent = p.tagline));
  document.querySelectorAll("[data-field='about']").forEach((el) => (el.textContent = p.about));
  document.querySelectorAll("[data-field='location']").forEach((el) => (el.textContent = p.location || ""));

  const email = document.getElementById("emailLink");
  if (email) email.href = `mailto:${p.email}`;
  const gh = document.getElementById("githubLink");
  if (gh) gh.href = p.github;
  const li = document.getElementById("linkedinLink");
  if (li) li.href = p.linkedin;
  const ghHero = document.getElementById("githubLinkHero");
  if (ghHero) ghHero.href = p.github;
  const liHero = document.getElementById("linkedinLinkHero");
  if (liHero) liHero.href = p.linkedin;
  const emailHero = document.getElementById("emailLinkHero");
  if (emailHero) emailHero.href = `mailto:${p.email}`;

  document.querySelectorAll("[data-resume]").forEach((el) => (el.href = p.resumeUrl));

  document.getElementById("githubLink").innerHTML = icon("github");
  document.getElementById("linkedinLink").innerHTML = icon("linkedin");
  document.getElementById("githubLinkHero").innerHTML = icon("github");
  document.getElementById("linkedinLinkHero").innerHTML = icon("linkedin");
  document.getElementById("emailLinkHero").innerHTML = icon("mail");
}

/* ---------------- Projects ---------------- */
async function renderProjects() {
  const list = await PF.getList("projects");
  const el = document.getElementById("projectsGrid");
  if (!list.length) { el.innerHTML = `<div class="empty-note">No projects added yet. Open the admin panel to add your first project.</div>`; return; }
  el.innerHTML = list.map((p, i) => `
    <article class="card reveal" style="--i:${i}">
      <div class="card-media"><img src="${PF.esc(p.image)}" alt="${PF.esc(p.title)}" loading="lazy"></div>
      <div class="card-body">
        <h3 class="card-title">${PF.esc(p.title)}</h3>
        <p class="card-desc">${PF.esc(p.shortDescription)}</p>
        <div class="tech-tags">${(p.tech || []).map((t) => `<span class="tag">${PF.esc(t)}</span>`).join("")}</div>
        <button class="see-more" data-kind="project" data-id="${p.id}">See full description →</button>
        <div class="card-actions">
          ${p.github ? `<a class="btn btn-outline btn-sm" href="${PF.esc(p.github)}" target="_blank" rel="noopener">${icon("github")} Code</a>` : ""}
          ${p.demo ? `<a class="btn btn-primary btn-sm" href="${PF.esc(p.demo)}" target="_blank" rel="noopener">${icon("external")} Live Demo</a>` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

/* ---------------- Certificates ---------------- */
async function renderCertificates() {
  const list = await PF.getList("certificates");
  const el = document.getElementById("certGrid");
  if (!list.length) { el.innerHTML = `<div class="empty-note">No certificates added yet. Open the admin panel to add one.</div>`; return; }
  el.innerHTML = list.map((c, i) => `
    <article class="cert-card reveal" style="--i:${i}">
      <div class="cert-thumb"><img src="${PF.esc(c.image)}" alt="${PF.esc(c.title)}" loading="lazy"></div>
      <div class="cert-info">
        <div class="cert-issuer">${PF.esc(c.issuer)}</div>
        <h3 class="cert-title">${PF.esc(c.title)}</h3>
        <div class="cert-date">${PF.esc(c.date)}</div>
        <p class="cert-desc">${PF.esc(c.shortDescription)}</p>
        <div class="cert-actions">
          <button class="see-more" data-kind="certificate" data-id="${c.id}">See more →</button>
          ${c.verifyUrl ? `<a class="verify-link" href="${PF.esc(c.verifyUrl)}" target="_blank" rel="noopener">${icon("check")} Verify certificate</a>` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

/* ---------------- Skills ---------------- */
async function renderSkills() {
  const list = await PF.getList("skills");
  const el = document.getElementById("skillsGroups");
  if (!list.length) { el.innerHTML = `<div class="empty-note">No skills added yet.</div>`; return; }
  const groups = {};
  list.forEach((s) => { (groups[s.category || "General"] ||= []).push(s); });
  el.innerHTML = Object.entries(groups).map(([cat, skills]) => `
    <div class="skill-group reveal">
      <div class="skill-group-title">${PF.esc(cat)}</div>
      ${skills.map((s) => `
        <div class="skill-row">
          <div class="skill-row-top"><span>${PF.esc(s.name)}</span><span>${s.level || 0}%</span></div>
          <div class="skill-bar"><div class="skill-bar-fill" data-level="${s.level || 0}"></div></div>
        </div>
      `).join("")}
    </div>
  `).join("");
}

/* ---------------- Experience ---------------- */
async function renderExperience() {
  const list = await PF.getList("experience");
  const el = document.getElementById("timeline");
  if (!list.length) { el.innerHTML = `<div class="empty-note">No experience added yet.</div>`; return; }
  el.innerHTML = list.map((e, i) => `
    <div class="timeline-item reveal" style="--i:${i}">
      <div class="timeline-num">${String(i + 1).padStart(2, "0")}</div>
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <h3 class="timeline-role">${PF.esc(e.role)}</h3>
        <div class="timeline-meta">
          <span class="timeline-company">${PF.esc(e.company)}</span>
          <span class="timeline-duration">${PF.esc(e.duration)}</span>
        </div>
        <p class="timeline-desc">${PF.esc(e.shortDescription)}</p>
        <button class="see-more" data-kind="experience" data-id="${e.id}">See full description →</button>
      </div>
    </div>
  `).join("");
}

/* ---------------- Nav ---------------- */
function setupNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle) return;
  toggle.addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => links.classList.remove("open")));
}

/* ---------------- Scroll reveal ---------------- */
function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        if (entry.target.classList.contains("skill-group")) {
          entry.target.querySelectorAll(".skill-bar-fill").forEach((f) => (f.style.width = f.dataset.level + "%"));
        }
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  setTimeout(() => document.querySelectorAll(".reveal").forEach((el) => io.observe(el)), 50);
}

/* ---------------- Modal ---------------- */
function setupModal() {
  const overlay = document.getElementById("modalOverlay");
  const box = document.getElementById("modalBox");

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".see-more");
    if (btn) {
      const kind = btn.dataset.kind;
      const id = btn.dataset.id;
      const map = { project: "projects", certificate: "certificates", experience: "experience" };
      const list = await PF.getList(map[kind]);
      const item = list.find((i) => i.id === id);
      if (!item) return;
      openModal(item, kind);
    }
    if (e.target === overlay || e.target.closest("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  function openModal(item, kind) {
    const meta = kind === "project"
      ? (item.tech || []).join(" · ")
      : kind === "certificate"
        ? `${item.issuer} · ${item.date}`
        : `${item.company} · ${item.duration}`;

    box.innerHTML = `
      <button class="modal-close" data-close aria-label="Close">×</button>
      ${item.image ? `<div class="modal-media"><img src="${PF.esc(item.image)}" alt="${PF.esc(item.title || item.role)}"></div>` : ""}
      <div class="modal-content">
        <h3>${PF.esc(item.title || item.role)}</h3>
        <div class="modal-meta">${PF.esc(meta)}</div>
        <p>${PF.esc(item.description)}</p>
        ${kind === "project" ? `
          <div class="card-actions" style="margin-top:18px;">
            ${item.github ? `<a class="btn btn-outline btn-sm" href="${PF.esc(item.github)}" target="_blank" rel="noopener">${icon("github")} Code</a>` : ""}
            ${item.demo ? `<a class="btn btn-primary btn-sm" href="${PF.esc(item.demo)}" target="_blank" rel="noopener">${icon("external")} Live Demo</a>` : ""}
          </div>` : ""}
        ${kind === "certificate" && item.verifyUrl ? `
          <div style="margin-top:18px;"><a class="verify-link" href="${PF.esc(item.verifyUrl)}" target="_blank" rel="noopener">${icon("check")} Verify certificate</a></div>` : ""}
      </div>
    `;
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }
}

/* ---------------- Terminal hero animation ---------------- */
async function runTerminal() {
  const p = await PF.getProfile();
  const el = document.getElementById("terminalBody");
  const allSkills = await PF.getList("skills");
  const skills = allSkills.slice(0, 5).map((s) => s.name);
  const lines = [
    { prompt: "guest@portfolio", cmd: "whoami" },
    { out: p.name },
    { prompt: "guest@portfolio", cmd: "cat role.txt" },
    { out: p.role },
    { prompt: "guest@portfolio", cmd: "ls skills/" },
    { out: skills.map((s) => `<span class="k">${PF.esc(s)}</span>`).join("  ") || "javascript  python  react" },
    { prompt: "guest@portfolio", cmd: "./say_hello.sh" },
    { out: "Thanks for stopping by — scroll down ↓" },
  ];

  el.innerHTML = "";
  let i = 0;

  function typeNext() {
    if (i >= lines.length) {
      const caret = document.createElement("span");
      caret.className = "caret";
      el.appendChild(caret);
      return;
    }
    const line = lines[i];
    const div = document.createElement("div");
    div.className = "terminal-line";
    el.appendChild(div);

    if (line.prompt) {
      const promptSpan = `<span class="terminal-prompt">${line.prompt} $</span>`;
      typeText(div, promptSpan, line.cmd, () => { i++; setTimeout(typeNext, 220); });
    } else {
      div.innerHTML = `<span class="terminal-out">${line.out}</span>`;
      i++;
      setTimeout(typeNext, 320);
    }
  }

  function typeText(container, prefixHtml, text, done) {
    container.innerHTML = prefixHtml + " ";
    let idx = 0;
    const speed = 28;
    (function step() {
      if (idx <= text.length) {
        container.innerHTML = prefixHtml + " " + text.slice(0, idx);
        idx++;
        setTimeout(step, speed);
      } else {
        done();
      }
    })();
  }

  typeNext();
}

/* ---------------- Icons ---------------- */
function icon(name) {
  const icons = {
    github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.82 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.16v3.2c0 .3.21.66.79.55A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0Z"/></svg>`,
    mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m3 6.5 9 6.5 9-6.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h6v6M20 4 10 14M6 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0 4.5-4.5M12 15 7.5 10.5M4 19h16" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };
  return icons[name] || "";
}
