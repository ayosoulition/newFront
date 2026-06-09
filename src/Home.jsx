import { Link } from "react-router-dom";
import "./Home.css";
import Header from "./Header";

const DISPLAY_NAMES = {
  petitDejeuner: "Petit Déjeuner",
  boissons:      "Boissons",
  boulangerie:   "Boulangerie",
  glaces:        "Glaces",
};

const getDisplayName = (category) =>
  DISPLAY_NAMES[category] ??
  category.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export default function Home({ tableNumber, categories }) {
  return (
    <div className="home-page">
      <Header tableNumber={tableNumber} className="home-nav" />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="hero-content">
          <p className="hero-eyebrow">Bienvenue</p>
          <h1 className="hero-title">Notre Menu</h1>
          <div className="hero-rule" />
          {tableNumber && (
            <span className="hero-table-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 9h18" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Table {tableNumber}
            </span>
          )}
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────── */}
      <section className="home-categories">
        <p className="section-eyebrow">Choisissez une catégorie</p>
        <div className="categories-grid">
          {categories.map((cat) => (
            <Link key={cat} to={`/${cat}`} className="cat-link">
              <article
                className="cat-card"
                style={{ backgroundImage: `url(assets/${cat}.jpg)` }}
              >
                <div className="cat-overlay" />
                <div className="cat-info">
                  <h2 className="cat-title">{getDisplayName(cat)}</h2>
                  <span className="cat-cta">
                    Voir le menu
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
