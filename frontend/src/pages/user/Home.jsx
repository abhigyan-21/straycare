import { Helmet } from "react-helmet-async";
import Hero from "../../components/user/Hero";
import ActionCards from "../../components/user/ActionCards";
import Testimonials from "../../components/user/Testimonials";
import StoriesSection from "../../components/user/StoriesSection";
import DecorativeBlobs from "../../components/user/DecorativeBlobs";
import PartnersSection from "../../components/user/PartnersSection";
import WhyPartnerSection from "../../components/user/WhyPartnerSection";

function Home() {
  return (
    <>
      <Helmet>
        <title>Furzo - Rescue Stray Animals & Pet Adoption</title>
        <meta
          name="description"
          content="Report injured stray animals, connect with NGOs and veterinarians, track rescues, and adopt pets through Furzo."
        />

        <meta
          name="keywords"
          content="animal rescue, stray animal rescue, pet adoption, veterinarian, NGO, animal welfare"
        />

        <meta property="og:title" content="Furzo - Rescue Stray Animals & Pet Adoption" />
        <meta
          property="og:description"
          content="Report injured stray animals, connect with NGOs and veterinarians, track rescues, and adopt pets through Furzo."
        />
        <meta property="og:image" content="https://Furzo.vercel.app/FurzoBanner.jpg" />
        <meta property="og:url" content="https://Furzo.vercel.app/" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Furzo - Rescue Stray Animals & Pet Adoption" />
        <meta
          name="twitter:description"
          content="Report injured stray animals, connect with NGOs and veterinarians, track rescues, and adopt pets through Furzo."
        />
        <meta name="twitter:image" content="https://Furzo.vercel.app/FurzoBanner.jpg" />
      </Helmet>

      <div
        style={{
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        <DecorativeBlobs />
        <Hero />
        <ActionCards />
        <StoriesSection />
        <Testimonials />
        <PartnersSection />
        <WhyPartnerSection />
      </div>
    </>
  );
}

export default Home;