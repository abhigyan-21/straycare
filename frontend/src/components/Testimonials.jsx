
function Testimonials() {
  const row1 = [1, 2, 1, 2];
  const row2 = [3, 4, 3, 4];

  return (
    <div className="testimonials">
      <h2>TESTIMONIALS</h2>

      <div className="testimonial-marquee">
        <div className="marquee-row marquee-left">
          <div className="marquee-inner">
            {row1.map((item, index) => (
              <div className="testimonial-card" key={`row1-${index}`}>
                <div className="avatar"></div>
                <div className="content">
                  <p>Great platform helping stray animals.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="marquee-row marquee-right">
          <div className="marquee-inner">
            {row2.map((item, index) => (
              <div className="testimonial-card" key={`row2-${index}`}>
                <div className="avatar"></div>
                <div className="content">
                  <p>Great platform helping stray animals.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Testimonials;