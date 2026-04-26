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