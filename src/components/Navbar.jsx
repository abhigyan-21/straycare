import { Link } from "react-router-dom";
import logo from "../assets/straycare_logo.png";

// styles are handled globally via src/styles/global.css
function Navbar({ openAuthModal }) {
  return (
    <div className="navbar">
      <div className="nav-left">
        <Link to="/">
          <img src={logo} alt="StrayCare Logo" className="logo" />
        </Link>
        <Link to="/">Home</Link>
        <Link to="/emergency" className="emergency">
          Emergency
        </Link>
        <Link to="/adopt">Adopt a dog</Link>
        <Link to="/post">Post</Link>
        <Link to="/track">Track</Link>
        <Link to="/about">About Us</Link>
        <Link to="/guide">Guide</Link>
      </div>

      <div className="nav-right">
        <button onClick={() => openAuthModal('signin')} className="nav-link-btn">
          sign in
        </button>
        <button onClick={() => openAuthModal('signup')} className="btn" style={{ background: '#d4feb2' }}>
          sign up
        </button>
      </div>
    </div>
  );
}

export default Navbar;