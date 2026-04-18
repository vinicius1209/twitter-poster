import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "Preciso da API paga do X/Twitter?",
    a: "Não. O PostX funciona via automação de browser — não precisa de API, não tem custo adicional com o X. Você só precisa estar logado na sua conta.",
  },
  {
    q: "A IA vai postar sem minha aprovação?",
    a: "Nunca. Você gera rascunhos, revisa, edita e escolhe quais agendar. O PostX sugere, você decide.",
  },
  {
    q: "Funciona com conta gratuita do X?",
    a: "Sim, para posts curtos (280 chars). Com X Premium, você pode gerar posts longos e threads.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "O motor de automação roda no seu computador. Seus cookies e sessão do X nunca saem da sua máquina.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim, sem fidelidade. Cancele quando quiser, sem perguntas.",
  },
  {
    q: "Em quanto tempo vejo resultados?",
    a: "A consistência é o que gera resultado. Usuários que postam diariamente por 30 dias reportam aumento médio de 3x no engajamento.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {faqs.map((faq, i) => (
        <div key={i} className="faq-item">
          <button
            className="faq-question"
            onClick={() => setOpen(open === i ? null : i)}
          >
            {faq.q}
            <motion.span
              animate={{ rotate: open === i ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ fontSize: "1.2rem", color: "var(--accent)" }}
            >
              +
            </motion.span>
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className="faq-answer">{faq.a}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
