import Hero from "../../../components/home/Hero"
import RelocationSection from "../../../components/home/LogisticSection"


function Home() {
    return (
      <div>
        <Hero/>
        {/* <PropertySection
        title="Villas"
        type="villa"
      />

      <PropertySection
        title="Apartments"
        type="apartment"
      />

      <PropertySection
        title="Studios"
        type="studio"
      />

      <PropertySection
        title="Bedsitters"
        type="bedsitter"
      /> */}

      <RelocationSection/>
      </div>
    )
  }
  
  export default Home