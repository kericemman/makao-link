import HomeCategories from "../../../components/common/HomeCategories"
import HomeListingsPreview from "../../../components/common/homeListingPreview"
import Hero from "../../../components/home/Hero"



function Home() {
    return (
      <div>
        <Hero/>
        <HomeCategories/>
        <HomeListingsPreview/>

  
      </div>
    )
  }
  
  export default Home