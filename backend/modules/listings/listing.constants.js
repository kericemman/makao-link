const COUNTY_TOWNS = {
  nairobi: [
    "nairobi-cbd",
    "westlands",
    "kileleshwa",
    "kilimani",
    "lavington",
    "ngong-road",
    "south-b",
    "south-c",
    "langata",
    "embakasi",
    "kasarani",
    "ruaraka",
    "roysambu",
    "donholm",
    "utawala"
  ],
  kiambu: [
    "thika",
    "ruiru",
    "juja",
    "kiambu-town",
    "limuru",
    "kikuyu",
    "ruaka",
    "banana",
    "karuri",
    "gitaru"
  ],
  machakos: [
    "machakos-town",
    "athi-river",
    "mavoko",
    "syokimau",
    "katani",
    "mlolongo",
    "kangundo"
  ],
  kajiado: [
    "kitengela",
    "ongata-rongai",
    "ngong",
    "kiserian",
    "kajiado-town",
    "isinya",
    "namanga"
  ], 

  eldoret: [
    "eldoret-town",
    "ainabkoi",
    "kapseret",
    "kipkaren",
    "langas",
    "tulwet",
    "sosiani"
  ],
  mombasa: [
    "mombasa-town",
    "likoni",
    "kisauni",
    "nyali",
    "changamwe",
    "jomvu",
    "mvita"
  ],
  kisumu: [
    "kisumu-town",
    "migosi",
    "nyalenda",
    "obunga",
    "kondele",
    "nyakach"
  ],
  nakuru: [
    "nakuru-town",
    "naivasha",
    "eldama-ravine",
    "molo",
    "njoro",
    "limuru"
  ],
  naivasha: [
    "naivasha-town",
    "nakuru-road",
    "maai-mai",
    "karagita",
    "njoro",
    "limuru"
  ],
  kisii: [
    "kisii-town",
    "bobasi",
    "kitutu-chache",
    "kitutu-south",
    "nyaribari-chache",
    "nyaribari-moranga"
  ],
  meru: [
    "meru-town",
    "tigania-east",
    "tigania-west",
    "buuri-east",
    "buuri-west",
    "imenti-north",
    "imenti-south"
  ]
};

const COUNTIES = Object.keys(COUNTY_TOWNS);

const RESIDENTIAL_TYPES = [
  "apartment",
  "bedsitter",
  "maisonette",
  "studio",
  "bungalow",
  "townhouse",
  "villa",
  
];

const LISTING_TYPES = [
  ...RESIDENTIAL_TYPES,
  "office",
  "other"
];

const LISTING_PURPOSES = ["rent", "sale"];
const OFFICE_SIZE_UNITS = ["sqft"];

module.exports = {
  COUNTY_TOWNS,
  COUNTIES,
  RESIDENTIAL_TYPES,
  LISTING_TYPES,
  LISTING_PURPOSES,
  OFFICE_SIZE_UNITS
};