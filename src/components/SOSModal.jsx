
function SOSModal({ onClose }) {
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      alert(
        `Location captured: ${pos.coords.latitude}, ${pos.coords.longitude}`
      );
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>SOS Emergency</h2>

        <input placeholder="Your Name" />
        <input placeholder="Phone Number" />
        <textarea placeholder="Describe the issue..." />

        <button onClick={getLocation}>Auto Detect Location</button>
        <button className="call-btn">Call Our Team</button>

        <button className="close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default SOSModal;