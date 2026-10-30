"use client";

import { useEffect, useRef } from "react";

const revealTargets = [
  ".landing-demo-scene > *",
  ".landing-section-heading",
  ".landing-feature-grid > *",
  ".landing-feature-copy > *",
  ".landing-editor > *",
  ".landing-feature-summary",
  ".landing-steps > li",
  ".landing-pricing-heading",
  ".landing-pricing-cards > *",
  ".landing-plan-card li",
  ".landing-faq-list > details",
  ".landing-cta > *",
  ".landing-footer-top > *",
  ".landing-student i",
].join(", ");

const staggerGroups: { selector: string; base: number; step: number; max: number }[] = [
  { selector: ".landing-demo-scene", base: 0, step: 110, max: 2 },
  { selector: ".landing-feature-grid", base: 0, step: 120, max: 2 },
  { selector: ".landing-feature-copy", base: 120, step: 90, max: 3 },
  { selector: ".landing-editor", base: 260, step: 90, max: 3 },
  { selector: ".landing-steps", base: 0, step: 140, max: 2 },
  { selector: ".landing-pricing-cards", base: 0, step: 140, max: 1 },
  { selector: ".landing-plan-card ul", base: 220, step: 70, max: 5 },
  { selector: ".landing-faq-list", base: 0, step: 80, max: 6 },
  { selector: ".landing-cta", base: 0, step: 140, max: 1 },
  { selector: ".landing-footer-top", base: 0, step: 100, max: 2 },
];

function getDelay(element: HTMLElement) {
  const parent = element.parentElement;
  if (!parent) return 0;
  const group = staggerGroups.find((item) => parent.matches(item.selector));
  if (!group) return 0;
  const index = Array.from(parent.children).indexOf(element);
  return group.base + Math.min(index, group.max) * group.step;
}

export function LandingMotion() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".landing-page");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (
      !page ||
      reducedMotion.matches ||
      !("IntersectionObserver" in window) ||
      typeof HTMLElement.prototype.animate !== "function"
    ) {
      return;
    }

    const compact = window.matchMedia("(max-width: 620px)").matches;
    const distance = compact ? 20 : 36;
    const animations = new Map<Element, Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          animations.get(entry.target)?.play();
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );

    for (const element of page.querySelectorAll<HTMLElement>(revealTargets)) {
      if (element.getBoundingClientRect().bottom <= 0) continue;

      const isProgressBar = element.matches(".landing-student i");
      const isListItem = element.matches(".landing-plan-card li");
      const frames: Keyframe[] = isProgressBar
        ? [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }]
        : [
            {
              opacity: 0,
              translate: isListItem ? "-14px 0" : `0 ${distance}px`,
              scale: isListItem ? "1" : "0.97",
              filter: isListItem ? "blur(0px)" : "blur(6px)",
            },
            { opacity: 1, translate: "0 0", scale: "1", filter: "blur(0px)" },
          ];
      const animation = element.animate(frames, {
        duration: isListItem ? 520 : compact ? 640 : 900,
        delay: getDelay(element) + (isProgressBar ? 250 : 0),
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "both",
      });

      animation.pause();
      animations.set(element, animation);
      animation.onfinish = () => {
        animation.cancel();
        animations.delete(element);
      };
      observer.observe(element);
    }

    const nav = page.querySelector<HTMLElement>(".landing-nav");
    const papers = Array.from(page.querySelectorAll<HTMLElement>(".landing-paper"));
    const progress = progressRef.current;
    let frame = 0;

    function update() {
      frame = 0;
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (progress && maxScroll > 0) {
        progress.style.transform = `scaleX(${Math.min(scrollTop / maxScroll, 1)})`;
      }
      if (nav) nav.dataset.scrolled = scrollTop > 12 ? "true" : "false";
      if (scrollTop < 900) {
        papers.forEach((paper, index) => {
          paper.style.translate = `0 ${scrollTop * (index === 0 ? -0.14 : -0.22)}px`;
        });
      }
    }

    function handleScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    function showAll() {
      observer.disconnect();
      for (const animation of animations.values()) animation.cancel();
      animations.clear();
    }

    function handleMotionChange() {
      if (reducedMotion.matches) showAll();
    }

    function handleFocus(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      for (const [element, animation] of animations) {
        if (!element.contains(event.target)) continue;
        observer.unobserve(element);
        animation.cancel();
        animations.delete(element);
      }
    }

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    reducedMotion.addEventListener("change", handleMotionChange);
    page.addEventListener("focusin", handleFocus);

    return () => {
      showAll();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      reducedMotion.removeEventListener("change", handleMotionChange);
      page.removeEventListener("focusin", handleFocus);
    };
  }, []);

  return <div ref={progressRef} className="landing-scroll-progress" aria-hidden="true" />;
}
