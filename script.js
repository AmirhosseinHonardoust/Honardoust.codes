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
