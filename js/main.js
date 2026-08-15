/* =========================================================
   Component Loader
========================================================= */
async function loadComponent(id, file) {
    const target = document.getElementById(id);
    if (!target) return;
    const res = await fetch(file);
    if (!res.ok) {
        console.error(file + " load failed");
        return;
    }
    target.innerHTML = await res.text();
}

/* =========================================================
   Component Path
========================================================= */
const componentPath = new URL("../components/", import.meta.url);

/* =========================================================
   Initialize
========================================================= */
window.addEventListener("DOMContentLoaded", async () => {
    await loadComponent("header", new URL("header.html", componentPath));
    await loadComponent("hero", new URL("hero.html", componentPath));

    const { initHero3D } = await import("./hero3d.js");
    initHero3D();

    await loadComponent("service", new URL("service.html", componentPath));

    // 서비스 섹션 3D 호출
    import("./hero3d.js").then(({ initSectionObject }) => {
        initSectionObject("experience-object", "U");
    });

    await loadComponent("portfolio", new URL("portfolio.html", componentPath));
    await loadComponent("about", new URL("about.html", componentPath));

    // 프로필 섹션 3D 추가
    import("./hero3d.js").then(({ initSectionObject }) => {
        initSectionObject("profile-object", "../assets/images/ne.svg");
    });

    await loadComponent("contact", new URL("contact.html", componentPath));
    await loadComponent("footer", new URL("footer.html", componentPath));
});

/* =========================================================
   Header Scroll & Mobile Menu
========================================================= */
window.addEventListener("scroll", () => {
    const header = document.querySelector("#header > header");
    const nav = document.querySelector("header nav");
    if (!header) return;
    window.scrollY > 30 ? header.classList.add("active") : header.classList.remove("active");
    if (nav) nav.classList.remove("open");
});

/* =========================================================
   3D 오브젝트 등장 모션 (Experience & Profile 공통)
========================================================= */
window.addEventListener('scroll', () => {
    ['experience-object', 'profile-object'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.7) {
            el.classList.add('is-visible');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    ['experience', 'about'].forEach(id => {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
    });
});
