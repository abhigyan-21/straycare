import Hero from "../../components/user/Hero";
import ActionCards from "../../components/user/ActionCards";
import Testimonials from "../../components/user/Testimonials";
import StoriesSection from "../../components/user/StoriesSection";
import DecorativeBlobs from "../../components/user/DecorativeBlobs";

function Home() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', isolation: 'isolate' }}>
      <DecorativeBlobs />

      <Hero />
      <ActionCards />
      <StoriesSection />
      <Testimonials />
    </div>
  );
}

export default Home;