
import { useState, useEffect } from "react";

function Testimonials() {
  const [row1, setRow1] = useState([]);
  const [row2, setRow2] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID;
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
        const response = await fetch(url);
        const text = await response.text();
        
        // Extract JSON structure from the JSONP response
        const startIdx = text.indexOf("(");
        const endIdx = text.lastIndexOf(")");
        if (startIdx !== -1 && endIdx !== -1) {
          const jsonString = text.substring(startIdx + 1, endIdx);
          const json = JSON.parse(jsonString);
          
          const parsedRows = json.table.rows.map((row) => {
            const profilePic = row.c[1]?.v || "";
            const statement = row.c[2]?.v || "";
            return { profilePic, statement };
          }).filter((item) => item.statement);

          if (parsedRows.length > 0) {
            // Split parsedRows into two rows for the marquee effect
            const mid = Math.ceil(parsedRows.length / 2);
            let firstRow = parsedRows.slice(0, mid);
            let secondRow = parsedRows.slice(mid);

            // If rows are too short for smooth marquee, duplicate them
            if (firstRow.length < 4) {
              firstRow = [...firstRow, ...firstRow];
            }
            if (secondRow.length < 4) {
              secondRow = [...secondRow, ...secondRow];
            }

            setRow1(firstRow);
            setRow2(secondRow);
          }
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Default fallback data if sheet fails or is loading
  const defaultRow1 = [
    { profilePic: "", statement: "Great platform helping stray animals." },
    { profilePic: "", statement: "Great platform helping stray animals." },
    { profilePic: "", statement: "Great platform helping stray animals." },
    { profilePic: "", statement: "Great platform helping stray animals." },
  ];
  const defaultRow2 = [
    { profilePic: "", statement: "Great platform helping stray animals." },
    { profilePic: "", statement: "Great platform helping stray animals." },
    { profilePic: "", statement: "Great platform helping stray animals." },
    { profilePic: "", statement: "Great platform helping stray animals." },
  ];

  const displayRow1 = loading || row1.length === 0 ? defaultRow1 : row1;
  const displayRow2 = loading || row2.length === 0 ? defaultRow2 : row2;

  const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

  return (
    <div className="testimonials">
      <h2>TESTIMONIALS</h2>

      <div className="testimonial-marquee">
        <div className="marquee-row marquee-left">
          <div className="marquee-inner">
            {displayRow1.map((item, index) => (
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
            {displayRow2.map((item, index) => (
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