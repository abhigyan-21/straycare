import { Link } from "react-router-dom";
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section about">
          <h2>Furzo</h2>
          <p>Dedicated to the welfare of stray animals. Join us in making a difference.</p>
        </div>
      </div>
      <div>
        &copy; 2026 Furzo. All rights reserved.
      </div>
      <div className="footer-bottom">
        <Link to="/about" className="footer-Link">About</Link>
        <Link to="/privacy" className="footer-Link">Privacy Policy</Link>
        <Link to="/terms" className="footer-Link">Terms of Service</Link>
        <Link to="/faq" className="footer-Link">FAQ</Link>
      </div>
    </footer>
  );
}
export default Footer;