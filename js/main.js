/* =========================================================
   Component Loader
========================================================= */

async function loadComponent(id, file) {
    const target = document.getElementById(id);
    if (!target) return;

    const res = await fetch(file, { cache: "no-cache" });

    if (!res.ok) {
        console.error(file + " load failed");
        return;
    }

    target.innerHTML = await res.text();

    // service 섹션이 DOM에 로드되는 순간 3D 오브젝트 초기화 및 감지 시작
    if (id === "service") {
        initExperienceFeature();
    }

    // portfolio 섹션이 DOM에 로드되는 순간 Portfolio W 3D 오브젝트 및 호버 썸네일 초기화
    if (id === "portfolio") {
        initPortfolioFeature();
        initPortfolioHoverThumbnail();
    }

    // about 섹션이 DOM에 로드되는 순간 Profile 3D 캐릭터 초기화
    if (id === "about") {
        initProfileFeature();
        initAboutMotion();
        initAboutProfilePosition();
        initAboutCount();
    }
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


    /* =====================================================
       Mobile Menu
    ===================================================== */

    const menuToggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector("#header > header nav");
    const header = document.querySelector("#header > header");

    if (menuToggle && nav) {

        menuToggle.addEventListener("click", () => {
            nav.classList.toggle("open");
            const isOpen = nav.classList.contains("open");

            menuToggle.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

            /* 메뉴가 열리면 헤더도 반투명 상태 */
            if (header) {
                if (isOpen) {
                    header.classList.add("active");
                } else if (window.scrollY <= 30) {
                    header.classList.remove("active");
                }
            }
        });


        /* 모바일 메뉴 클릭 시 자동으로 닫기 */
        nav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                nav.classList.remove("open");
                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

                /* 최상단에서는 메뉴를 닫으면 헤더도 원래 상태로 복귀 */
                if (header && window.scrollY <= 30) {
                    header.classList.remove("active");
                }
            });
        });
    }


    await loadComponent(
        "hero",
        new URL("hero.html", componentPath)
    );


    /* Hero가 DOM에 들어온 뒤 3D 실행 */
    try {
        const { initHero3D } = await import("./hero3d.js");
        if (typeof initHero3D === "function") {
            initHero3D();
        }
    } catch (e) {
        console.error("Hero 3D 로딩 실패:", e);
    }


    await loadComponent(
        "service",
        new URL("service.html", componentPath)
    );


    await loadComponent(
        "portfolio",
        new URL("portfolio.html", componentPath)
    );


    await loadComponent(
        "about",
        new URL("about.html", componentPath)
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

    const header = document.querySelector("#header > header");
    const nav = document.querySelector("#header > header nav");

    if (!header) return;

    if (window.scrollY > 30) {
        header.classList.add("active");
    } else {
        header.classList.remove("active");
    }

    /* 스크롤하면 모바일 메뉴 닫기 */
    if (nav) {
        nav.classList.remove("open");
        const menuToggle = document.querySelector(".menu-toggle");
        if (menuToggle) {
            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    }

});


/* =========================================================
   Experience 섹션 3D 오브젝트 초기화 및 스크롤 등장 감지
========================================================= */

async function initExperienceFeature() {

    try {
        // 1. 데스크톱 & 모바일 3D 오브젝트 생성 함수 호출
        const { initSectionObject } = await import("./hero3d.js");

        // 데스크톱 3D 호출
        const desktopObject = document.getElementById("experience-object");
        if (desktopObject) {
            initSectionObject("experience-object", "U");
        }

        // 모바일 3D 호출
        const mobileObject = document.getElementById("experience-object-mobile");
        if (mobileObject) {
            initSectionObject("experience-object-mobile", "U");
        }

        // 2. 관찰 대상 섹션 탐색 (experience 또는 service 컨테이너)
        const experienceSection = document.getElementById("experience") || document.getElementById("service");

        // 섹션 대상이 아예 없으면 안전하게 종료
        if (!experienceSection) return;

        const observer = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (desktopObject) {
                            desktopObject.classList.add("is-visible");
                        }
                        if (mobileObject) {
                            mobileObject.classList.add("is-visible");
                        }
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1
            }
        );

        observer.observe(experienceSection);

    } catch (error) {
        console.error(
            "Experience 3D object initialization failed:",
            error
        );
    }

}


/* =========================================================
   Portfolio 섹션 3D 오브젝트 ("W") 초기화
========================================================= */

async function initPortfolioFeature() {

    try {
        const { initPortfolio3D } = await import("./hero3d.js");
        if (document.getElementById("portfolio-object")) {
            initPortfolio3D("portfolio-object", { solidFace: 0.7 }); // 프로젝트 목록 페이지 W와 같은 흰색 면 불투명도
        }
    } catch (error) {
        console.error(
            "Portfolio 3D object initialization failed:",
            error
        );
    }

}


/* =========================================================
   Profile 섹션 3D 캐릭터 초기화
========================================================= */

async function initProfileFeature() {

    try {
        const { initProfile3D } = await import("./hero3d.js");
        if (document.getElementById("profile-object")) {
            initProfile3D("profile-object");
        }
    } catch (error) {
        console.error(
            "Profile 3D object initialization failed:",
            error
        );
    }

}


/* =========================================================
   Portfolio Hover Thumbnail
========================================================= */

function initPortfolioHoverThumbnail() {

    const portfolio = document.getElementById("portfolio");
    if (!portfolio) return;

    const grid = portfolio.querySelector(".portfolio-grid");
    if (!grid) return;

    const projects = portfolio.querySelectorAll(".project");
    if (!projects.length) return;

    /* 기존 preview가 있으면 중복 생성하지 않음 */
    let preview = grid.querySelector(".portfolio-preview");

    if (!preview) {
        preview = document.createElement("div");
        preview.className = "portfolio-preview";
        preview.setAttribute("aria-hidden", "true");

        const image = document.createElement("img");
        image.id = "portfolio-preview-image";
        image.alt = "";

        preview.appendChild(image);
        grid.appendChild(preview);
    }

    const image = preview.querySelector("#portfolio-preview-image");

    /* 모바일용: 마우스오버가 없으니 각 줄에 작은 썸네일을 항상 표시 (PC에서는 CSS로 숨김) */
    projects.forEach((project) => {
        const thumb = project.dataset.thumb;
        if (!thumb || project.querySelector(".project-thumb")) return;
        const img = document.createElement("img");
        img.className = "project-thumb";
        img.src = thumb;
        img.alt = "";
        img.loading = "lazy";
        img.setAttribute("aria-hidden", "true");
        project.appendChild(img);
    });

    /* 모바일: 화면 가운데 띠를 지나는 줄만 썸네일을 열어 PC 호버 느낌을 스크롤로 대신함 */
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion && "IntersectionObserver" in window) {
        const centerObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle("is-active", entry.isIntersecting);
            });
        }, { rootMargin: "-45% 0px -45% 0px" });

        const syncScrollThumb = () => {
            if (mobileQuery.matches) {
                grid.classList.add("is-scroll-thumb");
                projects.forEach((project) => centerObserver.observe(project));
            } else {
                grid.classList.remove("is-scroll-thumb");
                projects.forEach((project) => {
                    centerObserver.unobserve(project);
                    project.classList.remove("is-active");
                });
            }
        };

        syncScrollThumb();
        mobileQuery.addEventListener("change", syncScrollThumb);
    }

    projects.forEach((project) => {

        project.addEventListener("mouseenter", () => {
            const thumb = project.dataset.thumb;
            if (!thumb) return;

            image.src = thumb;

            const projectRect = project.getBoundingClientRect();
            const gridRect = grid.getBoundingClientRect();

            preview.style.left = (projectRect.left - gridRect.left + Math.min(projectRect.width, 1120) - 300) + "px";
            preview.style.top = (projectRect.top - gridRect.top + 30) + "px";

            preview.classList.add("is-visible");
        });

        project.addEventListener("mouseleave", () => {
            preview.classList.remove("is-visible");
        });

    });

}


/* =========================================================
   About 섹션 등장 모션 (헤드라인 순차 등장 + 타임라인 점 이동)
========================================================= */

function initAboutMotion() {

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const targets = document.querySelectorAll("#about .about-copy, #about .about-profile, #about .about-timeline");
    if (!targets.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-in");
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    targets.forEach(target => {
        target.classList.add("about-motion");
        observer.observe(target);
    });

}


/* =========================================================
   About 프로필 동전 위치: 제목 첫 줄 "Experience shapes"의 실제 글자 폭 기준
   (글자 오른쪽 끝에서 OVERLAP px 만큼 동전이 안쪽으로 걸침)
========================================================= */

function initAboutProfilePosition() {

    const wrapper = document.querySelector("#about .about-headline");
    const heading = wrapper && wrapper.querySelector("h2");
    const profile = document.getElementById("profile-object");
    if (!wrapper || !heading || !profile) return;

    const textNode = Array.from(heading.childNodes).find(
        node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );
    if (!textNode) return;

    const place = () => {
        const range = document.createRange();
        range.selectNodeContents(textNode);
        const text = range.getBoundingClientRect();
        const box = wrapper.getBoundingClientRect();
        if (!text.width) return;
        /* 동전 원판 반지름(데스크톱 약 100px)을 기준으로, 글자 끝에서 OVERLAP px 만큼 안쪽으로 걸치게 배치
           → 겹침 정도를 바꾸려면 OVERLAP 숫자만 조절 (클수록 shapes 글자를 더 덮음)
           동전 크기가 줄어드는 화면에서는 같은 비율로 줄어듦 */
        const OVERLAP = 35;
        const scale = profile.offsetWidth / 300;
        const discRadius = profile.offsetWidth * 0.33;
        let center = text.right - box.left + discRadius - OVERLAP * scale;

        /* 좁은 화면: 동전이 화면 오른쪽 밖으로 나가지 않도록 8px 여백을 두고 멈춤 */
        const maxCenter = document.documentElement.clientWidth - 8 - discRadius - box.left;
        center = Math.min(center, maxCenter);

        profile.style.left = center + "px";
    };

    place();
    window.addEventListener("resize", place);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(place);
    }

}


/* =========================================================
   About 모바일: 이메일 주소 복사 (메일 앱 대신 클립보드 복사, 아이콘이 잠깐 체크로 바뀜)
========================================================= */
document.addEventListener("click", (e) => {
    const button = e.target.closest(".about-email-copy");
    if (!button) return;

    const email = button.dataset.email;
    const done = () => {
        button.classList.add("is-copied");
        button.setAttribute("aria-label", "이메일 주소가 복사되었습니다");
        clearTimeout(button._copyTimer);
        button._copyTimer = setTimeout(() => {
            button.classList.remove("is-copied");
            button.setAttribute("aria-label", "이메일 주소 복사");
        }, 1600);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(done).catch(() => { if (fallbackCopy(email)) done(); });
    } else if (fallbackCopy(email)) {
        done();
    }
});

function fallbackCopy(text) {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(field);
    return ok;
}


/* =========================================================
   About PC: "20+ years of ___" 분야 단어 교체
   글자 하나하나가 제각각 오른쪽/왼쪽으로 뒤집히며 다음 단어 글자로 바뀜
   (방향·시작 시점은 글자마다 무작위, 마지막 단어는 AI-assisted design)
========================================================= */

function initAboutCount() {

    /* PC는 about-years-pc, 모바일은 about-years-mo 안의 단어 중 화면에 보이는 쪽만 움직임 */
    const word = [...document.querySelectorAll("#about .about-rotate")].find(el => el.getClientRects().length > 0);
    if (!word) return;
    const box = word.parentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window) || !Element.prototype.animate) return;

    const words = (word.dataset.words || "").split("|").filter(Boolean);
    if (words.length < 2) return;

    const ch = (c) => (c === undefined || c === " ") ? "\u00a0" : c;
    let i = 0, current = words[0], busy = false;
    word.setAttribute("aria-label", current);

    const flipTo = (next) => {
        busy = true;
        const n = Math.max(current.length, next.length);
        word.setAttribute("aria-label", next);
        word.textContent = "";

        const spans = [];
        for (let k = 0; k < n; k++) {
            const s = document.createElement("span");
            s.className = "about-flip";
            s.setAttribute("aria-hidden", "true");
            s.textContent = ch(current[k]);
            word.appendChild(s);
            spans.push(s);
        }

        let done = 0;
        const finish = () => {
            if (++done < n) return;
            word.textContent = next;
            current = next;
            busy = false;
        };

        spans.forEach((s, k) => {
            const to = ch(next[k]);
            if (s.textContent === to) { finish(); return; }
            const dir = Math.random() < .5 ? 1 : -1;
            const delay = Math.random() * 250;
            s.animate(
                [{ transform: "rotateY(0deg)" }, { transform: `rotateY(${90 * dir}deg)` }],
                { duration: 200, delay, easing: "ease-in", fill: "forwards" }
            ).onfinish = () => {
                s.textContent = to;
                s.animate(
                    [{ transform: `rotateY(${-90 * dir}deg)` }, { transform: "rotateY(0deg)" }],
                    { duration: 240, easing: "ease-out", fill: "forwards" }
                ).onfinish = finish;
            };
        });
    };

    const io = new IntersectionObserver((entries, obs) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        setInterval(() => {
            if (busy) return;
            i = (i + 1) % words.length;
            flipTo(words[i]);
        }, 2600);
    }, { threshold: 0.4 });

    io.observe(box);
}
