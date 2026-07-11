/* ================= CONFIG ================= */
const FIELD_CONFIGS = {
  projects: [
    { key: "title", label: "Project title", type: "text", required: true },
    { key: "image", label: "Image URL", type: "text", required: true, hint: "Paste any image URL (e.g. from Unsplash, or your own hosted image)." },
    { key: "github", label: "GitHub link", type: "text" },
    { key: "demo", label: "Live demo link", type: "text" },
    { key: "tech", label: "Tech stack (comma separated)", type: "text", full: true, isList: true },
    { key: "shortDescription", label: "Short description (shown on card)", type: "textarea", full: true, required: true },
    { key: "description", label: "Full description (shown in \"See more\")", type: "textarea", full: true, required: true },
  ],
  certificates: [
    { key: "title", label: "Certificate title", type: "text", required: true },
    { key: "issuer", label: "Issued by", type: "text", required: true },
    { key: "date", label: "Date", type: "text" },
    { key: "image", label: "Image URL", type: "text", required: true, full: true },
    { key: "verifyUrl", label: "Verify certificate link", type: "text", full: true },
    { key: "shortDescription", label: "Short description (shown on card)", type: "textarea", full: true, required: true },
    { key: "description", label: "Full description (shown in \"See more\")", type: "textarea", full: true, required: true },
  ],
  skills: [
    { key: "category", label: "Category (e.g. Frontend, Tools)", type: "text", required: true },
    { key: "name", label: "Skill name", type: "text", required: true },
    { key: "level", label: "Proficiency (0-100)", type: "number", required: true },
  ],
  experience: [
    { key: "role", label: "Role / title", type: "text", required: true },
    { key: "company", label: "Company / org", type: "text", required: true },
    { key: "duration", label: "Duration (e.g. Jun 2025 — Aug 2025)", type: "text", required: true },
    { key: "shortDescription", label: "Short description (shown on timeline)", type: "textarea", full: true, required: true },
    { key: "description", label: "Full description (shown in \"See more\")", type: "textarea", full: true, required: true },
  ],
};

const LABELS = { projects: "Project", certificates: "Certificate", skills: "Skill", experience: "Experience" };
let editingId = { projects: null, certificates: null, skills: null, experience: null };

/* ================= INIT / AUTH ================= */
document.addEventListener("DOMContentLoaded", async () => {
  await PF.init();

  const session = await safeCall(() => PF.getSession());
  if (session) await showApp();
  else showLogin();

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const err = document.getElementById("loginError");
    err.classList.remove("show");
    try {
      await PF.signIn(email, password);
      await showApp();
    } catch (e) {
      err.textContent = e.message || "Incorrect email or password. Try again.";
      err.classList.add("show");
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await PF.signOut();
    showLogin();
  });

  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.getElementById("exportBtn").addEventListener("click", async () => {
    const json = await safeCall(() => PF.exportAll());
    if (json === undefined) return;
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "portfolio-data.json";
    a.click();
    toast("Exported portfolio-data.json");
  });

  document.getElementById("importInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const ok = await safeCall(() => PF.importAll(reader.result));
      if (ok === undefined) return;
      toast("Import successful — reloading");
      setTimeout(() => location.reload(), 700);
    };
    reader.readAsText(file);
  });

  document.getElementById("resetBtn").addEventListener("click", async () => {
    if (!confirm("Reset all portfolio data back to the sample defaults? This cannot be undone.")) return;
    const ok = await safeCall(() => PF.resetAll());
    if (ok === undefined) return;
    toast("Data reset — reloading");
    setTimeout(() => location.reload(), 700);
  });

  document.getElementById("seedBtn").addEventListener("click", async () => {
    const ok = await safeCall(() => PF.seedIfEmpty());
    if (ok === undefined) return;
    toast("Sample data loaded — reloading");
    setTimeout(() => location.reload(), 700);
  });

  document.getElementById("changePassForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const p1 = document.getElementById("newPass").value;
    const p2 = document.getElementById("newPass2").value;
    if (p1 !== p2) { toast("Passwords don't match"); return; }
    if (p1.length < 6) { toast("Password must be at least 6 characters"); return; }
    try {
      const client = PF.getClient();
      const { error } = await client.auth.updateUser({ password: p1 });
      if (error) throw error;
      document.getElementById("changePassForm").reset();
      toast("Password updated");
    } catch (err) {
      toast("Failed: " + (err.message || "unknown error"));
    }
  });
});

async function safeCall(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error(err);
    toast("Error: " + (err.message || "something went wrong"));
    return undefined;
  }
}

async function showApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appScreen").style.display = "block";
  await renderProfileForm();
  for (const name of ["projects", "certificates", "skills", "experience"]) {
    await renderForm(name);
    await renderList(name);
  }
}
function showLogin() {
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("appScreen").style.display = "none";
}

function switchTab(name) {
  document.querySelectorAll(".admin-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".admin-panel").forEach((p) => p.classList.toggle("active", p.id === `panel-${name}`));
}

/* ================= TOAST ================= */
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

/* ================= PROFILE FORM ================= */
async function renderProfileForm() {
  const p = await safeCall(() => PF.getProfile());
  if (!p) return;
  const el = document.getElementById("profileForm");
  el.innerHTML = `
    <div class="form-grid">
      <div class="field"><label>Full name</label><input name="name" value="${attr(p.name)}"></div>
      <div class="field"><label>Role / headline</label><input name="role" value="${attr(p.role)}"></div>
      <div class="field full"><label>Tagline (one line, shown under headline)</label><input name="tagline" value="${attr(p.tagline)}"></div>
      <div class="field full"><label>About (shown in About section)</label><textarea name="about">${esc(p.about)}</textarea></div>
      <div class="field"><label>Email</label><input name="email" value="${attr(p.email)}"></div>
      <div class="field"><label>Location</label><input name="location" value="${attr(p.location)}"></div>
      <div class="field"><label>GitHub URL</label><input name="github" value="${attr(p.github)}"></div>
      <div class="field"><label>LinkedIn URL</label><input name="linkedin" value="${attr(p.linkedin)}"></div>
      <div class="field full"><label>Resume URL</label><input name="resumeUrl" value="${attr(p.resumeUrl)}">
        <div class="field-hint">Upload your resume PDF next to index.html (e.g. named resume.pdf) and put its filename here, or paste a hosted link.</div>
      </div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" type="submit">Save profile</button></div>
  `;
  el.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(el).entries());
    const ok = await safeCall(() => PF.setProfile({ ...p, ...data }));
    if (ok !== undefined) toast("Profile saved");
  };
}

/* ================= GENERIC FORM ================= */
async function renderForm(name) {
  const container = document.getElementById(`form-${name}`);
  const fields = FIELD_CONFIGS[name];
  const editId = editingId[name];
  let existing = null;
  if (editId) {
    const list = await safeCall(() => PF.getList(name));
    existing = (list || []).find((i) => i.id === editId) || null;
  }

  container.innerHTML = `
    <div class="form-grid">
      ${fields.map((f) => {
        const raw = existing ? existing[f.key] : "";
        const val = f.isList && Array.isArray(raw) ? raw.join(", ") : raw || "";
        const cls = f.full ? "field full" : "field";
        if (f.type === "textarea") {
          return `<div class="${cls}"><label>${f.label}</label><textarea name="${f.key}" ${f.required ? "required" : ""}>${esc(val)}</textarea></div>`;
        }
        return `<div class="${cls}"><label>${f.label}</label><input name="${f.key}" type="${f.type}" ${f.required ? "required" : ""} value="${attr(val)}">${f.hint ? `<div class="field-hint">${f.hint}</div>` : ""}</div>`;
      }).join("")}
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" type="submit">${existing ? `Save changes` : `Add ${LABELS[name].toLowerCase()}`}</button>
      ${existing ? `<button type="button" class="btn btn-ghost" id="cancelEdit-${name}">Cancel</button>` : ""}
    </div>
  `;

  container.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(container).entries());
    fields.forEach((f) => {
      if (f.isList) data[f.key] = (data[f.key] || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (f.type === "number") data[f.key] = Number(data[f.key]) || 0;
    });

    let ok;
    if (existing) {
      ok = await safeCall(() => PF.updateItem(name, existing.id, data));
      if (ok !== undefined) toast(`${LABELS[name]} updated`);
    } else {
      ok = await safeCall(() => PF.addItem(name, data));
      if (ok !== undefined) toast(`${LABELS[name]} added`);
    }
    if (ok === undefined) return;
    editingId[name] = null;
    await renderForm(name);
    await renderList(name);
  };

  const cancelBtn = document.getElementById(`cancelEdit-${name}`);
  if (cancelBtn) cancelBtn.addEventListener("click", async () => { editingId[name] = null; await renderForm(name); });
}

/* ================= GENERIC LIST ================= */
async function renderList(name) {
  const el = document.getElementById(`list-${name}`);
  const items = await safeCall(() => PF.getList(name));
  if (items === undefined) return;
  if (!items.length) {
    el.innerHTML = `<div class="empty-note">No ${name} yet — add your first one above.</div>`;
    return;
  }
  el.innerHTML = items.map((item) => {
    const title = item.title || item.role || item.name;
    const sub = item.issuer || item.company || item.category || "";
    const thumb = item.image ? `<img class="item-thumb" src="${attr(item.image)}" alt="">` : `<div class="item-thumb"></div>`;
    return `
      <div class="item-row">
        ${name === "skills" ? "" : thumb}
        <div class="item-main">
          <div class="item-title">${esc(title)}${name === "skills" ? ` <span style="color:var(--text-faint);font-weight:400;">— ${item.level}%</span>` : ""}</div>
          <div class="item-sub">${esc(sub)}</div>
        </div>
        <div class="item-row-actions">
          <button class="icon-btn" data-edit="${item.id}" data-name="${name}" aria-label="Edit">${svgEdit()}</button>
          <button class="icon-btn danger" data-del="${item.id}" data-name="${name}" aria-label="Delete">${svgTrash()}</button>
        </div>
      </div>
    `;
  }).join("");

  el.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      editingId[name] = btn.dataset.edit;
      await renderForm(name);
      document.getElementById(`form-${name}`).scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
  el.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete this ${LABELS[name].toLowerCase()}?`)) return;
      const ok = await safeCall(() => PF.deleteItem(name, btn.dataset.del));
      if (ok === undefined) return;
      await renderList(name);
      toast(`${LABELS[name]} deleted`);
    });
  });
}

/* ================= helpers ================= */
function esc(s = "") { return PF.esc(s); }
function attr(s = "") { return PF.esc(s).replace(/\n/g, "&#10;"); }
function svgEdit() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function svgTrash() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
