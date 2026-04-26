import HomeCategories from "../../../components/common/HomeCategories"
import Hero from "../../../components/home/Hero"
import HomeLisingsPreview from "../../../components/common/HomeListingPreview"
import HomePage from "../../../components/common/HomePage"



function Home() {
    return (
      <div>
        <Hero/>
        <HomeCategories/>
        <HomeLisingsPreview/>
        <HomePage/>
        

  
      </div>
    )
  }
  
  export default Home