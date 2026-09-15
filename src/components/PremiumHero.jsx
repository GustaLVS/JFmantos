import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { HERO_SHIRTS, SHIELD_LOGO } from "../assets.js";

const benefits = [
  {
    label: "Produtos de qualidade",
    icon: <path d="M12 3 5 6v5c0 4.4 2.9 8.4 7 10 4.1-1.6 7-5.6 7-10V6l-7-3Z" />,
  },
  {
    label: "Compra 100% segura",
    icon: <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />,
  },
  {
    label: "Envios para todo Brasil",
    icon: <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
  },
  {
    label: "Atendimento especializado",
    icon: <path d="M4 13a8 8 0 0 1 16 0M4 13v4h4v-5H4ZM20 13v4h-4v-5h4ZM16 19c-.8 1.2-2.1 2-4 2" />,
  },
];

function HeroIcon({ children }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

export default function PremiumHero() {
  const slides = HERO_SHIRTS;
  const [active, setActive] = useState(0);

  const next = () => setActive((value) => (value + 1) % slides.length);
  const previous = () => setActive((value) => (value - 1 + slides.length) % slides.length);

  return (
    <section className="hero premium-hero" aria-label="JFMANTOS hero premium">
      <button className="hero-arrow hero-arrow-left" type="button" aria-label="Slide anterior" onClick={previous}>
        <span></span>
      </button>
      <button className="hero-arrow hero-arrow-right" type="button" aria-label="Proximo slide" onClick={next}>
        <span></span>
      </button>

      <motion.div
        className="premium-hero-copy"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="premium-brand-lockup">
          <img src={SHIELD_LOGO} alt="Escudo JFMANTOS" />
          <span></span>
          <div>
            <h1>JFMANTOS</h1>
            <p>Veste a sua paixão!</p>
          </div>
        </div>

        <div className="hero-benefit-row" aria-label="Beneficios da loja">
          {benefits.map((benefit) => (
            <div className="hero-benefit-item" key={benefit.label}>
              <HeroIcon>{benefit.icon}</HeroIcon>
              <span>{benefit.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="premium-shirts-stage">
        <AnimatePresence mode="wait">
          <motion.div
            className="premium-shirts-group"
            key={active}
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -36, scale: 0.97 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <motion.figure
              className="premium-shirt premium-shirt-photo"
              whileHover={{ y: -12, rotateY: 4, scale: 1.025 }}
              transition={{ type: "spring", stiffness: 190, damping: 18 }}
            >
              <img src={slides[active]} alt={active === 0 ? "Camisas brasileiras JFMANTOS" : "Camisas europeias JFMANTOS"} />
            </motion.figure>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="hero-dots" aria-label="Indicadores do slider">
        {slides.map((_, index) => (
          <button
            className={active === index ? "active" : ""}
            type="button"
            aria-label={`Ir para slide ${index + 1}`}
            key={index}
            onClick={() => setActive(index)}
          ></button>
        ))}
      </div>
    </section>
  );
}
