import "../../styles/user/DecorativeBlobs.css";

const DecorativeBlobs = () => {
  return (
    <div className="decorative-blobs-container">
      {/* 1. Top-Left Large Organic Wrap */}
      <svg className="blob blob-1" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0,0 L900,0 C850,100 700,120 650,250 C600,380 750,450 600,600 C450,750 200,700 0,850 Z" />
      </svg>

      {/* 2. Top-Right Curvy Peek */}
      <svg className="blob blob-2" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M400,0 L150,0 C180,80 120,150 220,220 C320,290 350,320 400,350 Z" />
      </svg>

      {/* 3. Middle-Left Wavy Bulge (Anchored to Left Edge) */}
      <svg className="blob blob-3" viewBox="0 0 400 1000" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0,0 L0,1000 C150,950 250,800 200,650 C150,500 250,350 150,200 C100,100 50,50 0,0 Z" />
      </svg>

      {/* 4. Middle-Right Wavy Bulge (Anchored to Right Edge) */}
      <svg className="blob blob-4" viewBox="0 0 400 1000" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M400,0 L400,1000 C250,950 150,800 200,650 C250,500 150,350 250,200 C300,100 350,50 400,0 Z" />
      </svg>

      {/* 5. Bottom-Right Very Wavy Shape (Anchored to Right Edge) */}
      <svg className="blob blob-5" viewBox="0 0 600 1200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M600,0 L600,1200 C450,1100 250,1000 350,850 C450,700 250,550 350,400 C450,250 350,100 600,0 Z" />
      </svg>

      {/* 6. Bottom-Left Curvy Peek */}
      <svg className="blob blob-6" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0,150 C120,180 180,120 220,250 C260,380 150,400 0,400 Z" />
      </svg>

      {/* 7. Lower-Left Add-on for extra sections */}
      <svg className="blob blob-7" viewBox="0 0 400 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0,100 C150,50 250,200 200,400 C150,600 250,750 0,800 Z" />
      </svg>

      {/* 8. Lower-Right Add-on for extra sections */}
      <svg className="blob blob-8" viewBox="0 0 400 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M400,100 C250,50 150,200 200,400 C250,600 150,750 400,800 Z" />
      </svg>

      {/* 9. Mid-Left Add-on for gap near Action Cards */}
      <svg className="blob blob-9" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0,100 C150,50 250,200 200,350 C150,500 100,550 0,600 Z" />
      </svg>

      {/* 10. Small Right Corner Peek */}
      <svg className="blob blob-10" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M200,50 C120,20 50,80 20,150 C10,180 100,200 200,200 Z" />
      </svg>
    </div>
  );
};

export default DecorativeBlobs;
