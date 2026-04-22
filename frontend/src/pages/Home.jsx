import Hero from "../components/user/Hero";
import ActionCards from "../components/user/ActionCards";
import Testimonials from "../components/user/Testimonials";
import StoriesSection from "../components/user/StoriesSection";

function Home() {
  return (
    <>
      <Hero />
      <ActionCards />
      <StoriesSection />
      <Testimonials />
    </>
  );
}

export default Home;