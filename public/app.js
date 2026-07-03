const app = document.getElementById("app");

let manifest = null;
let drawerOpen = false;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseRoute() {
  const hash = location.hash.replace(/^#\/?/, "") || "/";
  const parts = hash.split("/").filter(Boolean);

  if (parts[0] === "t" && parts[1]) {
    const topicSlug = parts[1];
    const pageIndex = parts[2] === "p" && parts[3] ? Number(parts[3]) : 0;
    return { view: "viewer", topicSlug, pageIndex };
  }

  return { view: "home" };
}

function findTopic(topicSlug) {
  return manifest?.topics.find((topic) => topic.slug === topicSlug);
}

function routeToTopic(topicSlug, pageIndex = 0) {
  location.hash = `#/t/${topicSlug}/p/${pageIndex}`;
}

function icon(name) {
  const icons = {
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    prev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    menu: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  return icons[name] ?? "";
}

function renderPageList(pages, activeIndex) {
  return `
    <ul class="page-list">
      ${pages
        .map(
          (page, index) => `
            <li>
              <button type="button" class="${index === activeIndex ? "active" : ""}" data-page-index="${index}">
                <span class="index">${index + 1}.</span>
                ${escapeHtml(page.label)}
              </button>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function renderHome() {
  const topics = manifest.topics
    .map(
      (topic) => `
        <a class="card" href="#/t/${topic.slug}/p/0" data-nav>
          <h2>${escapeHtml(topic.title)}</h2>
          <p>${topic.pages.length} sections</p>
          <div class="card-meta">Open preview</div>
        </a>
      `
    )
    .join("");

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="topbar-title">Lesson previews</div>
      </header>
      <main class="home">
        <h1>Lesson material previews</h1>
        <p class="home-lead">
          Browse renderings of learning content at full size, as they would appear in the app.
          Pick a topic and step through each section.
        </p>
        <div class="topic-grid">${topics}</div>
      </main>
    </div>
  `;
}

function renderViewer(route) {
  const topic = findTopic(route.topicSlug);

  if (!topic) {
    app.innerHTML = `<div class="empty">Topic not found.</div>`;
    return;
  }

  const pageIndex = Math.min(Math.max(route.pageIndex, 0), topic.pages.length - 1);
  const page = topic.pages[pageIndex];
  const hasPrev = pageIndex > 0;
  const hasNext = pageIndex < topic.pages.length - 1;

  const tabs = topic.pages
    .map(
      (item, index) => `
        <button
          type="button"
          class="section-tab ${index === pageIndex ? "active" : ""}"
          data-page-index="${index}"
        >
          ${escapeHtml(item.label)}
        </button>
      `
    )
    .join("");

  const drawer = drawerOpen
    ? `
      <div class="drawer-backdrop" data-action="close-drawer"></div>
      <aside class="drawer" aria-label="Section list">
        <header>
          <strong>Sections</strong>
          <button class="icon-btn" type="button" data-action="close-drawer" aria-label="Close">${icon("close")}</button>
        </header>
        ${renderPageList(topic.pages, pageIndex)}
      </aside>
    `
    : "";

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <button class="icon-btn" type="button" data-action="home" aria-label="Back to topics">${icon("back")}</button>
        <button class="icon-btn mobile-drawer-toggle" type="button" data-action="open-drawer" aria-label="Open section list">${icon("menu")}</button>
        <div class="topbar-spacer">
          <div class="topbar-title">${escapeHtml(topic.title)}</div>
          <div class="topbar-subtitle">${escapeHtml(page.label)}</div>
        </div>
        <span class="keyboard-hint">← → to navigate</span>
        <button class="icon-btn" type="button" data-action="prev" ${hasPrev ? "" : "disabled"} aria-label="Previous section">${icon("prev")}</button>
        <button class="icon-btn" type="button" data-action="next" ${hasNext ? "" : "disabled"} aria-label="Next section">${icon("next")}</button>
      </header>

      <div class="section-tabs" aria-label="Section tabs">${tabs}</div>

      <div class="viewer-layout with-sidebar">
        <aside class="sidebar" aria-label="Section list">
          <h2>Sections</h2>
          ${renderPageList(topic.pages, pageIndex)}
        </aside>

        <main class="viewport">
          <div class="page-frame">
            <img
              src="${page.src}"
              alt="${escapeHtml(topic.title)} — ${escapeHtml(page.label)}"
              width="1710"
              height="2421"
              loading="eager"
              decoding="async"
            />
          </div>
        </main>
      </div>

      ${drawer}
    </div>
  `;

  if (route.pageIndex !== pageIndex) {
    routeToTopic(route.topicSlug, pageIndex);
  }
}

function render() {
  if (!manifest) return;

  const route = parseRoute();

  if (route.view === "viewer") {
    renderViewer(route);
  } else {
    drawerOpen = false;
    renderHome();
  }

  document.title =
    route.view === "viewer"
      ? `${findTopic(route.topicSlug)?.title ?? "Preview"} — Lesson previews`
      : "Lesson previews";
}

function onClick(event) {
  const pageButton = event.target.closest("[data-page-index]");
  if (pageButton) {
    const route = parseRoute();
    if (route.view !== "viewer") return;
    drawerOpen = false;
    routeToTopic(route.topicSlug, Number(pageButton.dataset.pageIndex));
    return;
  }

  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;

  const route = parseRoute();

  switch (actionEl.dataset.action) {
    case "home":
      location.hash = "#/";
      break;
    case "prev":
      if (route.view === "viewer" && route.pageIndex > 0) {
        routeToTopic(route.topicSlug, route.pageIndex - 1);
      }
      break;
    case "next": {
      if (route.view !== "viewer") break;
      const topic = findTopic(route.topicSlug);
      if (topic && route.pageIndex < topic.pages.length - 1) {
        routeToTopic(route.topicSlug, route.pageIndex + 1);
      }
      break;
    }
    case "open-drawer":
      drawerOpen = true;
      render();
      break;
    case "close-drawer":
      drawerOpen = false;
      render();
      break;
    default:
      break;
  }
}

function onKeyDown(event) {
  const route = parseRoute();
  if (route.view !== "viewer") return;
  if (event.target.closest("input, textarea, select")) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    if (route.pageIndex > 0) {
      routeToTopic(route.topicSlug, route.pageIndex - 1);
    }
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    const topic = findTopic(route.topicSlug);
    if (topic && route.pageIndex < topic.pages.length - 1) {
      routeToTopic(route.topicSlug, route.pageIndex + 1);
    }
  }
}

async function init() {
  const response = await fetch("/manifest.json");
  manifest = await response.json();

  if (!location.hash) {
    location.hash = "#/";
  }

  render();
  window.addEventListener("hashchange", render);
  app.addEventListener("click", onClick);
  window.addEventListener("keydown", onKeyDown);
}

init().catch((error) => {
  app.innerHTML = `<div class="empty">Failed to load previews: ${escapeHtml(error.message)}</div>`;
});
