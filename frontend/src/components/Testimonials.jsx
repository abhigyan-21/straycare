
function Testimonials() {
  const data = [1, 2, 3, 4];

  return (
    <div className="testimonials">
      <h2>TESTIMONIALS</h2>

      <div className="testimonial-grid">
        {data.map((item) => (
          <div className="testimonial-card" key={item}>
            <div className="avatar"></div>
            <div className="content">
              <p>Great platform helping stray animals.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Testimonials;