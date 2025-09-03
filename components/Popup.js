// components/Popup.js
export default function Popup({ onClose, children }) {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        {children}
        <button className="popup-close" onClick={onClose}>✖</button>
      </div>
    </div>
  );
}
