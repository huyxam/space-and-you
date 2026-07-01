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
      <img 
        src="/images/image-removebg-preview.png" 
        alt="cute cat" 
        className="intro-cat-image"
        style={{
          width: '220px',
          height: 'auto',
          marginBottom: '30px',
          filter: 'drop-shadow(0 0 18px rgba(150, 65, 255, 0.9)) drop-shadow(0 0 26px rgba(0, 215, 255, 0.45))',
          animation: 'catFloatIntro 3.2s ease-in-out infinite'
        }}
      />

      <button className="entry-button" onClick={handleStart}>
        Có một vũ trụ nhỏ đang chờ em...
      </button>
    </div>
  );
}
