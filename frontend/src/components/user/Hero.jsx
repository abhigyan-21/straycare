import { useEffect, useState } from "react";
import sparrowImg from "../../assets/sparrow.webp";
import catImg from "../../assets/catImg.webp";
import dogImg from "../../assets/dogImg.webp"

const animals = [
  dogImg,
  catImg,
  sparrowImg,
];

function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % animals.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero">
      <div className="hero-left">
        <img src={animals[index]} className="main-circle" />

        <div
          className="small-circle top"
          style={{ backgroundImage: `url("${animals[(index + 1) % animals.length]}")` }}
        />

        <div
          className="small-circle bottom"
          style={{ backgroundImage: `url("${animals[(index + 2) % animals.length]}")` }}
        />
      </div>

      <div className="hero-message">
        <div style={{ textAlign: 'center', maxWidth: '80%' }}>
          <h2>Join the Furzo community today!</h2>
          <p style={{ marginTop: '15px', fontSize: '1.2rem', lineHeight: '1.5', color: '#555' }}>
            Your compassion makes a world of difference. Whether you choose to adopt a loving companion, report a stray in need, support rescue efforts, or simply stay informed about what's happening in your neighborhood, every small step contributes to a larger impact.
            Together, we can provide timely care, safe homes, and a better future for those who cannot speak for themselves. Your kindness has the power to save lives—start making a difference today.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Hero;