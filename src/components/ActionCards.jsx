import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SOSModal from "./SOSModal";

const actionCardsData = [
  {
    title: "Help a pet",
    path: "/help",
    image: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=400",
    isEmergency: false,
  },
  {
    title: "adopt a pet",
    path: "/adopt",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400",
    isEmergency: false,
  },
  {
    title: "emergency help",
    path: null,
    image: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=400",
    isEmergency: true,
  },
  {
    title: "Nearby hospitals and vets",
    path: "maps",
    image: "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&q=80&w=400",
    isEmergency: false,
  },
  {
    title: "Track",
    path: "/track",
    image: "https://images.unsplash.com/photo-1504595403659-9088ce801e29?auto=format&fit=crop&q=80&w=400",
    isEmergency: false,
  },
  {
    title: "Posts",
    path: "/post",
    image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=400",
    isEmergency: false,
  }
];

function ActionCards() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleClick = (card) => {
    if (card.isEmergency) {
      setOpen(true);
    } else if (card.path === "maps") {
      window.open(
        "https://www.google.com/maps/search/veterinary+hospitals+near+me",
        "_blank"
      );
    } else {
      window.scrollTo(0, 0);
      navigate(card.path);
    }
  };

  return (
    <>
      <div className="actions">
        {actionCardsData.map((card, index) => (
          <div
            key={index}
            className={`card ${card.isEmergency ? 'emergency' : ''}`}
            onClick={() => handleClick(card)}
          >
            <div className="card-bg" style={{ backgroundImage: `url(${card.image})` }}></div>
            <span className="card-text">{card.title}</span>
          </div>
        ))}
      </div>

      {open && <SOSModal onClose={() => setOpen(false)} />}
    </>
  );
}

export default ActionCards;