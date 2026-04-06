// ─── Constants ───

const STATUS_ICONS = {
  active: "◉", upcoming: "◎", done: "✓", idea: "✦",
  researching: "⊛", "in-progress": "▸", applied: "→",
  accepted: "★", paused: "⏸",
};

const CAT_LABELS = {
  "ai-safety": "safety", math: "math", ml: "ml",
  philosophy: "phil", swe: "swe",
};

const RESOURCE_TYPES = ["paper", "repo", "course", "blog", "other"];

const INITIAL_DATA = {
  learning: [
    { id: "l1", title: "Technical AI Safety — BlueDot Impact", status: "active", category: "ai-safety", notes: "Facilitated by AISA" },
    { id: "l2", title: "ARENA Notebooks — Transformers", status: "active", category: "ai-safety", notes: "Just started transformer section" },
    { id: "l3", title: "Math review (LA, Calc, Probability)", status: "active", category: "math", notes: "Refreshing fundamentals" },
    { id: "l4", title: "Google ML Crash Course + YouTube", status: "active", category: "ml", notes: "ML basics" },
    { id: "l5", title: "AFFINE Seminar on Superintelligence", status: "upcoming", category: "ai-safety", notes: "Starts April 28" },
  ],
  opportunities: [
    { id: "o1", title: "PhD Neurosymbolic AI — UvA", detail: "Under Martha Lewis", status: "researching", deadline: "", notes: "" },
    { id: "o2", title: "AI for Math Summer School", detail: "Renaissance Philosophy", status: "researching", deadline: "", notes: "" },
  ],
  writings: [
    { id: "w1", title: "Outer vs Inner Alignment", detail: "Focus: representational stability of features as attractors", status: "idea", notes: "" },
  ],
  resources: [],
  goals: {
    long: "Research intertwining math, CS, and philosophy — neurosymbolic AI, AI safety, formal methods",
    medium: "Get stronger at software engineering; build showcase projects",
    short: "Complete BlueDot + ARENA transformer section; apply to PhD and summer school",
  },
};

// ─── State ───

let data = null;
let currentTab = "overview";
let searchQuery = "";

// ─── Storage helpers ───

async function loadData() {
  try {
    const stored = await window.storage.get("stefano-dashboard-v2");
    if (stored?.value) {
      data = JSON.parse(stored.value);
      if (!data.resources) data.resources = [];
    } else {
      data = structuredClone(INITIAL_DATA);
      await saveData();
    }
  } catch {
    data = structuredClone(INITIAL_DATA);
  }
}

async function saveData() {
  try {
    await window.storage.set("stefano-dashboard-v2", JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save:", e);
  }
}

// ─── Delete helper ───

async function deleteItem(listKey, id) {
  if (!window.confirm("Are you sure you want to delete this?")) return;
  data[listKey] = data[listKey].filter((x) => x.id !== id);
  await saveData();
  updateContent();
}

// ─── Search helper ───

function applySearch(items) {
  if (!searchQuery) return items;
  const q = searchQuery.toLowerCase();
  return items.filter((item) => {
    const text = [item.title, item.detail, item.notes, ...(item.tags || [])].join(" ").toLowerCase();
    return text.includes(q);
  });
}

// ─── Rendering helpers ───

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "className") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  }
  for (const child of children) {
    if (child == null) continue;
    if (typeof child === "string" || typeof child === "number") {
      el.appendChild(document.createTextNode(child));
    } else if (Array.isArray(child)) {
      child.forEach((c) => c && el.appendChild(c));
    } else {
      el.appendChild(child);
    }
  }
  return el;
}

// ─── Card builders ───

function learningCard(item, showNotes = true) {
  const catClass = `cat-${item.category}`;
  const card = h("div", { className: `card card-learning ${catClass}`, onClick: () => openModal("learning", item) },
    h("div", { className: "card-row" },
      h("div", { className: "card-left" },
        h("span", { className: "card-icon" }, STATUS_ICONS[item.status] || "·"),
        h("span", { className: "card-title" }, item.title),
      ),
      h("div", { className: "card-right" },
        h("span", { className: "card-cat" }, CAT_LABELS[item.category] || item.category),
        h("button", { className: "card-del-btn", onClick: (e) => { e.stopPropagation(); deleteItem("learning", item.id); } }, "×"),
      ),
    ),
  );
  if (showNotes && item.notes) {
    card.appendChild(h("div", { className: "card-detail" }, item.notes));
  }
  return card;
}

function genericCard(item, type) {
  const listKey = type === "opportunity" ? "opportunities" : "writings";
  const card = h("div", { className: "card card-generic", onClick: () => openModal(type, item) },
    h("div", { className: "card-row" },
      h("div", { className: "card-left" },
        h("span", { className: "card-icon" }, STATUS_ICONS[item.status] || "·"),
        h("span", { className: "card-title" }, item.title),
      ),
      h("div", { className: "card-right" },
        item.deadline ? h("span", { className: "card-deadline" }, item.deadline) : null,
        h("button", { className: "card-del-btn", onClick: (e) => { e.stopPropagation(); deleteItem(listKey, item.id); } }, "×"),
      ),
    ),
  );
  if (item.detail) card.appendChild(h("div", { className: "card-detail" }, item.detail));
  if (item.notes) card.appendChild(h("div", { className: "card-notes" }, item.notes));
  return card;
}

function resourceCard(item) {
  const card = h("div", { className: "card card-resource", onClick: () => item.url && window.shell.openExternal(item.url) },
    h("div", { className: "card-row" },
      h("div", { className: "card-left" },
        h("span", { className: `resource-type-badge type-${item.type || "other"}` }, item.type || "other"),
        h("span", { className: "card-title" }, item.title),
      ),
      h("div", { className: "card-right" },
        h("button", { className: "card-edit-btn", onClick: (e) => { e.stopPropagation(); openModal("resource", item); } }, "✎"),
        h("button", { className: "card-del-btn", onClick: (e) => { e.stopPropagation(); deleteItem("resources", item.id); } }, "×"),
      ),
    ),
  );
  if (item.tags && item.tags.length > 0) {
    card.appendChild(h("div", { className: "tag-row" },
      ...item.tags.map((t) => h("span", { className: "tag-chip" }, t)),
    ));
  }
  if (item.notes) card.appendChild(h("div", { className: "card-notes" }, item.notes));
  return card;
}

function sectionBlock(title, count, ...children) {
  return h("div", { className: "section" },
    h("div", { className: "section-header" },
      h("span", { className: "section-title" }, title),
      h("span", { className: "section-count" }, `(${count})`),
    ),
    ...children,
  );
}

// ─── Tab renderers ───

function renderOverview() {
  const active = applySearch(data.learning.filter((l) => l.status === "active"));
  const upcoming = applySearch(data.learning.filter((l) => l.status === "upcoming"));

  const learningSection = sectionBlock("Active Learning", active.length,
    ...active.map((l) => learningCard(l)),
  );

  if (upcoming.length > 0) {
    learningSection.appendChild(h("div", { className: "sub-label" }, "Upcoming"));
    upcoming.forEach((l) => learningSection.appendChild(learningCard(l)));
  }

  const opps = applySearch(data.opportunities);
  const writes = applySearch(data.writings);

  const oppSection = sectionBlock("Opportunities", opps.length,
    ...opps.map((o) => genericCard(o, "opportunity")),
  );

  const writeSection = sectionBlock("Writing Ideas", writes.length,
    ...writes.map((w) => genericCard(w, "writing")),
  );

  const goalsBox = h("div", { className: "goals-box" },
    h("div", { className: "sub-label", style: { marginTop: 0 } }, "Goals"),
    ...["short", "medium", "long"].map((g) =>
      h("div", { className: "goal-row" },
        h("span", { className: "goal-label" }, g),
        h("span", { className: "goal-text" }, data.goals[g]),
      ),
    ),
  );

  return h("div", {}, learningSection, oppSection, writeSection, goalsBox);
}

function renderLearning() {
  const items = applySearch(data.learning);
  return h("div", {},
    h("div", { className: "toolbar" },
      h("span", { className: "toolbar-count" }, `${items.length} tracks`),
      h("button", { className: "add-btn", onClick: () => openModal("learning", null) }, "+ add"),
    ),
    ...items.map((l) => learningCard(l, true)),
  );
}

function renderOpportunities() {
  const items = applySearch(data.opportunities);
  return h("div", {},
    h("div", { className: "toolbar" },
      h("span", { className: "toolbar-count" }, `${items.length} items`),
      h("button", { className: "add-btn", onClick: () => openModal("opportunity", null) }, "+ add"),
    ),
    ...items.map((o) => genericCard(o, "opportunity")),
  );
}

function renderWriting() {
  const items = applySearch(data.writings);
  return h("div", {},
    h("div", { className: "toolbar" },
      h("span", { className: "toolbar-count" }, `${items.length} pieces`),
      h("button", { className: "add-btn", onClick: () => openModal("writing", null) }, "+ add"),
    ),
    ...items.map((w) => genericCard(w, "writing")),
  );
}

function renderResources() {
  const items = applySearch(data.resources);
  return h("div", {},
    h("div", { className: "toolbar" },
      h("span", { className: "toolbar-count" }, `${items.length} links`),
      h("button", { className: "add-btn", onClick: () => openModal("resource", null) }, "+ add"),
    ),
    ...items.map((r) => resourceCard(r)),
  );
}

function renderGoals() {
  const defs = [
    { key: "short", label: "Short-term", hint: "Next 1-3 months" },
    { key: "medium", label: "Medium-term", hint: "6-12 months" },
    { key: "long", label: "Long-term", hint: "2+ years" },
  ];

  return h("div", {},
    ...defs.map((g) => {
      const textarea = h("textarea", {
        className: "goal-textarea",
        rows: "3",
      });
      textarea.value = data.goals[g.key];
      textarea.addEventListener("input", async (e) => {
        data.goals[g.key] = e.target.value;
        await saveData();
      });

      return h("div", { className: "goal-edit-box" },
        h("div", { className: "goal-edit-header" },
          h("span", { className: "goal-edit-title" }, g.label),
          h("span", { className: "goal-edit-hint" }, g.hint),
        ),
        textarea,
      );
    }),
  );
}

// ─── Modal ───

function openModal(type, existingItem) {
  let item;
  if (existingItem) {
    item = structuredClone(existingItem);
  } else if (type === "learning") {
    item = { id: "l" + Date.now(), title: "", status: "active", category: "ai-safety", notes: "" };
  } else if (type === "opportunity") {
    item = { id: "o" + Date.now(), title: "", detail: "", status: "researching", deadline: "", notes: "" };
  } else if (type === "resource") {
    item = { id: "r" + Date.now(), title: "", url: "", type: "paper", tags: [], notes: "" };
  } else {
    item = { id: "w" + Date.now(), title: "", detail: "", status: "idea", notes: "" };
  }

  const isNew = !existingItem;
  const typeLabel = type === "learning" ? "Learning Track"
    : type === "opportunity" ? "Opportunity"
    : type === "resource" ? "Resource"
    : "Writing Piece";
  const listKey = type === "learning" ? "learning"
    : type === "opportunity" ? "opportunities"
    : type === "resource" ? "resources"
    : "writings";

  const titleInput = h("input", { className: "field-input", placeholder: "Title" });
  titleInput.value = item.title;
  titleInput.addEventListener("input", (e) => { item.title = e.target.value; });

  const detailInput = h("input", { className: "field-input", placeholder: "Detail" });
  detailInput.value = item.detail || "";
  detailInput.addEventListener("input", (e) => { item.detail = e.target.value; });

  const urlInput = h("input", { className: "field-input", placeholder: "https://..." });
  urlInput.value = item.url || "";
  urlInput.addEventListener("input", (e) => { item.url = e.target.value; });

  const tagsInput = h("input", { className: "field-input", placeholder: "comma-separated tags" });
  tagsInput.value = (item.tags || []).join(", ");
  tagsInput.addEventListener("input", (e) => {
    item.tags = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
  });

  const resourceTypeSelect = h("select", { className: "field-input" },
    ...RESOURCE_TYPES.map((t) => {
      const opt = h("option", { value: t }, t);
      if (t === (item.type || "paper")) opt.selected = true;
      return opt;
    }),
  );
  resourceTypeSelect.addEventListener("change", (e) => { item.type = e.target.value; });

  const statusSelect = h("select", { className: "field-input" },
    ...Object.entries(STATUS_ICONS).map(([s, icon]) => {
      const opt = h("option", { value: s }, `${icon} ${s}`);
      if (s === item.status) opt.selected = true;
      return opt;
    }),
  );
  statusSelect.addEventListener("change", (e) => { item.status = e.target.value; });

  const catSelect = h("select", { className: "field-input" },
    ...Object.entries(CAT_LABELS).map(([val, label]) => {
      const opt = h("option", { value: val }, label);
      if (val === (item.category || "ai-safety")) opt.selected = true;
      return opt;
    }),
  );
  catSelect.addEventListener("change", (e) => { item.category = e.target.value; });

  const deadlineInput = h("input", { className: "field-input", placeholder: "e.g. June 2025" });
  deadlineInput.value = item.deadline || "";
  deadlineInput.addEventListener("input", (e) => { item.deadline = e.target.value; });

  const notesArea = h("textarea", { className: "field-textarea", rows: "3" });
  notesArea.value = item.notes || "";
  notesArea.addEventListener("input", (e) => { item.notes = e.target.value; });

  const rowChildren = [
    h("div", {},
      h("div", { className: "field-label" }, "Status"),
      statusSelect,
    ),
  ];
  if (type === "learning") {
    rowChildren.push(h("div", {},
      h("div", { className: "field-label" }, "Category"),
      catSelect,
    ));
  }
  if (type === "opportunity") {
    rowChildren.push(h("div", {},
      h("div", { className: "field-label" }, "Deadline"),
      deadlineInput,
    ));
  }

  const save = async () => {
    const idx = data[listKey].findIndex((x) => x.id === item.id);
    if (idx >= 0) data[listKey][idx] = item;
    else data[listKey].push(item);
    await saveData();
    closeModal();
    updateContent();
  };

  const del = async () => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    data[listKey] = data[listKey].filter((x) => x.id !== item.id);
    await saveData();
    closeModal();
    updateContent();
  };

  // Build modal fields based on type
  const fields = [
    h("div", { className: "field-group" },
      h("div", { className: "field-label" }, "Title"),
      titleInput,
    ),
  ];

  if (type === "resource") {
    fields.push(
      h("div", { className: "field-group" },
        h("div", { className: "field-label" }, "URL"),
        urlInput,
      ),
      h("div", { className: "field-row" },
        h("div", {},
          h("div", { className: "field-label" }, "Type"),
          resourceTypeSelect,
        ),
        h("div", {},
          h("div", { className: "field-label" }, "Tags"),
          tagsInput,
        ),
      ),
    );
  } else {
    if (type !== "learning") {
      fields.push(h("div", { className: "field-group" },
        h("div", { className: "field-label" }, "Detail"),
        detailInput,
      ));
    }
    fields.push(h("div", { className: "field-row" }, ...rowChildren));
  }

  fields.push(
    h("div", { className: "field-group" },
      h("div", { className: "field-label" }, "Notes"),
      notesArea,
    ),
  );

  const box = h("div", { className: "modal-box", onClick: (e) => e.stopPropagation() },
    h("div", { className: "modal-title" }, typeLabel),
    ...fields,
    h("div", { className: "modal-actions" },
      isNew
        ? h("div")
        : h("button", { className: "btn-delete", onClick: del }, "Delete"),
      h("div", { className: "btn-group" },
        h("button", { className: "btn-cancel", onClick: closeModal }, "Cancel"),
        h("button", { className: "btn-save", onClick: save }, "Save"),
      ),
    ),
  );

  const overlay = h("div", { className: "modal-overlay", onClick: closeModal }, box);
  document.body.appendChild(overlay);
}

function closeModal() {
  const overlay = document.querySelector(".modal-overlay");
  if (overlay) overlay.remove();
}

// ─── Content updater (used for search/save without full re-render) ───

function updateContent() {
  const content = document.querySelector(".content");
  if (!content) return;
  content.innerHTML = "";
  switch (currentTab) {
    case "overview":      content.appendChild(renderOverview()); break;
    case "learning":      content.appendChild(renderLearning()); break;
    case "opportunities": content.appendChild(renderOpportunities()); break;
    case "writing":       content.appendChild(renderWriting()); break;
    case "resources":     content.appendChild(renderResources()); break;
    case "goals":         content.appendChild(renderGoals()); break;
  }
}

// ─── Main render ───

const TABS = ["overview", "learning", "opportunities", "writing", "resources", "goals"];

// Maps tab name to the modal type opened by the "n" shortcut
const TAB_NEW_TYPE = {
  learning: "learning",
  opportunities: "opportunity",
  writing: "writing",
  resources: "resource",
};

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  // Header
  app.appendChild(
    h("div", { className: "header" },
      h("span", { className: "header-title" }, "⊢ research_log"),
      h("span", { className: "header-sub" }, "stefano zuffi"),
      h("span", { className: "header-tag" }, "logic ∩ ai safety ∩ neurosymbolic"),
    ),
  );

  // Tabs + search
  const searchInput = h("input", {
    className: "search-input",
    placeholder: "search… (/)",
    id: "search-input",
  });
  searchInput.value = searchQuery;
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    updateContent();
  });

  const tabBar = h("div", { className: "tab-bar" },
    ...TABS.map((t) =>
      h("button", {
        className: `tab-btn ${t === currentTab ? "active" : ""}`,
        onClick: () => { currentTab = t; searchQuery = ""; render(); },
      }, t),
    ),
    searchInput,
  );
  app.appendChild(tabBar);

  // Content
  const content = h("div", { className: "content" });
  app.appendChild(content);
  updateContent();
}

// ─── Keyboard shortcuts ───

document.addEventListener("keydown", (e) => {
  // Ignore when typing in an input/textarea/select
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    if (e.key === "Escape") {
      document.activeElement.blur();
      closeModal();
    }
    return;
  }

  if (e.key === "Escape") {
    closeModal();
  } else if (e.key === "n" || e.key === "N") {
    const type = TAB_NEW_TYPE[currentTab];
    if (type) openModal(type, null);
  } else if (e.key === "/") {
    e.preventDefault();
    document.getElementById("search-input")?.focus();
  }
});

// ─── Init ───

(async () => {
  await loadData();
  render();
})();
