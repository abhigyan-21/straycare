import { useEffect, useState } from "react";

const animals = [
  "https://images.unsplash.com/photo-1558788353-f76d92427f16?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1444464666168-49d633b86797?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
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
          style={{ backgroundImage: `url(${animals[(index + 1) % animals.length]})` }}
        />

        <div
          className="small-circle bottom"
          style={{ backgroundImage: `url(${animals[(index + 2) % animals.length]})` }}
        />
      </div>

      <div className="hero-message">
        <div style={{ textAlign: 'center', maxWidth: '80%' }}>
          <h2>Give a Stray a Second Chance</h2>
          <p style={{ marginTop: '15px', fontSize: '1.2rem', lineHeight: '1.5', color: '#555' }}>
            Join the StrayCare community today! Whether you're looking to adopt a furry friend, report an animal in need, or track rescues in your neighborhood, your compassion makes a world of difference.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Hero;