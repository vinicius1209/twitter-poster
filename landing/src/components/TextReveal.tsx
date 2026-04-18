import { useRef, useEffect } from "react";
import gsap from "gsap";

type Props = {
  text: string;
  className?: string;
  delay?: number;
};

export function TextReveal({ text, className = "", delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const words = text.split(" ");
    el.innerHTML = "";

    words.forEach((word) => {
      const wordSpan = document.createElement("span");
      wordSpan.style.display = "inline-block";
      wordSpan.style.marginRight = "0.25em";
      wordSpan.style.overflow = "hidden";
      wordSpan.style.verticalAlign = "top";

      word.split("").forEach((char) => {
        const s = document.createElement("span");
        s.textContent = char;
        s.style.display = "inline-block";
        s.className = "reveal-char";
        wordSpan.appendChild(s);
      });

      el.appendChild(wordSpan);
    });

    const chars = el.querySelectorAll(".reveal-char");
    gsap.set(chars, { yPercent: 120, opacity: 0 });
    gsap.to(chars, {
      yPercent: 0,
      opacity: 1,
      duration: 0.7,
      ease: "power4.out",
      stagger: 0.025,
      delay,
    });

    return () => { gsap.killTweensOf(chars); };
  }, [text, delay]);

  return <div ref={ref} className={className} aria-label={text} />;
}
