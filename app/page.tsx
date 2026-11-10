"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Blob from "./blob";

type Lang = "en" | "ru";

const content = {
  en: {
    home: "Intro", work: "Experience", about: "About", contact: "Contact", cv: "Download CV", message: "Message on Telegram",
    first: "Nikita", last: "Zakharenko", role: "Golang Software Engineer",
    intro: "4+ years building backend services in Go. At Wildberries, I develop high-load systems for e-commerce and logistics, with a focus on ClickHouse analytics and PostgreSQL performance.",
    introDetail: "I own the full cycle: architecture, APIs, releases and production support. Previously built city-wide alerting systems and founded a subscription VPN service.", current: "Currently at Wildberries", location: "Belgrade, Serbia · Remote", hint: "Scroll, swipe or press ← →",
    experience: "Experience", more: "Details", less: "Less",
    jobs: [
      { name: "Wildberries", date: "2024 – Present", role: "Golang Software Engineer", summary: "Design and delivery of high-load services for e-commerce and supply-chain operations. Full release cycle and production support across 7 projects.", details: ["ClickHouse analytics: 10B+ rows, ~1 TB, API response ≤300 ms.", "Optimized a 350 GB PostgreSQL table with recurring deadlocks.", "Designed and built 2 high-load services from scratch, including complex business logic.", "REST and gRPC APIs, RBAC and WebSocket notifications for an employee support platform.", "Rolled out Jaeger and Pyroscope; built Grafana dashboards and CSAT, RSA and SLA metrics.", "PostgreSQL-to-ClickHouse migrations. Integrated a proprietary LLM into an employee support chat.", "24/7 incident response, code reviews, unit and integration tests. Worked directly with product owners and C-level stakeholders."], stack: "Go · PostgreSQL · ClickHouse · Kafka · gRPC" },
      { name: "NorkinVPN", date: "2024 – 2025", role: "Founder & Backend Engineer", summary: "Founded a subscription VPN service and grew it to ~200 paying customers. Managed 3 servers handling ~4.5 TB of daily traffic.", details: ["~200 paying customers. 3 servers. ~4.5 TB of traffic per day.", "Owned engineering, infrastructure, subscription payments, customer support and legal matters.", "Built the service on VLESS and 3x-ui; managed the product from first commit to day-to-day operations."], stack: "VLESS · 3x-ui · Infrastructure" },
      { name: "Safe Region", date: "2022 – 2024", role: "Backend Developer", summary: "Developed the core alerting stack for city-wide notification systems: synchronous alerts, SIP terminal grouping and a modular VoIP integration layer.", details: ["Built core alerting services with Go and Node.js.", "SIP terminal grouping and emergency notifications.", "Configured test and production environments. Wrote unit and e2e tests and introduced TDD on a project with no QA."], stack: "Go · Node.js · PostgreSQL · MongoDB" },
    ],
    aboutText: "Go engineer focused on backend services, database performance and observability.",
    stack: "Stack", education: "Education", spoken: "Languages",
    langs: [["Russian", "native"], ["English", "B1+"], ["German", "B2"]],
    edu: [
      ["Russian University of Transport", "BSc, Computer Science", "2022–2026"],
      ["School 21", "Software Development, Go", "2022–2024"],
      ["Russian University of Transport", "AI & Machine Learning, retraining", "2024–2025"],
    ],
    talk: "Get in touch.", telegram: "Telegram", motion: "Motion", on: "on", off: "off", skip: "Skip to content",
    nav: "Navigation", deck: "Portfolio screens. Use the left and right arrow keys to move between them.", screens: "Screens", prev: "Previous screen", next: "Next screen", language: "Language",
    title: "Nikita Zakharenko | Golang Software Engineer",
  },
  ru: {
    home: "Главная", work: "Опыт", about: "Обо мне", contact: "Контакты", cv: "Скачать CV", message: "Написать в Telegram",
    first: "Никита", last: "Захаренко", role: "Golang Software Engineer",
    intro: "4+ года разрабатываю бэкенд на Go. В Wildberries создаю высоконагруженные сервисы для e-commerce и логистики, работаю с аналитикой ClickHouse и производительностью PostgreSQL.",
    introDetail: "Отвечаю за полный цикл: архитектуру, API, релизы и поддержку в продакшене. Ранее разрабатывал городские системы оповещения и запустил VPN-сервис по подписке.", current: "Сейчас в Wildberries", location: "Белград, Сербия · Удалённо", hint: "Колесо, свайп или клавиши ← →",
    experience: "Опыт", more: "Подробнее", less: "Свернуть",
    jobs: [
      { name: "Wildberries", date: "2024 – Сейчас", role: "Golang Software Engineer", summary: "Архитектура и разработка высоконагруженных сервисов для e-commerce и логистики. Полный цикл релизов и поддержка 7 проектов.", details: ["Аналитика ClickHouse: 10+ млрд строк, ~1 ТБ, ответ API ≤300 мс.", "Оптимизация таблицы PostgreSQL на 350 ГБ с повторяющимися deadlock.", "Спроектировал и разработал с нуля 2 высоконагруженных сервиса со сложной бизнес-логикой.", "REST и gRPC API, RBAC и WebSocket-уведомления для платформы поддержки сотрудников.", "Внедрил Jaeger и Pyroscope, создал Grafana-дашборды и метрики CSAT, RSA и SLA.", "Миграции PostgreSQL → ClickHouse. Интеграция корпоративной LLM в чат поддержки.", "Реагирование на инциденты 24/7, код-ревью, unit- и интеграционные тесты. Прямая работа с владельцами продуктов и C-level."], stack: "Go · PostgreSQL · ClickHouse · Kafka · gRPC" },
      { name: "NorkinVPN", date: "2024 – 2025", role: "Founder & Backend Engineer", summary: "Создал VPN-сервис по подписке и довёл его до ~200 платящих клиентов. Управлял 3 серверами с ~4,5 ТБ трафика в день.", details: ["~200 платящих клиентов. 3 сервера. ~4,5 ТБ трафика в день.", "Отвечал за разработку, инфраструктуру, платежи, поддержку клиентов и юридические вопросы.", "Сервис на VLESS и 3x-ui: от первого коммита до ежедневной эксплуатации."], stack: "VLESS · 3x-ui · Инфраструктура" },
      { name: "Safe Region", date: "2022 – 2024", role: "Backend Developer", summary: "Разрабатывал ядро городского сервиса оповещений: синхронные уведомления, группировку SIP-терминалов и модульную VoIP-интеграцию.", details: ["Ядро сервисов оповещения на Go и Node.js.", "Группировка SIP-терминалов и экстренные оповещения.", "Настройка тестовых и production-окружений, unit- и e2e-тесты. Внедрение TDD на проекте без QA."], stack: "Go · Node.js · PostgreSQL · MongoDB" },
    ],
    aboutText: "Разрабатываю бэкенд на Go. Работаю с производительностью баз данных и наблюдаемостью сервисов.",
    stack: "Стек", education: "Образование", spoken: "Языки",
    langs: [["Русский", "родной"], ["Английский", "B1+"], ["Немецкий", "B2"]],
    edu: [
      ["Российский университет транспорта", "Бакалавриат, информатика и вычислительная техника", "2022–2026"],
      ["Школа 21", "Разработка ПО, Go", "2022–2024"],
      ["РУТ (МИИТ)", "ИИ и машинное обучение, профпереподготовка", "2024–2025"],
    ],
    talk: "На связи.", telegram: "Telegram", motion: "Анимация", on: "вкл", off: "выкл", skip: "К содержимому",
    nav: "Навигация", deck: "Экраны резюме. Переключайте их стрелками влево и вправо.", screens: "Экраны", prev: "Предыдущий экран", next: "Следующий экран", language: "Язык",
    title: "Никита Захаренко | Golang Software Engineer",
  },
};
const tools = ["Go", "PostgreSQL", "ClickHouse", "Kafka", "Redis", "gRPC", "Docker", "Kubernetes", "GitLab CI", "Grafana", "Jaeger", "Prometheus"];
const sections = ["top", "experience", "about", "contact"];
const LAST = sections.length - 1;
const TELEGRAM = "https://t.me/zakharenkoNikita";
const CV = "/Nikita-Zakharenko-CV.pdf";
const LANG_KEY = "nz-lang";

const clamp = (index: number) => Math.max(0, Math.min(LAST, index));
const external = { target: "_blank", rel: "noopener noreferrer" };

const Icon = ({ d }: { d: string }) => (
  <svg className="icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d={d} /></svg>
);
const ArrowOut = () => <Icon d="M4.5 11.5l7-7M5.5 4.5h6v6" />;
const ArrowDown = () => <Icon d="M8 2.5v10M3.5 8.5L8 13l4.5-4.5" />;
const ArrowLeft = () => <Icon d="M13.5 8h-11M7 3.5L2.5 8 7 12.5" />;
const ArrowRight = () => <Icon d="M2.5 8h11M9 3.5L13.5 8 9 12.5" />;

const setHash = (index: number) => {
  // Sandboxed previews may refuse history changes; the page works without them.
  try { window.history.replaceState(null, "", `#${sections[index]}`); } catch { /* ignore */ }
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [moving, setMoving] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const target = useRef(0);    // screen we are on, or heading to
  const seeking = useRef(0);   // time until which scroll events belong to navigate()
  const motion = useRef(false);
  const c = content[lang];

  const navigate = useCallback((index: number) => {
    const el = deck.current;
    if (!el) return;
    const next = clamp(index);
    target.current = next;
    seeking.current = performance.now() + 1200;
    setActive(next); // the 3D model and the menu react at once, not after the scroll settles
    el.scrollTo({ left: next * el.clientWidth, behavior: motion.current ? "smooth" : "instant" });
    setHash(next);
  }, []);

  const chooseLang = (next: Lang) => {
    setLang(next);
    try { window.localStorage.setItem(LANG_KEY, next); } catch { /* private mode */ }
  };

  useEffect(() => { motion.current = moving; document.documentElement.dataset.motion = moving ? "on" : "off"; }, [moving]);
  useEffect(() => { document.documentElement.lang = lang; document.title = content[lang].title; }, [lang]);

  useEffect(() => {
    const el = deck.current, main = root.current;
    if (!el || !main) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => setMoving(!media.matches);

    const jumpToHash = () => {
      const index = sections.indexOf(window.location.hash.slice(1));
      if (index < 0) return;
      target.current = index; setActive(index);
      el.scrollTo({ left: index * el.clientWidth, behavior: "instant" });
    };

    // Client-only preferences are applied after hydration to keep server and client markup identical.
    const boot = requestAnimationFrame(() => {
      applyMotion();
      let saved: string | null = null;
      try { saved = window.localStorage.getItem(LANG_KEY); } catch { /* private mode */ }
      if (saved === "ru" || saved === "en") setLang(saved);
      else if (navigator.language?.toLowerCase().startsWith("ru")) setLang("ru");
      jumpToHash();
    });

    const sync = () => {
      const position = el.scrollLeft / Math.max(el.clientWidth, 1), nearest = clamp(Math.round(position));
      if (performance.now() < seeking.current) {
        if (Math.abs(position - target.current) < 0.02) seeking.current = 0;
        return;
      }
      // Manual swipe: commit once the next screen clearly owns the viewport.
      if (nearest !== target.current && Math.abs(position - nearest) < 0.35) {
        target.current = nearest; setActive(nearest); setHash(nearest);
      }
    };

    // A vertical wheel turns screens; long screens keep their own vertical scroll first.
    let accumulated = 0, lastWheel = 0, lockedUntil = 0, innerScroll = 0;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const panel = (event.target as Element).closest<HTMLElement>(".panel");
      const dy = event.deltaY, now = performance.now();
      if (panel && ((dy > 0 && panel.scrollTop + panel.clientHeight < panel.scrollHeight - 2) || (dy < 0 && panel.scrollTop > 2))) {
        innerScroll = now;
        return;
      }
      event.preventDefault();
      // The same gesture that just reached the end of a long screen must not also turn the page.
      if (now - innerScroll < 220) { innerScroll = now; return; }
      if (now < lockedUntil) return;
      if (now - lastWheel > 180) accumulated = 0;
      lastWheel = now;
      accumulated += dy * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientHeight : 1);
      if (Math.abs(accumulated) < 35) return;
      const next = clamp(target.current + Math.sign(accumulated));
      accumulated = 0;
      if (next !== target.current) { navigate(next); lockedUntil = now + (motion.current ? 850 : 250); }
    };

    // Arrow keys work from anywhere on the page, not only while the deck has focus.
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof Element && event.target.closest("input,textarea,select,[contenteditable]")) return;
      const next = event.key === "ArrowRight" ? target.current + 1 : event.key === "ArrowLeft" ? target.current - 1 : event.key === "Home" ? 0 : event.key === "End" ? LAST : null;
      if (next === null) return;
      event.preventDefault();
      navigate(next);
    };

    const resize = () => el.scrollTo({ left: target.current * el.clientWidth, behavior: "instant" });

    media.addEventListener("change", applyMotion);
    el.addEventListener("scroll", sync, { passive: true });
    main.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", keydown);
    window.addEventListener("hashchange", jumpToHash);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(boot);
      media.removeEventListener("change", applyMotion);
      el.removeEventListener("scroll", sync);
      main.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("hashchange", jumpToHash);
      window.removeEventListener("resize", resize);
    };
  }, [navigate]);

  const labels = [c.home, c.work, c.about, c.contact];
  const go = (index: number) => (event: { preventDefault(): void }) => { event.preventDefault(); navigate(index); };

  return (
    <main className="portfolio" data-slide={active} ref={root}>
      <a href="#experience" className="skip" onClick={event => { event.preventDefault(); navigate(1); document.getElementById("experience-title")?.focus({ preventScroll: true }); }}>{c.skip}</a>

      <header className="header wrap">
        <a className="brand" href="#top" onClick={go(0)} aria-label={`${c.first} ${c.last}`}>nz<span>.</span></a>
        <nav aria-label={c.nav}>
          {[1, 2, 3].map(i => (
            <a key={sections[i]} href={`#${sections[i]}`} aria-current={active === i ? "true" : undefined} onClick={go(i)}>{labels[i]}</a>
          ))}
        </nav>
        <div className="language" role="group" aria-label={c.language}>
          {(["en", "ru"] as const).map(code => (
            <button key={code} type="button" lang={code} aria-pressed={lang === code} aria-label={code === "en" ? "English" : "Русский"} onClick={() => chooseLang(code)}>{code.toUpperCase()}</button>
          ))}
        </div>
      </header>

      <div className="scene"><Blob moving={moving} slide={active} /><div className="blob-shadow" /></div>

      <div className="deck" ref={deck} tabIndex={0} role="region" aria-label={c.deck}>
        <section className="panel" id="top" aria-labelledby="name">
          <div className="panel-inner hero">
            <p className="eyebrow">{c.role}</p>
            <h1 id="name">{c.first}<br /><span>{c.last}<span className="name-dot">.</span></span></h1>
            <p className="hero-intro">{c.intro}</p>
            <p className="hero-detail">{c.introDetail}</p>
            <div className="hero-actions">
              <a href={TELEGRAM} className="button" {...external}>{c.message}<ArrowOut /></a>
              <a href={CV} download className="text-link">{c.cv}<ArrowDown /></a>
            </div>
            <ul className="meta">
              <li className="status"><i aria-hidden="true" />{c.current}</li>
              <li>{c.location}</li>
            </ul>
          </div>
        </section>

        <section className="panel" id="experience" aria-labelledby="experience-title">
          <div className="panel-inner content-panel">
            <h2 id="experience-title" tabIndex={-1}>{c.experience}</h2>
            <div className="jobs">
              {c.jobs.map((job, i) => (
                <article key={job.name} className="job">
                  <div className="job-title">
                    <h3>{job.name}{i === 0 && <i className="current-dot" aria-hidden="true" />}</h3>
                    <span className="job-date">{job.date}</span>
                  </div>
                  <p className="job-role">{job.role}</p>
                  <p className="job-summary">{job.summary}</p>
                  <details>
                    <summary><span className="closed-label">{c.more}</span><span className="open-label">{c.less}</span><span className="plus" aria-hidden="true" /></summary>
                    <ul>{job.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
                    <p className="job-stack">{job.stack}</p>
                  </details>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="panel" id="about" aria-labelledby="about-title">
          <div className="panel-inner content-panel">
            <h2 id="about-title">{c.about}</h2>
            <p className="about-text">{c.aboutText}</p>
            <div className="about-grid">
              <div className="about-block">
                <h3 className="label">{c.stack}</h3>
                <ul className="tech-list">{tools.map(tool => <li className={tool === "Go" ? "go" : undefined} key={tool}>{tool}</li>)}</ul>
              </div>
              <div className="about-block">
                <h3 className="label">{c.spoken}</h3>
                <ul className="spoken">{c.langs.map(([name, level]) => <li key={name}>{name}<span>{level}</span></li>)}</ul>
              </div>
              <div className="about-block education">
                <h3 className="label">{c.education}</h3>
                {c.edu.map(([name, degree, year]) => (
                  <div className="edu-row" key={degree}><h4>{name}</h4><span className="edu-year">{year}</span><p>{degree}</p></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="panel" id="contact" aria-labelledby="contact-title">
          <div className="panel-inner contact-panel">
            <h2 id="contact-title">{c.talk}</h2>
            <a className="contact-primary" href={TELEGRAM} {...external}>{c.telegram}<ArrowOut /></a>
            <div className="contact-links">
              <a className="text-link" href="https://www.linkedin.com/in/zakharenkolink" {...external}>LinkedIn<ArrowOut /></a>
              <a className="text-link" href="https://wa.me/79301202280" {...external}>WhatsApp<ArrowOut /></a>
              <a className="text-link" href={CV} download>{c.cv}<ArrowDown /></a>
            </div>
            <p className="location">{c.location}</p>
          </div>
        </section>
      </div>

      <footer className="slide-footer wrap">
        <button type="button" className="motion" aria-label={c.motion} aria-pressed={moving} onClick={() => setMoving(!moving)}>
          <span className="motion-dot" aria-hidden="true" />{c.motion}<span className="motion-state">{moving ? c.on : c.off}</span>
        </button>
        <p className="hint" aria-hidden={active !== 0}>{c.hint}</p>
        <div className="slide-controls">
          <span className="counter" aria-hidden="true">{`0${active + 1}`}<span> / 0{sections.length}</span></span>
          <div className="progress" role="group" aria-label={c.screens}>
            {sections.map((id, i) => (
              <button key={id} type="button" aria-label={labels[i]} aria-current={active === i ? "true" : undefined} onClick={() => navigate(i)}><i /></button>
            ))}
          </div>
          <button type="button" className="arrow-button" disabled={active === 0} onClick={() => navigate(target.current - 1)} aria-label={c.prev}><ArrowLeft /></button>
          <button type="button" className="arrow-button" disabled={active === LAST} onClick={() => navigate(target.current + 1)} aria-label={c.next}><ArrowRight /></button>
        </div>
      </footer>
    </main>
  );
}
