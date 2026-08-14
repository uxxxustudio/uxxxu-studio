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

const componentPath = new URL(
    "../components/",
    import.meta.url
);


/* =========================================================
   Initialize
========================================================= */

window.addEventListener("DOMContentLoaded", async () => {

    await loadComponent(
        "header",
        new URL("header.html", componentPath)
    );

    await loadComponent(
        "hero",
        new URL("hero.html", componentPath)
    );

    /* Hero가 DOM에 들어온 뒤 3D 실행 */
    const { initHero3D } = await import("./hero3d.js");

    initHero3D();

    await loadComponent(
        "service",
        new URL("service.html", componentPath)
    );
   /* =========================================================
       [추가] Experience 섹션 로드 완료 후 3D 오브젝트 실행
    ========================================================= */
    import("./hero3d.js").then(({ initSectionObject }) => {
        initSectionObject("experience-object", "U"); // "U" 또는 원하는 글자 입력 가능
    });

    await loadComponent(
        "portfolio",
        new URL("portfolio.html", componentPath)
    );

    await loadComponent(
        "about",
        new URL("about.html", componentPath)
    );

    await loadComponent(
        "contact",
        new URL("contact.html", componentPath)
    );

    await loadComponent(
        "footer",
        new URL("footer.html", componentPath)
    );

});


/* =========================================================
   Header Scroll
========================================================= */

window.addEventListener("scroll", () => {

    const header =
        document.querySelector("#header > header");

    const nav =
        document.querySelector("header nav");

    if (!header) return;

    if (window.scrollY > 30) {

        header.classList.add("active");

    } else {

        header.classList.remove("active");

    }

    if (nav) {

        nav.classList.remove("open");

    }

});


/* =========================================================
   Mobile Menu
========================================================= */

window.addEventListener("click", (e) => {

    const button =
        document.querySelector(".menu-toggle");

    const nav =
        document.querySelector("header nav");

    if (!button || !nav) return;

    if (e.target.closest(".menu-toggle")) {

        nav.classList.toggle("open");

    }

});
