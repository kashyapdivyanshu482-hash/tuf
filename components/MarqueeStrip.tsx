type MarqueeStripProps = {
  text: string;
  reverse?: boolean;
};

export default function MarqueeStrip({ text, reverse = false }: MarqueeStripProps) {
  const items = Array.from({ length: 12 }, (_, i) => `${text} •`);

  return (
    <div className="marquee-container">
      <div className={`marquee-track ${reverse ? "marquee-reverse" : ""}`}>
        {items.map((item, idx) => (
          <span key={`a-${idx}`} className="marquee-item">
            {item}
          </span>
        ))}
        {items.map((item, idx) => (
          <span key={`b-${idx}`} className="marquee-item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
