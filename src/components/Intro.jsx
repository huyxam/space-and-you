import { useState } from "react";

export default function Intro({ onEnter, onStart }) {
  const [closing, setClosing] = useState(false);

  const handleStart = () => {
    onEnter?.();
    setClosing(true);
    setTimeout(onStart, 760);
  };

  return (
    <div className={`entry-modal ${closing ? "fade-out" : ""}`}>
      <div className="entry-stars" />
      <div className="space-whale" aria-hidden="true">
        <span className="whale-tail" />
        <span className="whale-body" />
        <span className="whale-fin" />
        <span className="whale-eye" />
        <span className="whale-sparkle one" />
        <span className="whale-sparkle two" />
      </div>

      <button className="entry-button" onClick={handleStart}>
        Bắt đầu trải nghiệm
      </button>
    </div>
  );
}
