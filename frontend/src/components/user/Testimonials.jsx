
const testimonials = [
  {
    profilePic: "",
    statement: "Furzo helped me rescue an injured puppy near my house. The vet was there within an hour!",
  },
  {
    profilePic: "",
    statement: "I adopted my cat through this platform. The process was smooth and transparent.",
  },
  {
    profilePic: "",
    statement: "Great platform helping stray animals. The community here is truly amazing.",
  },
  {
    profilePic: "",
    statement: "Thanks to Furzo, I was able to connect with an NGO that saved a dog hit by a car.",
  },
  {
    profilePic: "",
    statement: "The live tracking feature gave me peace of mind knowing the rescue was underway.",
  },
  {
    profilePic: "",
    statement: "I volunteer through Furzo and it makes coordinating rescues so much easier.",
  },
  {
    profilePic: "",
    statement: "Found a forever home for three kittens through the adoption portal. Highly recommend!",
  },
  {
    profilePic: "",
    statement: "The emergency reporting feature is a lifesaver. Literally.",
  },
];

function Testimonials() {
  // Split testimonials into two rows for the marquee
  const mid = Math.ceil(testimonials.length / 2);
  const row1 = testimonials.slice(0, mid);
  const row2 = testimonials.slice(mid);

  const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

  return (
    <div className="testimonials">
      <h2>TESTIMONIALS</h2>

      <div className="testimonial-marquee">
        <div className="marquee-row marquee-left">
          <div className="marquee-inner">
            {row1.map((item, index) => (
              <div className="testimonial-card" key={`row1-${index}`}>
                <div className="avatar">
                  <img
                    src={item.profilePic || defaultAvatar}
                    alt="Testimonial Avatar"
                    onError={(e) => {
                      e.target.src = defaultAvatar;
                    }}
                  />
                </div>
                <div className="content">
                  <p>{item.statement}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="marquee-row marquee-right">
          <div className="marquee-inner">
            {row2.map((item, index) => (
              <div className="testimonial-card" key={`row2-${index}`}>
                <div className="avatar">
                  <img
                    src={item.profilePic || defaultAvatar}
                    alt="Testimonial Avatar"
                    onError={(e) => {
                      e.target.src = defaultAvatar;
                    }}
                  />
                </div>
                <div className="content">
                  <p>{item.statement}</p>
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