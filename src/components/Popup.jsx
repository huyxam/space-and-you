import { useEffect } from "react";
import "./Popup.css";

export default function Popup({ selectedCard, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      // Chỉ đóng khi popup đang hiển thị
      if (e.key === "Escape" && selectedCard) {
        onClose();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, selectedCard]);

  const overlayClassName = `popup-overlay ${selectedCard ? "visible" : ""}`;

  return (
    <div className={overlayClassName} onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        {selectedCard && (
          <>
            <button onClick={onClose} className="popup-close">✕</button>
            <img src={selectedCard.image || selectedCard.url} alt="Kỷ niệm" className="popup-image" />
            <p className="popup-text">{selectedCard.text}</p>
          </>
        )}
      </div>
    </div>
  );
}