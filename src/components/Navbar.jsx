import { Link } from "react-router-dom";
import logo from "../assets/straycare_logo.png";

// styles are handled globally via src/styles/global.css
function Navbar() {
  return (
    <div className="navbar">
      <div className="nav-left">
        <Link to="/">
          <img src={logo} alt="StrayCare Logo" className="logo" />
        </Link>

        <Link to="/adopt">Adopt a dog</Link>
        <Link to="/post">Post</Link>
        <Link to="/emergency" className="emergency">
          Emergency
        </Link>
        <Link to="/track">Track</Link>
        <Link to="/about">About Us</Link>
        <Link to="/guide">Guide</Link>
      </div>

      <div className="nav-right">
        <Link to="/signin" className="btn">sign in</Link>
        <Link to="/signup" className="btn">sign up</Link>
      </div>
    </div>
  );
}

export default Navbar;