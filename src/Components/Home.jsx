import HeroSection from "./Home/HeroSection";
import Competencies from "./Home/Competencies";
import FeaturedWork from "./Home/FeaturedWork";
import CurrentlyBuilding from "./Home/CurrentlyBuilding";
import CastStats from "./CastStats";
import GetInTouch from "./ui/GetInTouch";
import PageWrapper from "./ui/PageWrapper";

const Home = () => {
  return (
    <div className="min-h-page flex flex-col">
      <HeroSection />
      <FeaturedWork />
      <CurrentlyBuilding />
      <Competencies />
      <CastStats />
      <PageWrapper width="6xl" className="w-full pb-20 md:pb-24">
        <GetInTouch />
      </PageWrapper>
    </div>
  );
};

export default Home;
