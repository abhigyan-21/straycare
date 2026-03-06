import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SOSModal from "./SOSModal";

// card styles provided by global.css
function ActionCards() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const openMaps = () => {
    window.open(
      "https://www.google.com/maps/search/veterinary+hospitals+near+me",
      "_blank"
    );
  };

  return (
    <>
      <div className="actions">

        <div className="card" onClick={() => navigate("/adopt")}>
          Help a dog
        </div>

        <div className="card" onClick={() => navigate("/adopt")}>
          adopt a dog
        </div>

        <div className="card emergency" onClick={() => setOpen(true)}>
          emergency help
        </div>

        <div className="card" onClick={openMaps}>
          Nearby hospitals and vets
        </div>

        <div className="card" onClick={() => navigate("/track")}>
          Track
        </div>

      </div>

      {open && <SOSModal onClose={() => setOpen(false)} />}
    </>
  );
}

export default ActionCards;