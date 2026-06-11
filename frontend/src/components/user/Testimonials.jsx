import { testimonialData } from "../../data/testimonialData";
import { useMemo } from 'react';
function Testimonials() {
  // Split testimonials into two rows for the marquee
  const { row1, row2 } = useMemo(() => {
    const mid = Math.ceil(testimonialData.length / 2);

    return {
      row1: testimonialData.slice(0, mid),
      row2: testimonialData.slice(mid),
    };
  }, []);

  const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

  return (
    <div className="testimonials">
      <h2>TESTIMONIALS</h2>

      <div className="testimonial-marquee">
        <div className="marquee-row marquee-left">
          <div className="marquee-inner">
            {[...row1, ...row1].map((item, index) => (
              <div className="testimonial-card" key={`row1-${index}`}>
                <div className="avatar">
                  <img
                    src={item.profilePic ? `/testimonialImages/${item.profilePic}` : defaultAvatar}
                    alt={item.name}
                    onError={(e) => {
                      e.target.src = defaultAvatar;
                    }}
                  />
                </div>
                <div className="testimonial-content">
                  <h4 className="testimonial-name">{item.name}</h4>
                  <p className="testimonial-statement">{item.statement}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="marquee-row marquee-right">
          <div className="marquee-inner">
            {[...row2, ...row2].map((item, index) => (
              <div className="testimonial-card" key={`row2-${index}`}>
                <div className="avatar">
                  <img
                    loading="lazy"
                    src={item.profilePic || defaultAvatar}
                    alt="Testimonial Avatar"
                    onError={(e) => {
                      e.target.src = defaultAvatar;
                    }}
                  />
                </div>
                <div className="testimonial-content">
                  <h4 className="testimonial-name">{item.name}</h4>
                  <p className="testimonial-statement">{item.statement}</p>
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