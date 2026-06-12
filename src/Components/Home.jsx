import HeroSection from "./Home/HeroSection";
import Competencies from "./Home/Competencies";
import FeaturedWork from "./Home/FeaturedWork";
import CurrentlyBuilding from "./Home/CurrentlyBuilding";
import RecentWriting from "./Home/RecentWriting";
import CTASection from "./Home/CTASection";
import CastStats from "./CastStats";

const Home = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center relative overflow-hidden">
      <HeroSection />
      <Competencies />
      <FeaturedWork />
      <CurrentlyBuilding />
      <RecentWriting />
      <CTASection />
      <CastStats />
    </div>
  );
};

export default Home;
