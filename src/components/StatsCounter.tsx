import { useEffect, useRef, useState } from 'react';

interface StatItem {
  number: number;
  suffix?: string;
  label: string;
}

interface Props {
  stats: StatItem[];
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function AnimatedNumber({
  target,
  suffix,
  duration,
  run,
}: {
  target: number;
  suffix?: string;
  duration: number;
  run: boolean;
}) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const hasStarted = useRef(false);
  const reduceMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  useEffect(() => {
    if (!run) return;
    if (reduceMotion) {
      setValue(target);
      return;
    }
    if (hasStarted.current) return;
    hasStarted.current = true;

    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(easeOutQuart(progress) * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [run, target, duration, reduceMotion]);

  return (
    <span>
      {value}
      {suffix && <span className="align-super text-[0.5em] text-muted-foreground">{suffix}</span>}
    </span>
  );
}

export default function StatsCounter({ stats }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    // divide-x divide-hair rather than a row of hand-drawn <div> rules: the
    // divider is then a property of the row, so a stat added or removed can
    // never leave a rule with nothing on one side of it.
    <div
      ref={ref}
      className="flex flex-wrap gap-y-8 divide-x divide-hair"
      aria-label="Studio statistics"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="px-[clamp(20px,3vw,44px)] first:pl-0 last:pr-0">
          {/* text-foreground, not a brand colour. The numerals used to be
                --primary, which is ONE constant for both themes and measured
                2.97:1 on the dark page ground (caught by tests/contrast.spec.ts,
                PORTS card 43). The art-direction pass gives a numeral its weight
                from the face and the size, so it takes the page's own ink and
                the contrast question stops being a question. */}
          <span className="block font-body text-h1 leading-none font-normal text-foreground oldstyle">
            <AnimatedNumber
              target={stat.number}
              suffix={stat.suffix}
              duration={1800}
              run={visible}
            />
          </span>
          <span className="mt-3 block font-ui text-ui text-muted-foreground">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
