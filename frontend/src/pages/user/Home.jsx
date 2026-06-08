import { Helmet } from "react-helmet-async";
import Hero from "../../components/user/Hero";
import ActionCards from "../../components/user/ActionCards";
import Testimonials from "../../components/user/Testimonials";
import StoriesSection from "../../components/user/StoriesSection";
import DecorativeBlobs from "../../components/user/DecorativeBlobs";

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
          name="description"
          content="Report injured stray animals, connect with NGOs and veterinarians, track rescues, and adopt pets through Furzo."
        />

        <meta
          name="keywords"
          content="animal rescue, stray animal rescue, pet adoption, veterinarian, NGO, animal welfare"
        />

        <meta property="og:title" content="Furzo" />

        <meta
          property="og:description"
          content="Rescue, adoption and veterinary assistance platform."
        />

        <meta property="og:type" content="website" />
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
      </div>
    </>
  );
}

export default Home;