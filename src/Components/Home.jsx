import HeroSection from "./Home/HeroSection";
import Competencies from "./Home/Competencies";
import FeaturedWork from "./Home/FeaturedWork";
import CurrentlyBuilding from "./Home/CurrentlyBuilding";
import RecentWriting from "./Home/RecentWriting";
import CastStats from "./CastStats";
import GetInTouch from "./ui/GetInTouch";

const Home = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center relative overflow-hidden">
      <HeroSection />
      <Competencies />
      <FeaturedWork />
      <CurrentlyBuilding />
      <RecentWriting />
      <div className="max-w-6xl mx-auto px-6 pb-20 w-full relative z-[2]">
        <GetInTouch />
      </div>
      <CastStats />
    </div>
  );
};

export default Home;
