const year = document.querySelector("#year");
if (year) {
  year.textContent = new Date().getFullYear();
}

// Featured record clean switcher
const recordSlides = Array.from(document.querySelectorAll(".record-slide"));
const recordTabs = Array.from(document.querySelectorAll(".record-tab"));

let activeRecordIndex = 0;

function setRecord(index) {
  if (!recordSlides.length || index === activeRecordIndex) return;

  const nextIndex = (index + recordSlides.length) % recordSlides.length;
  const directionClass = nextIndex > activeRecordIndex ? "from-right" : "from-left";

  recordSlides.forEach((slide, slideIndex) => {
    slide.classList.remove("active", "from-left", "from-right");
    slide.setAttribute("aria-hidden", "true");

    if (slideIndex === nextIndex) {
      slide.classList.add("active", directionClass);
      slide.setAttribute("aria-hidden", "false");
    }
  });

  recordTabs.forEach((tab, tabIndex) => {
    const active = tabIndex === nextIndex;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  });

  activeRecordIndex = nextIndex;
}

recordTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setRecord(Number(tab.dataset.recordTarget));
  });
});

document.addEventListener("keydown", (event) => {
  const featured = document.querySelector("#featured");
  if (!featured || !recordSlides.length) return;

  const rect = featured.getBoundingClientRect();
  const sectionVisible = rect.top < window.innerHeight && rect.bottom > 0;

  if (!sectionVisible) return;

  if (event.key === "ArrowRight") {
    setRecord(activeRecordIndex + 1);
  }

  if (event.key === "ArrowLeft") {
    setRecord(activeRecordIndex - 1);
  }
});


const recordNextModern = document.querySelector("#recordNextModern");

if (recordNextModern) {
  recordNextModern.addEventListener("click", () => {
    setRecord(activeRecordIndex + 1);
  });
}


const recordPrevModern = document.querySelector("#recordPrevModern");

if (recordPrevModern) {
  recordPrevModern.addEventListener("click", () => {
    setRecord(activeRecordIndex - 1);
  });
}


/* =========================================================
   ENHANCEMENTS (scoped IIFE to avoid clashing with the
   carousel code above). Progress, reveal, spy, count-up,
   and live lab-table filtering.
   ========================================================= */
(function () {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Scroll progress + topbar elevation ---- */
  const progress = document.querySelector(".scroll-progress");
  const topbar = document.querySelector(".topbar");
  function onScroll() {
    const st = window.scrollY;
    const dh = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${dh > 0 ? st / dh : 0})`;
    if (topbar) topbar.classList.toggle("is-scrolled", st > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll("[data-reveal], [data-reveal-stagger]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---- Scroll-spy active nav ---- */
  const navLinks = Array.from(document.querySelectorAll('.topnav a[href^="#"]'));
  const spyTargets = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if (spyTargets.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          navLinks.forEach((a) => a.classList.remove("is-active"));
          const link = navLinks.find((a) => a.getAttribute("href") === "#" + e.target.id);
          if (link) link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    spyTargets.forEach((t) => spy.observe(t));
  }

  /* ---- Count-up for the status panel ---- */
  const counters = document.querySelectorAll(".status-grid strong");
  function countUp(el) {
    const raw = el.textContent.trim();
    const target = parseInt(raw, 10);
    if (isNaN(target)) return;            // skip "public"
    const pad = raw.length;               // preserve "07" style padding
    if (reduceMotion) return;
    const dur = 900;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased)).padStart(pad, "0");
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = raw;
    }
    requestAnimationFrame(step);
  }
  const panel = document.querySelector(".status-panel");
  if (panel && counters.length && "IntersectionObserver" in window && !reduceMotion) {
    const po = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { counters.forEach(countUp); obs.disconnect(); }
      });
    }, { threshold: 0.5 });
    po.observe(panel);
  }

  /* ---- Live lab-table filtering (the real command search) ---- */
  const search = document.querySelector("#labSearch");
  const chips = Array.from(document.querySelectorAll(".lab-chip"));
  const countEl = document.querySelector("#labCount");
  const emptyEl = document.querySelector("#labEmpty");
  const heroCmd = document.querySelector("#heroCommand");
  const rows = Array.from(document.querySelectorAll(".lab-row[data-kind]"));

  if (rows.length) {
    // cache searchable text + the highlightable cells (name = child 2, skills = child 5)
    const meta = rows.map((row) => {
      const cells = row.querySelectorAll(":scope > span");
      const name = cells[1] || null;
      const skills = cells[4] || null;
      return {
        row,
        kind: row.dataset.kind,
        text: row.textContent.toLowerCase(),
        cells: [name, skills].filter(Boolean),
        originals: [name, skills].filter(Boolean).map((c) => c.textContent),
      };
    });

    let activeKind = "all";
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    function highlight(m, q) {
      m.cells.forEach((cell, i) => {
        const orig = m.originals[i];
        if (!q) { cell.textContent = orig; return; }
        const re = new RegExp("(" + esc(q) + ")", "ig");
        if (re.test(orig)) {
          cell.innerHTML = orig.replace(re, '<mark class="hit">$1</mark>');
        } else {
          cell.textContent = orig;
        }
      });
    }

    function apply() {
      const q = (search ? search.value : "").trim().toLowerCase();
      let visible = 0;
      meta.forEach((m) => {
        const okKind = activeKind === "all" || m.kind === activeKind;
        const okText = !q || m.text.includes(q);
        const show = okKind && okText;
        m.row.classList.toggle("is-hidden", !show);
        if (show) visible++;
        highlight(m, okKind ? q : "");
      });

      if (countEl) countEl.textContent = `${visible} / ${meta.length} records`;
      if (emptyEl) emptyEl.classList.toggle("is-shown", visible === 0);

      if (heroCmd) {
        const kindWord = activeKind === "exp" ? "experiments" : activeKind === "note" ? "essays" : null;
        if (q && kindWord) heroCmd.textContent = `grep records --type ${kindWord} --match "${q}"`;
        else if (q) heroCmd.textContent = `grep records --match "${q}"`;
        else if (kindWord) heroCmd.textContent = `list records --type ${kindWord}`;
        else heroCmd.textContent = "list experiments --status published";
      }
    }

    if (search) search.addEventListener("input", apply);
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        activeKind = chip.dataset.kind;
        chips.forEach((c) => {
          const on = c === chip;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", String(on));
        });
        apply();
      });
    });

    apply(); // initialise count
  }
})();
