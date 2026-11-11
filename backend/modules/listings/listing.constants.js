const COUNTY_TOWNS = {
  "baringo": ["kabarnet", "eldama-ravine", "marigat", "mogotio", "kabartonjo", "chemolingot"],
  "bomet": ["bomet", "sotik", "kaplong", "longisa", "mulot", "siongiroi"],
  "bungoma": ["bungoma", "webuye", "kimilili", "chwele", "malakisi", "sirisia", "naitiri"],
  "busia": ["busia", "malaba", "nambale", "bumala", "funyula", "butula", "port-victoria"],
  "elgeyo-marakwet": ["iten", "kapsowar", "tambach", "chepkorio", "cheptongei", "kapcherop"],
  "embu": ["embu", "runyenjes", "siakago", "manyatta", "kiritiri", "mwea"],
  "garissa": ["garissa", "dadaab", "modogashe", "masalani", "balambala", "hulugho"],
  "homa-bay": ["homa-bay", "oyugis", "kendu-bay", "mbita", "ndhiwa", "sindo", "rodi-kopany"],
  "isiolo": ["isiolo", "garbatulla", "merti", "oldonyiro", "kula-mawe"],
  "kajiado": ["kajiado", "kitengela", "ongata-rongai", "ngong", "kiserian", "isinya", "namanga", "loitokitok", "mashuru"],
  "kakamega": ["kakamega", "mumias", "butere", "malava", "luanda", "khayega", "lumakanda", "matungu"],
  "kericho": ["kericho", "litein", "londiani", "kipkelion", "kabianga", "chepseon"],
  "kiambu": ["kiambu", "thika", "ruiru", "juja", "limuru", "kikuyu", "ruaka", "githunguri", "gatundu", "karuri", "wangige", "banana"],
  "kilifi": ["kilifi", "malindi", "watamu", "mtwapa", "mariakani", "kaloleni", "matsangoni", "kikambala"],
  "kirinyaga": ["kerugoya", "kutus", "wanguru", "sagana", "kagio", "baricho", "kianyaga"],
  "kisii": ["kisii", "kisii-town", "ogembo", "bobasi", "kitutu-chache", "kitutu-south", "nyaribari-chache", "nyaribari-moranga", "keroka", "suneka", "nyamache", "marani", "ikonge"],
  "kisumu": ["kisumu", "kisumu-town", "ahero", "maseno", "muhoroni", "nyakach", "migosi", "nyalenda", "obunga", "kondele", "katito", "mbale"],
  "kitui": ["kitui", "mwingi", "mutomo", "kabati", "migwani", "kyuso", "kibwezi"],
  "kwale": ["kwale", "ukunda", "diani", "kinango", "lunga-lunga", "msambweni", "maji-ya-chumvi"],
  "laikipia": ["nanyuki", "nyahururu", "rumuruti", "doldol", "sipili", "kinamba", "ol-jabet"],
  "lamu": ["lamu", "mpeketoni", "mokowe", "witu", "hindi", "kiunga"],
  "machakos": ["machakos", "machakos-town", "athi-river", "mavoko", "syokimau", "mlolongo", "kangundo", "tala", "masii"],
  "makueni": ["wote", "emali", "makindu", "mtito-andei", "kibwezi", "makueni", "kilome", "ukia"],
  "mandera": ["mandera", "rhamu", "takaba", "elwak", "banissa", "lafey"],
  "marsabit": ["marsabit", "moyale", "north-horr", "loiyangalani", "sololo", "laisamis", "saku"],
  "meru": ["meru", "meru-town", "maua", "timau", "nkubu", "mikinduri", "maua-town", "kianjai", "tigania-east", "tigania-west", "buuri-east", "buuri-west", "imenti-north", "imenti-south"],
  "migori": ["migori", "rongo", "awendo", "kehancha", "isebania", "macalder", "oyani"],
  "mombasa": ["mombasa", "mombasa-town", "likoni", "kisauni", "nyali", "changamwe", "jomvu", "mvita"],
  "muranga": ["muranga", "kenol", "maragua", "makuyu", "kangema", "kandara", "kiriani", "sabasaba"],
  "nairobi": ["nairobi-cbd", "westlands", "kileleshwa", "kilimani", "lavington", "ngong-road", "south-b", "south-c", "langata", "embakasi", "kasarani", "ruaraka", "roysambu", "donholm", "utawala", "karen", "dagoretti", "kibera"],
  "nakuru": ["nakuru", "nakuru-town", "naivasha", "naivasha-town", "molo", "njoro", "gilgil", "eldama-ravine", "rongai", "subukia", "maai-mahiu", "maai-mai", "karagita", "njoro-town", "nakuru-road", "naivasha-road", "limuru"],
  "nandi": ["kapsabet", "nandi-hills", "mosoriot", "kabiyet", "lessos", "baraton", "tinderet"],
  "narok": ["narok", "kilgoris", "suswa", "ololulunga", "mulot", "ewaso-ngiro", "sekenani"],
  "nyamira": ["nyamira", "keroka", "nyansiongo", "manga", "ekerenyo", "masaba", "gesima"],
  "nyandarua": ["ol-kalou", "engineer", "njabini", "ndunyu-njeru", "mirangine", "kinangop", "maimana"],
  "nyeri": ["nyeri", "karatina", "othaya", "mukurwe-ini", "mweiga", "naromoru", "chaka"],
  "samburu": ["maralal", "baragoi", "archers-post", "wamba", "south-horr", "suguta-marmar", "lodungokwe"],
  "siaya": ["siaya", "bondo", "yala", "ukwala", "ugunja", "usenge", "ndori"],
  "taita-taveta": ["voi", "taveta", "wundanyi", "mwatate", "maungu", "mwatate-town", "maktau"],
  "tana-river": ["hola", "garsen", "madogo", "bura", "galole", "bangale", "kipini"],
  "tharaka-nithi": ["chuka", "marimanti", "chogoria", "marimanti-town", "mitheru", "chiakariga"],
  "trans-nzoia": ["kitale", "kiminini", "endebess", "saboti", "maili-saba", "kachibora", "cherangany"],
  "turkana": ["lodwar", "kakuma", "lokichogio", "lokitaung", "kalokol", "lokichar", "lorugum", "turkwel"],
  "uasin-gishu": ["eldoret", "eldoret-town", "burnt-forest", "turbo", "kapseret", "kesses", "mois-bridge", "ziwa", "ainabkoi", "kipkaren", "langas", "tulwet", "sosiani"],
  "vihiga": ["mbale", "luanda", "chavakali", "hamisi", "serem", "emuhaya", "majengo"],
  "wajir": ["wajir", "buna", "diff", "griftu", "habaswein", "eldas", "kutulo"],
  "west-pokot": ["kapenguria", "makutano", "chepareria", "ortum", "sigor", "kacheliba", "alale"]
};

const COUNTY_TITLES = {
  "baringo": "Baringo", "bomet": "Bomet", "bungoma": "Bungoma", "busia": "Busia",
  "elgeyo-marakwet": "Elgeyo-Marakwet", "embu": "Embu", "garissa": "Garissa", "homa-bay": "Homa Bay",
  "isiolo": "Isiolo", "kajiado": "Kajiado", "kakamega": "Kakamega", "kericho": "Kericho",
  "kiambu": "Kiambu", "kilifi": "Kilifi", "kirinyaga": "Kirinyaga", "kisii": "Kisii",
  "kisumu": "Kisumu", "kitui": "Kitui", "kwale": "Kwale", "laikipia": "Laikipia",
  "lamu": "Lamu", "machakos": "Machakos", "makueni": "Makueni", "mandera": "Mandera",
  "marsabit": "Marsabit", "meru": "Meru", "migori": "Migori", "mombasa": "Mombasa",
  "muranga": "Murang'a", "nairobi": "Nairobi", "nakuru": "Nakuru", "nandi": "Nandi",
  "narok": "Narok", "nyamira": "Nyamira", "nyandarua": "Nyandarua", "nyeri": "Nyeri",
  "samburu": "Samburu", "siaya": "Siaya", "taita-taveta": "Taita-Taveta", "tana-river": "Tana River",
  "tharaka-nithi": "Tharaka-Nithi", "trans-nzoia": "Trans Nzoia", "turkana": "Turkana",
  "uasin-gishu": "Uasin Gishu", "vihiga": "Vihiga", "wajir": "Wajir", "west-pokot": "West Pokot"
};

const LEGACY_COUNTY_ALIASES = { eldoret: "uasin-gishu", naivasha: "nakuru" };
const COUNTIES = Object.keys(COUNTY_TOWNS).sort((a, b) => COUNTY_TITLES[a].localeCompare(COUNTY_TITLES[b]));

const RESIDENTIAL_TYPES = ["apartment", "bedsitter", "maisonette", "studio", "bungalow", "townhouse", "villa"];
const LISTING_TYPES = [...RESIDENTIAL_TYPES, "office", "other"];
const LISTING_PURPOSES = ["rent", "sale", "short_stay"];
const OFFICE_SIZE_UNITS = ["sqft"];

module.exports = {
  COUNTY_TOWNS,
  COUNTY_TITLES,
  LEGACY_COUNTY_ALIASES,
  COUNTIES,
  RESIDENTIAL_TYPES,
  LISTING_TYPES,
  LISTING_PURPOSES,
  OFFICE_SIZE_UNITS
};
