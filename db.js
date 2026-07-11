/* ============================================================
   db.js — shared data layer, backed by Supabase (a real cloud
   database). Replaces the old localStorage-only storage.js.
   Every function here is async — always use `await`.
   ============================================================ */

const PF = (() => {
  let client = null;
  let configError = false;

  function getClient() {
    if (client) return client;
    if (typeof SUPABASE_URL === "undefined" || SUPABASE_URL.includes("YOUR-PROJECT")) {
      configError = true;
      showConfigBanner();
      throw new Error("Supabase is not configured yet — see config.js");
    }
    client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  }

  function showConfigBanner() {
    if (document.getElementById("pfConfigBanner")) return;
    const bar = document.createElement("div");
    bar.id = "pfConfigBanner";
    bar.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:9999;background:#e5636f;color:#fff;" +
      "font-family:monospace;font-size:13px;padding:12px 20px;text-align:center;";
    bar.textContent =
      "Supabase isn't configured yet. Open config.js and paste in your Project URL and anon key (see supabase-setup.sql / README).";
    document.body.prepend(bar);
  }

  const TABLES = ["projects", "certificates", "skills", "experience"];

  const DEFAULTS = {
    profile: {
      id: "main",
      name: "Your Name",
      role: "B.Tech Graduate · Software Engineer",
      tagline: "I build fast, reliable software and enjoy turning hard problems into clean, working code.",
      about:
        "I'm a Computer Science engineering graduate who loves shipping things end to end — from a rough idea to a deployed product. I'm comfortable across the stack, I care about clean code and good UX, and I'm always picking up the next tool that lets me build faster.",
      email: "you@example.com",
      github: "https://github.com/yourusername",
      linkedin: "https://linkedin.com/in/yourusername",
      resumeUrl: "resume.pdf",
      location: "Jaipur, India",
    },
    projects: [
      {
        id: "p1",
        title: "E-Commerce Platform",
        shortDescription: "Full-stack storefront with cart, auth and a Stripe-powered checkout.",
        description:
          "A full-stack e-commerce application built with React, Node.js and MongoDB. Features include JWT authentication, a persistent cart, product search and filtering, an admin dashboard for inventory, and a Stripe test-mode checkout.",
        image: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?q=80&w=1200&auto=format&fit=crop",
        github: "https://github.com/yourusername/ecommerce-platform",
        demo: "https://your-demo-link.example.com",
        tech: ["React", "Node.js", "MongoDB", "Stripe"],
      },
    ],
    certificates: [
      {
        id: "c1",
        title: "AWS Certified Cloud Practitioner",
        issuer: "Amazon Web Services",
        date: "2025",
        shortDescription: "Foundational certification covering AWS core services, security and pricing.",
        description:
          "Covers cloud concepts, core AWS services, billing and pricing models, and the AWS Well-Architected Framework.",
        image: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?q=80&w=1200&auto=format&fit=crop",
        verifyUrl: "https://www.credly.com/",
      },
    ],
    skills: [
      { id: "s1", category: "Languages", name: "JavaScript / TypeScript", level: 90 },
      { id: "s4", category: "Frontend", name: "React", level: 90 },
      { id: "s6", category: "Backend", name: "Node.js / Express", level: 85 },
    ],
    experience: [
      {
        id: "e1",
        role: "Software Engineering Intern",
        company: "Tech Company Pvt. Ltd.",
        duration: "Jun 2025 — Aug 2025",
        shortDescription: "Built internal tooling and shipped features to the main product in a 3-month internship.",
        description:
          "Worked within a 6-person product team on an internal analytics dashboard. Shipped 4 features end to end, wrote unit and integration tests, and cut a key report's load time by 40%.",
      },
    ],
  };

  function uid(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function esc(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function init() {
    try {
      getClient();
    } catch (e) {
      /* banner already shown */
    }
  }

  /* ---------------- Profile ---------------- */
  async function getProfile() {
    const sb = getClient();
    const { data, error } = await sb.from("profile").select("*").eq("id", "main").maybeSingle();
    if (error) console.error("getProfile error", error);
    return data || DEFAULTS.profile;
  }
  async function setProfile(p) {
    const sb = getClient();
    const { error } = await sb.from("profile").upsert({ ...p, id: "main" });
    if (error) throw error;
    return true;
  }

  /* ---------------- Lists ---------------- */
  async function getList(name) {
    const sb = getClient();
    const { data, error } = await sb.from(name).select("*").order("created_at", { ascending: true });
    if (error) { console.error("getList error", name, error); return []; }
    return data || [];
  }

  async function addItem(name, item) {
    const sb = getClient();
    const row = { ...item, id: item.id || uid(name.slice(0, 3)) };
    const { data, error } = await sb.from(name).insert(row).select().single();
    if (error) throw error;
    return data;
  }

  async function updateItem(name, id, patch) {
    const sb = getClient();
    const { error } = await sb.from(name).update(patch).eq("id", id);
    if (error) throw error;
    return true;
  }

  async function deleteItem(name, id) {
    const sb = getClient();
    const { error } = await sb.from(name).delete().eq("id", id);
    if (error) throw error;
    return true;
  }

  /* ---------------- Auth ---------------- */
  async function signIn(email, password) {
    const sb = getClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  async function signOut() {
    const sb = getClient();
    await sb.auth.signOut();
  }
  async function getSession() {
    const sb = getClient();
    const { data } = await sb.auth.getSession();
    return data.session;
  }

  /* ---------------- Backup / restore ---------------- */
  async function exportAll() {
    const profile = await getProfile();
    const out = { profile };
    for (const name of TABLES) out[name] = await getList(name);
    return JSON.stringify(out, null, 2);
  }

  async function clearTable(name) {
    const sb = getClient();
    // delete everything by matching a condition that's always true
    await sb.from(name).delete().neq("id", "___none___");
  }

  async function importAll(json) {
    const data = JSON.parse(json);
    if (data.profile) await setProfile(data.profile);
    for (const name of TABLES) {
      if (Array.isArray(data[name])) {
        await clearTable(name);
        const sb = getClient();
        if (data[name].length) {
          const { error } = await sb.from(name).insert(data[name]);
          if (error) throw error;
        }
      }
    }
  }

  async function resetAll() {
    await setProfile(DEFAULTS.profile);
    for (const name of TABLES) {
      await clearTable(name);
      const sb = getClient();
      if (DEFAULTS[name].length) await sb.from(name).insert(DEFAULTS[name]);
    }
  }

  async function seedIfEmpty() {
    const existing = await getList("projects");
    if (existing.length === 0) await resetAll();
  }

  return {
    init,
    getClient,
    getProfile,
    setProfile,
    getList,
    addItem,
    updateItem,
    deleteItem,
    exportAll,
    importAll,
    resetAll,
    seedIfEmpty,
    signIn,
    signOut,
    getSession,
    esc,
    uid,
  };
})();
