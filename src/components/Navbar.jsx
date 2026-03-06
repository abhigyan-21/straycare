import { Link, NavLink } from "react-router-dom";
import logo from "../assets/straycare_logo.png";

// styles are handled globally via src/styles/global.css
function Navbar({ openAuthModal }) {
  return (
    <div className="navbar">
      <div className="nav-left">
        <Link to="/">
          <img src={logo} alt="StrayCare Logo" className="logo" />
        </Link>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/emergency" className="emergency">
          Emergency
        </NavLink>
        <NavLink to="/adopt">Adopt a dog</NavLink>
        <NavLink to="/post">Post</NavLink>
        <NavLink to="/track">Track</NavLink>
        <NavLink to="/about">About Us</NavLink>
        <NavLink to="/guide">Guide</NavLink>
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