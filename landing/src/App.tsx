import { useEffect, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatedSection } from "./components/AnimatedSection";
import { TextReveal } from "./components/TextReveal";
import { FAQ } from "./components/FAQ";

const HeroBlob = lazy(() => import("./components/HeroBlob").then(m => ({ default: m.HeroBlob })));

gsap.registerPlugin(ScrollTrigger);

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function App() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 2 });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => { lenis.destroy(); gsap.ticker.remove(raf); };
  }, []);

  return (
    <>
      {/* ─── Navbar ─── */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-logo">
            <span className="gradient-text">Post</span>X
          </div>
          <div className="navbar-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="#waitlist" className="btn btn-outline" style={{ padding: "0.55rem 1.4rem", fontSize: "0.88rem", borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}>
              Entrar na waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="hero">
        {/* 3D layer — full-screen behind text */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Suspense fallback={null}>
            <HeroBlob />
          </Suspense>

          {/* CSS glow behind blob — subtle, not overwhelming */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500, height: 500,
            background: "radial-gradient(circle, rgba(109,40,217,0.18) 0%, rgba(79,70,229,0.06) 40%, transparent 70%)",
            borderRadius: "50%", pointerEvents: "none", filter: "blur(80px)",
          }} />

          {/* Subtle ambient mesh — barely visible */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: `
              radial-gradient(at 75% 30%, rgba(99,102,241,0.06) 0px, transparent 50%),
              radial-gradient(at 30% 70%, rgba(6,182,212,0.04) 0px, transparent 50%)
            `,
          }} />
        </div>

        {/* Text layer — centered */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            position: "relative", zIndex: 1,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", textAlign: "center",
            padding: "0 1.5rem", gap: "1.2rem",
          }}
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#7c3aed", boxShadow: "0 0 10px #7c3aed",
              display: "inline-block",
            }} />
            Sem API do X. Sem limites.
          </motion.div>

          <TextReveal
            text="Cresça no X com inteligência artificial"
            className="hero-title"
            delay={0.5}
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7 }}
            style={{
              fontSize: "1.15rem", color: "var(--text-dim)",
              maxWidth: 520, fontWeight: 300, lineHeight: 1.7,
            }}
          >
            Analise seus mentores, gere posts autênticos com IA, agende e
            publique automaticamente. Tudo em português, sem API paga.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}
          >
            <a href="#waitlist" className="btn btn-primary">Começar grátis</a>
            <a href="#features" className="btn btn-outline">Ver como funciona</a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9 }}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "center" }}
          >
            <div className="hero-avatars">
              {["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e"].map((c, i) => (
                <span key={i} style={{ background: c }}>{["V", "L", "A", "M"][i]}</span>
              ))}
            </div>
            <span className="text-dim" style={{ fontSize: "0.88rem" }}>+200 criadores na waitlist</span>
          </motion.div>
        </motion.div>

        {/* Bottom gradient fade into next section */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
          background: "linear-gradient(transparent, var(--bg))",
          pointerEvents: "none", zIndex: 2,
        }} />
      </section>

      {/* ─── Problems ─── */}
      <section className="problems">
        <div className="container">
          <AnimatedSection>
            <p className="text-dim mono" style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>O problema</p>
            <h2>Crescer no X é <span className="gradient-text">difícil</span></h2>
          </AnimatedSection>
          <motion.div className="problems-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}>
            {[
              { icon: "😶", title: "Sem saber o que postar", desc: "Você abre o compositor, olha pro cursor piscando, e fecha. Todo dia." },
              { icon: "🤖", title: "IA genérica não funciona", desc: "ChatGPT gera posts que parecem robô. Ninguém engaja com 'Vamos refletir sobre...'" },
              { icon: "💸", title: "Ferramentas caras em dólar", desc: "R$250/mês por uma tool em inglês que nem entende o mercado brasileiro." },
            ].map((p, i) => (
              <motion.div key={i} variants={fadeUp} className="problem-card">
                <div className="problem-icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features">
        <div className="container">
          <AnimatedSection>
            <p className="text-dim mono" style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>A solução</p>
            <h2>Seu assistente de crescimento <span className="gradient-text">completo</span></h2>
          </AnimatedSection>
          <motion.div className="features-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}>
            {[
              { step: "1", title: "Coleta inteligente", desc: "Analisa suas curtidas e perfis que você admira. Entende o que você consome para gerar conteúdo relevante." },
              { step: "2", title: "4 personas de IA", desc: "Estrategista, Provocador, Educador ou Storyteller. Cada um gera conteúdo com voz e estilo diferentes." },
              { step: "3", title: "Posts que parecem humanos", desc: "Formatação otimizada para X, anti-CTA genérica, variações múltiplas. Nada de 'Vamos discutir?'" },
              { step: "4", title: "Mentores automáticos", desc: "Detecta os autores que você mais engaja e absorve o estilo deles para os seus posts." },
              { step: "5", title: "Agendamento + publicação", desc: "Agende e o app publica sozinho. Com retry automático e captura de métricas." },
              { step: "6", title: "Métricas de crescimento", desc: "Acompanhe likes, views, retweets e crescimento de followers. Saiba o que funciona." },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp} className="feature-card">
                <div className="feature-step">{f.step}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <AnimatedSection>
            <div style={{ textAlign: "center" }}>
              <p className="text-dim mono" style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Como funciona</p>
              <h2>3 passos. <span className="gradient-text">Zero complicação.</span></h2>
            </div>
          </AnimatedSection>
          <motion.div className="steps" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {[
              { n: "1", title: "Conecte", desc: "Faça login no X pelo app. Seus dados nunca saem do seu computador." },
              { n: "2", title: "Gere", desc: "A IA analisa seus interesses e gera posts com a persona que você escolher." },
              { n: "3", title: "Publique", desc: "Agende e o app publica automaticamente no melhor horário." },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="step-item">
                <div className="step-number">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing">
        <div className="container">
          <AnimatedSection>
            <div style={{ textAlign: "center" }}>
              <p className="text-dim mono" style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Preços</p>
              <h2>Simples. <span className="gradient-text">Em reais.</span></h2>
              <p className="text-dim" style={{ marginTop: "0.5rem" }}>Sem surpresas, sem dólar, sem fidelidade.</p>
            </div>
          </AnimatedSection>
          <motion.div className="pricing-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {[
              { name: "Free", price: "0", featured: false, features: ["1 persona", "3 gerações/mês", "Coleta de curtidas", "Análise heurística"] },
              { name: "Criador", price: "29", featured: true, features: ["4 personas + custom", "Gerações ilimitadas", "Agendamento automático", "Métricas de crescimento", "3 perfis monitorados", "Suporte prioritário"] },
              { name: "Pro", price: "79", featured: false, features: ["Tudo do Criador", "10 perfis monitorados", "Threads automáticas", "Estudo de perfil com IA", "Ghostwriter mode", "Calendário editorial"] },
            ].map((plan, i) => (
              <motion.div key={i} variants={fadeUp} className={`pricing-card ${plan.featured ? "featured" : ""}`}>
                <div className="pricing-name">{plan.name}</div>
                <div className="pricing-price">R${plan.price}<span>/mês</span></div>
                <ul className="pricing-features">
                  {plan.features.map((f, j) => <li key={j}>{f}</li>)}
                </ul>
                <a href="#waitlist" className={`btn ${plan.featured ? "btn-primary" : "btn-outline"}`} style={{ width: "100%", justifyContent: "center" }}>
                  {plan.price === "0" ? "Começar grátis" : "Entrar na waitlist"}
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <AnimatedSection>
            <div style={{ textAlign: "center" }}>
              <p className="text-dim mono" style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>FAQ</p>
              <h2>Perguntas <span className="gradient-text">frequentes</span></h2>
            </div>
          </AnimatedSection>
          <FAQ />
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section id="waitlist" className="cta-final">
        <div className="container">
          <AnimatedSection>
            <h2>Pronto para crescer no <span className="gradient-text">X</span>?</h2>
            <p>Entre na waitlist e seja um dos primeiros a usar o PostX.</p>
            <form
              style={{ display: "flex", gap: "0.75rem", maxWidth: 440, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector("input");
                if (input?.value) { alert(`${input.value} adicionado!`); input.value = ""; }
              }}
            >
              <input type="email" placeholder="seu@email.com" required style={{
                flex: 1, minWidth: 220, padding: "0.85rem 1.2rem", borderRadius: 12,
                border: "1px solid var(--border)", background: "var(--bg-card)",
                color: "var(--text)", font: "inherit", fontSize: "0.95rem",
              }} />
              <button type="submit" className="btn btn-primary">Quero entrar</button>
            </form>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="footer">
        <div className="container">
          <p><span className="gradient-text" style={{ fontWeight: 700 }}>Post</span>X — Feito no Brasil com IA</p>
        </div>
      </footer>
    </>
  );
}
