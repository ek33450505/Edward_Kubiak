import HeroSection from "./Home/HeroSection";
import Competencies from "./Home/Competencies";
import FeaturedWork from "./Home/FeaturedWork";
import CurrentlyBuilding from "./Home/CurrentlyBuilding";
import CastStats from "./CastStats";
import GetInTouch from "./ui/GetInTouch";
import PageWrapper from "./ui/PageWrapper";

const Home = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center relative overflow-hidden">
      <HeroSection />
      <Competencies />
      <FeaturedWork />
      <CurrentlyBuilding />
      <CastStats />
      <PageWrapper width="6xl" className="pb-20 w-full relative z-[2]">
        <GetInTouch />
      </PageWrapper>
    </div>
  );
};

export default Home;
