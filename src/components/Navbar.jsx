import { Link, NavLink } from "react-router-dom";
import logo from "../assets/straycare_logo.png";
import { useAuth } from "../context/AuthContext";

// styles are handled globally via src/styles/global.css
function Navbar({ openAuthModal }) {
  const { isLoggedIn, logout } = useAuth();

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
        <NavLink to="/adopt">Adopt a pet</NavLink>
        <NavLink to="/post">Post</NavLink>
        <NavLink to="/track">Track</NavLink>
        <NavLink to="/help">Support Us</NavLink>
        <NavLink to="/guide">Guide</NavLink>
      </div>

      <div className="nav-right">
        {!isLoggedIn ? (
          <>
            <button onClick={() => openAuthModal('signin')} className="nav-link-btn sign-btn">
              sign in
            </button>
            <button onClick={() => openAuthModal('signup')} className="sign-up-btn sign-btn">
              sign up
            </button>
          </>
        ) : (
          <>
            <button onClick={logout} className="nav-link-btn sign-btn">
              logout
            </button>
            <NavLink to="/profile" className="sign-up-btn sign-btn">
              Profile
            </NavLink>
          </>
        )}

      </div>

    </div>
  );
}


export default Navbar;