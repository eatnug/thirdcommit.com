const REVEAL_THRESHOLD = 0.12;
const REVEAL_ROOT_MARGIN_PX = 0;

function initializeYearStamp() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

function initializeRevealOnScroll() {
  const revealables = document.querySelectorAll("[data-reveal]");
  if (revealables.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    {
      threshold: REVEAL_THRESHOLD,
      rootMargin: `${REVEAL_ROOT_MARGIN_PX}px 0px ${REVEAL_ROOT_MARGIN_PX}px 0px`,
    }
  );

  revealables.forEach((el) => observer.observe(el));
}

window.addEventListener("DOMContentLoaded", () => {
  initializeYearStamp();
  initializeRevealOnScroll();
});


