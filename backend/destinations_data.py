DESTINATIONS = {
    "goa": {
        "slug": "goa", "name": "Goa", "country": "India",
        "tagline": "Sun, sand and susegad",
        "description": "India's beach capital — Portuguese quarters, spice markets, shack-lined shores and a nightlife that never blinks.",
        "image": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1400&q=80",
        "lat": 15.2993, "lng": 74.1240, "best_time": "November – February",
        "attractions": [
            {"name": "Baga Beach", "lat": 15.5553, "lng": 73.7517, "type": "beach"},
            {"name": "Fort Aguada", "lat": 15.4926, "lng": 73.7737, "type": "heritage"},
            {"name": "Basilica of Bom Jesus", "lat": 15.5009, "lng": 73.9116, "type": "heritage"},
            {"name": "Dudhsagar Falls", "lat": 15.3144, "lng": 74.3143, "type": "nature"},
            {"name": "Anjuna Flea Market", "lat": 15.5735, "lng": 73.7407, "type": "market"},
        ],
        "hubs": [
            {"name": "Goa Intl. Airport (GOI)", "type": "airport", "lat": 15.3808, "lng": 73.8314},
            {"name": "Madgaon Railway Station", "type": "rail", "lat": 15.2708, "lng": 73.9580},
            {"name": "Panaji KTC Bus Stand", "type": "bus", "lat": 15.4989, "lng": 73.8278},
        ],
        "transport": {
            "buses": [
                {"route": "Panaji ↔ Calangute", "operator": "Kadamba Transport", "frequency": "Every 15 min", "fare": "₹25–40"},
                {"route": "Madgaon ↔ Palolem", "operator": "Kadamba Transport", "frequency": "Every 30 min", "fare": "₹40–60"},
                {"route": "Panaji ↔ Old Goa", "operator": "KTC Shuttle", "frequency": "Every 20 min", "fare": "₹15–25"},
            ],
            "cabs": [
                {"name": "Goa Miles", "type": "Official app-based taxi", "deeplink": "https://www.goamiles.com", "note": "Government-backed, fixed fares"},
                {"name": "Uber", "type": "Ride hailing", "deeplink": "https://m.uber.com/looking", "note": "Available in North Goa"},
                {"name": "Ola", "type": "Ride hailing", "deeplink": "https://book.olacabs.com", "note": "Limited coverage"},
            ],
            "bike_rentals": [
                {"name": "Vespa Rentals Calangute", "price": "₹350–500/day", "location": "Calangute strip"},
                {"name": "Royal Riders Goa", "price": "₹600–1,200/day", "location": "Panaji & Baga"},
            ],
            "car_rentals": [
                {"name": "GoaCarRental.in", "price": "₹1,300–2,800/day", "location": "Airport pickup available"},
                {"name": "Zoomcar Goa", "price": "₹1,500–3,500/day", "location": "Self-drive, app based"},
            ],
        },
    },
    "bali": {
        "slug": "bali", "name": "Bali", "country": "Indonesia",
        "tagline": "Island of the gods",
        "description": "Emerald rice terraces, cliff temples, surf breaks and smoothie bowls — Bali is a mood, not just a place.",
        "image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=80",
        "lat": -8.4095, "lng": 115.1889, "best_time": "April – October",
        "attractions": [
            {"name": "Uluwatu Temple", "lat": -8.8291, "lng": 115.0849, "type": "heritage"},
            {"name": "Tegallalang Rice Terraces", "lat": -8.4312, "lng": 115.2777, "type": "nature"},
            {"name": "Seminyak Beach", "lat": -8.6913, "lng": 115.1571, "type": "beach"},
            {"name": "Ubud Monkey Forest", "lat": -8.5194, "lng": 115.2587, "type": "nature"},
            {"name": "Tanah Lot", "lat": -8.6212, "lng": 115.0868, "type": "heritage"},
        ],
        "hubs": [
            {"name": "Ngurah Rai Intl. Airport (DPS)", "type": "airport", "lat": -8.7482, "lng": 115.1672},
            {"name": "Ubung Bus Terminal", "type": "bus", "lat": -8.6229, "lng": 115.1993},
        ],
        "transport": {
            "buses": [
                {"route": "Kuta ↔ Ubud", "operator": "Kura-Kura Bus", "frequency": "Every 2 hrs", "fare": "Rp 80,000"},
                {"route": "Airport ↔ Seminyak", "operator": "Trans Metro Dewata", "frequency": "Every 30 min", "fare": "Rp 4,400"},
            ],
            "cabs": [
                {"name": "Gojek", "type": "Ride hailing + bike taxi", "deeplink": "https://www.gojek.com", "note": "Cheapest for short hops"},
                {"name": "Grab", "type": "Ride hailing", "deeplink": "https://www.grab.com/id/en", "note": "Cars & bikes"},
                {"name": "Bluebird Taxi", "type": "Metered taxi", "deeplink": "https://www.bluebirdgroup.com", "note": "Trusted metered cabs"},
            ],
            "bike_rentals": [
                {"name": "Bali Bike Rental", "price": "Rp 70k–100k/day", "location": "Canggu & Ubud"},
                {"name": "Scooter 4 Bali", "price": "Rp 60k–90k/day", "location": "Kuta, delivery available"},
            ],
            "car_rentals": [
                {"name": "Bali Car Hire (with driver)", "price": "Rp 600k–900k/day", "location": "Island-wide"},
                {"name": "TRAC Rental", "price": "Rp 450k–800k/day", "location": "Airport counter"},
            ],
        },
    },
    "rishikesh": {
        "slug": "rishikesh", "name": "Rishikesh", "country": "India",
        "tagline": "Yoga capital on the Ganges",
        "description": "Suspension bridges, river rafting, Beatles-era ashrams and Himalayan foothill sunsets in Uttarakhand.",
        "image": "https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?w=1400&q=80",
        "lat": 30.0869, "lng": 78.2676, "best_time": "September – November, February – May",
        "attractions": [
            {"name": "Laxman Jhula", "lat": 30.1259, "lng": 78.3295, "type": "heritage"},
            {"name": "Triveni Ghat", "lat": 30.1033, "lng": 78.2977, "type": "heritage"},
            {"name": "Neer Garh Waterfall", "lat": 30.1425, "lng": 78.3405, "type": "nature"},
            {"name": "Beatles Ashram", "lat": 30.1013, "lng": 78.3199, "type": "heritage"},
            {"name": "Shivpuri Rafting Point", "lat": 30.1554, "lng": 78.3854, "type": "adventure"},
        ],
        "hubs": [
            {"name": "Jolly Grant Airport (DED)", "type": "airport", "lat": 30.1897, "lng": 78.1804},
            {"name": "Rishikesh Railway Station", "type": "rail", "lat": 30.1077, "lng": 78.2851},
            {"name": "Rishikesh ISBT", "type": "bus", "lat": 30.1046, "lng": 78.2833},
        ],
        "transport": {
            "buses": [
                {"route": "Rishikesh ↔ Haridwar", "operator": "Uttarakhand Roadways", "frequency": "Every 20 min", "fare": "₹40–55"},
                {"route": "Rishikesh ↔ Dehradun", "operator": "Uttarakhand Roadways", "frequency": "Every 30 min", "fare": "₹60–80"},
            ],
            "cabs": [
                {"name": "Ola", "type": "Ride hailing", "deeplink": "https://book.olacabs.com", "note": "Available from Dehradun side"},
                {"name": "Uber", "type": "Ride hailing", "deeplink": "https://m.uber.com/looking", "note": "Limited, airport transfers"},
                {"name": "Local shared autos", "type": "Shared tuk-tuk", "deeplink": "", "note": "₹10–30 fixed routes"},
            ],
            "bike_rentals": [
                {"name": "Himalayan Bike Rentals", "price": "₹500–1,500/day", "location": "Tapovan"},
                {"name": "Scooty Point Rishikesh", "price": "₹300–450/day", "location": "Near Ram Jhula"},
            ],
            "car_rentals": [
                {"name": "Garhwal Taxi Union", "price": "₹2,000–3,500/day", "location": "ISBT stand"},
                {"name": "Savaari Car Rental", "price": "₹1,800–3,200/day", "location": "Online booking"},
            ],
        },
    },
    "jaipur": {
        "slug": "jaipur", "name": "Jaipur", "country": "India",
        "tagline": "The pink city",
        "description": "Amber forts, bazaars stacked with block prints and lassi in clay cups — royal Rajasthan at its most photogenic.",
        "image": "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1400&q=80",
        "lat": 26.9124, "lng": 75.7873, "best_time": "October – March",
        "attractions": [
            {"name": "Amber Fort", "lat": 26.9855, "lng": 75.8513, "type": "heritage"},
            {"name": "Hawa Mahal", "lat": 26.9239, "lng": 75.8267, "type": "heritage"},
            {"name": "City Palace", "lat": 26.9258, "lng": 75.8237, "type": "heritage"},
            {"name": "Jal Mahal", "lat": 26.9535, "lng": 75.8463, "type": "heritage"},
            {"name": "Johari Bazaar", "lat": 26.9186, "lng": 75.8235, "type": "market"},
        ],
        "hubs": [
            {"name": "Jaipur Intl. Airport (JAI)", "type": "airport", "lat": 26.8242, "lng": 75.8122},
            {"name": "Jaipur Junction", "type": "rail", "lat": 26.9196, "lng": 75.7880},
            {"name": "Sindhi Camp Bus Stand", "type": "bus", "lat": 26.9239, "lng": 75.7985},
        ],
        "transport": {
            "buses": [
                {"route": "City circuit (Low-floor AC)", "operator": "JCTSL", "frequency": "Every 10 min", "fare": "₹15–35"},
                {"route": "Jaipur ↔ Amber Fort", "operator": "RSRTC", "frequency": "Every 20 min", "fare": "₹25"},
            ],
            "cabs": [
                {"name": "Uber", "type": "Ride hailing", "deeplink": "https://m.uber.com/looking", "note": "Full city coverage"},
                {"name": "Ola", "type": "Ride hailing", "deeplink": "https://book.olacabs.com", "note": "Autos & cabs"},
                {"name": "Pink City Rickshaw", "type": "E-rickshaw tours", "deeplink": "https://pinkcityrickshawcompany.com", "note": "Women-driven heritage tours"},
            ],
            "bike_rentals": [
                {"name": "Rentomo Jaipur", "price": "₹350–600/day", "location": "MI Road"},
                {"name": "OnTrack Scooters", "price": "₹300–500/day", "location": "Multiple pickup points"},
            ],
            "car_rentals": [
                {"name": "Zoomcar Jaipur", "price": "₹1,400–3,000/day", "location": "Self-drive"},
                {"name": "Rajasthan Tours Cab", "price": "₹2,200–4,000/day", "location": "With driver, fort circuit"},
            ],
        },
    },
    "manali": {
        "slug": "manali", "name": "Manali", "country": "India",
        "tagline": "Himalayan basecamp",
        "description": "Pine forests, snow passes and old-village cafés — the gateway to Solang, Sissu and the high Himalaya.",
        "image": "https://images.pexels.com/photos/34827195/pexels-photo-34827195.jpeg?auto=compress&w=1400",
        "lat": 32.2396, "lng": 77.1887, "best_time": "March – June, October – February (snow)",
        "attractions": [
            {"name": "Solang Valley", "lat": 32.3079, "lng": 77.1561, "type": "adventure"},
            {"name": "Hadimba Temple", "lat": 32.2483, "lng": 77.1806, "type": "heritage"},
            {"name": "Old Manali", "lat": 32.2569, "lng": 77.1782, "type": "market"},
            {"name": "Jogini Waterfall", "lat": 32.2735, "lng": 77.1911, "type": "nature"},
            {"name": "Atal Tunnel North Portal", "lat": 32.4046, "lng": 77.2231, "type": "adventure"},
        ],
        "hubs": [
            {"name": "Bhuntar Airport (KUU)", "type": "airport", "lat": 31.8763, "lng": 77.1544},
            {"name": "Manali Bus Stand", "type": "bus", "lat": 32.2432, "lng": 77.1892},
        ],
        "transport": {
            "buses": [
                {"route": "Manali ↔ Solang Valley", "operator": "HRTC", "frequency": "Every 45 min", "fare": "₹30–50"},
                {"route": "Manali ↔ Naggar Castle", "operator": "HRTC", "frequency": "Hourly", "fare": "₹35"},
            ],
            "cabs": [
                {"name": "Manali Taxi Union", "type": "Fixed-fare taxis", "deeplink": "", "note": "Stand near mall road"},
                {"name": "Ola (Kullu belt)", "type": "Ride hailing", "deeplink": "https://book.olacabs.com", "note": "Patchy in high season"},
            ],
            "bike_rentals": [
                {"name": "Himalayan Riders", "price": "₹1,200–2,500/day (RE 350/500)", "location": "Mall Road"},
                {"name": "Manali Scooty Rentals", "price": "₹500–800/day", "location": "Old Manali bridge"},
            ],
            "car_rentals": [
                {"name": "Kullu-Manali Cabs", "price": "₹2,500–4,500/day", "location": "SUVs for Atal Tunnel/Sissu"},
                {"name": "Savaari Manali", "price": "₹2,200–3,800/day", "location": "Online booking"},
            ],
        },
    },
    "kochi": {
        "slug": "kochi", "name": "Kochi", "country": "India",
        "tagline": "Queen of the Arabian Sea",
        "description": "Chinese fishing nets, colonial Fort Kochi lanes, backwater ferries and Kerala's best seafood — all in one port city.",
        "image": "https://images.unsplash.com/photo-1426086800127-2601510ca027?w=1400&q=80",
        "lat": 9.9312, "lng": 76.2673, "best_time": "October – February",
        "attractions": [
            {"name": "Fort Kochi Beach", "lat": 9.9658, "lng": 76.2422, "type": "beach"},
            {"name": "Chinese Fishing Nets", "lat": 9.9679, "lng": 76.2426, "type": "heritage"},
            {"name": "Mattancherry Palace", "lat": 9.9580, "lng": 76.2593, "type": "heritage"},
            {"name": "Marine Drive", "lat": 9.9769, "lng": 76.2760, "type": "nature"},
            {"name": "Jew Town & Spice Market", "lat": 9.9569, "lng": 76.2599, "type": "market"},
        ],
        "hubs": [
            {"name": "Cochin Intl. Airport (COK)", "type": "airport", "lat": 10.1520, "lng": 76.3919},
            {"name": "Ernakulam Junction", "type": "rail", "lat": 9.9698, "lng": 76.2905},
            {"name": "Vytilla Mobility Hub", "type": "bus", "lat": 9.9646, "lng": 76.3192},
        ],
        "transport": {
            "buses": [
                {"route": "Kochi Metro (Aluva ↔ Tripunithura)", "operator": "KMRL", "frequency": "Every 8 min", "fare": "₹10–60"},
                {"route": "Fort Kochi ↔ Ernakulam Ferry", "operator": "SWTD", "frequency": "Every 30 min", "fare": "₹6–14"},
            ],
            "cabs": [
                {"name": "Uber", "type": "Ride hailing", "deeplink": "https://m.uber.com/looking", "note": "Full coverage"},
                {"name": "Ola", "type": "Ride hailing", "deeplink": "https://book.olacabs.com", "note": "Autos & cabs"},
            ],
            "bike_rentals": [
                {"name": "Rento Kochi", "price": "₹300–500/day", "location": "Ernakulam South"},
                {"name": "Freedom Riders", "price": "₹400–900/day", "location": "Fort Kochi"},
            ],
            "car_rentals": [
                {"name": "Zoomcar Kochi", "price": "₹1,300–3,000/day", "location": "Self-drive"},
                {"name": "Kerala Cabz", "price": "₹2,000–3,600/day", "location": "With driver, backwater day trips"},
            ],
        },
    },
    "agra": {
        "slug": "agra", "name": "Agra", "country": "India",
        "tagline": "Home of the Taj Mahal",
        "description": "The marble crown of India — Mughal masterpieces, rooftop chai with Taj views and kebabs that outlived an empire.",
        "image": "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1400&q=80",
        "lat": 27.1767, "lng": 78.0081, "best_time": "October – March",
        "attractions": [
            {"name": "Taj Mahal", "lat": 27.1751, "lng": 78.0421, "type": "heritage"},
            {"name": "Agra Fort", "lat": 27.1795, "lng": 78.0211, "type": "heritage"},
            {"name": "Mehtab Bagh", "lat": 27.1799, "lng": 78.0428, "type": "nature"},
            {"name": "Itmad-ud-Daulah", "lat": 27.1929, "lng": 78.0311, "type": "heritage"},
            {"name": "Kinari Bazaar", "lat": 27.1830, "lng": 78.0140, "type": "market"},
        ],
        "hubs": [
            {"name": "Agra Cantt Railway Station", "type": "rail", "lat": 27.1590, "lng": 77.9930},
            {"name": "ISBT Agra", "type": "bus", "lat": 27.2145, "lng": 78.0038},
        ],
        "transport": {
            "buses": [
                {"route": "Agra Cantt ↔ Taj East Gate", "operator": "UPSRTC City", "frequency": "Every 20 min", "fare": "₹15–30"},
                {"route": "ISBT ↔ Fatehpur Sikri", "operator": "UPSRTC", "frequency": "Every 45 min", "fare": "₹60–90"},
            ],
            "cabs": [
                {"name": "Uber", "type": "Ride hailing", "deeplink": "https://m.uber.com/looking", "note": "Full coverage"},
                {"name": "Ola", "type": "Ride hailing", "deeplink": "https://book.olacabs.com", "note": "Autos & cabs"},
            ],
            "bike_rentals": [
                {"name": "Agra Bike Rentals", "price": "₹350–600/day", "location": "Taj Ganj"},
            ],
            "car_rentals": [
                {"name": "Taj Day Cabs", "price": "₹1,800–3,200/day", "location": "With driver, Fatehpur Sikri trips"},
            ],
        },
    },
    "leh": {
        "slug": "leh", "name": "Leh–Ladakh", "country": "India",
        "tagline": "The highest road trip on Earth",
        "description": "Lunar valleys, prayer flags, turquoise Pangong and mountain passes that make every biker's bucket list.",
        "image": "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=1400&q=80",
        "lat": 34.1526, "lng": 77.5771, "best_time": "June – September",
        "attractions": [
            {"name": "Pangong Tso", "lat": 33.7590, "lng": 78.6674, "type": "nature"},
            {"name": "Thiksey Monastery", "lat": 34.0557, "lng": 77.6663, "type": "heritage"},
            {"name": "Khardung La Pass", "lat": 34.2786, "lng": 77.6043, "type": "nature"},
            {"name": "Shanti Stupa", "lat": 34.1728, "lng": 77.5735, "type": "heritage"},
            {"name": "Leh Main Bazaar", "lat": 34.1642, "lng": 77.5850, "type": "market"},
        ],
        "hubs": [
            {"name": "Kushok Bakula Rimpochee Airport (IXL)", "type": "airport", "lat": 34.1359, "lng": 77.5465},
            {"name": "Leh Bus Stand", "type": "bus", "lat": 34.1580, "lng": 77.5860},
        ],
        "transport": {
            "buses": [
                {"route": "Leh ↔ Thiksey ↔ Hemis", "operator": "JKSRTC", "frequency": "2–3 daily", "fare": "₹40–80"},
                {"route": "Leh ↔ Nubra Valley", "operator": "Shared tempo", "frequency": "Morning departures", "fare": "₹400–600"},
            ],
            "cabs": [
                {"name": "Ladakh Taxi Union", "type": "Fixed-rate taxis", "deeplink": "https://ladakhtaxiunion.com", "note": "Official rate card, book a day ahead"},
            ],
            "bike_rentals": [
                {"name": "Himalayan Riders Leh", "price": "₹1,200–1,800/day", "location": "Fort Road — RE Himalayans"},
                {"name": "Ladakh Bikes", "price": "₹900–1,500/day", "location": "Main Bazaar"},
            ],
            "car_rentals": [
                {"name": "Leh 4x4 Rentals", "price": "₹3,500–5,500/day", "location": "Innova/XUV with driver"},
            ],
        },
    },
    "paris": {
        "slug": "paris", "name": "Paris", "country": "France",
        "tagline": "The city of light",
        "description": "Golden-hour Seine walks, buttery croissants, world-class art and that tower you'll photograph forty times anyway.",
        "image": "https://images.pexels.com/photos/25409586/pexels-photo-25409586.jpeg?auto=compress&w=1400",
        "lat": 48.8566, "lng": 2.3522, "best_time": "April – June, Sept – Oct",
        "attractions": [
            {"name": "Eiffel Tower", "lat": 48.8584, "lng": 2.2945, "type": "heritage"},
            {"name": "Louvre Museum", "lat": 48.8606, "lng": 2.3376, "type": "heritage"},
            {"name": "Montmartre & Sacré-Cœur", "lat": 48.8867, "lng": 2.3431, "type": "heritage"},
            {"name": "Luxembourg Gardens", "lat": 48.8462, "lng": 2.3371, "type": "nature"},
            {"name": "Marché Bastille", "lat": 48.8555, "lng": 2.3708, "type": "market"},
        ],
        "hubs": [
            {"name": "Charles de Gaulle Airport (CDG)", "type": "airport", "lat": 49.0097, "lng": 2.5479},
            {"name": "Gare du Nord", "type": "rail", "lat": 48.8809, "lng": 2.3553},
        ],
        "transport": {
            "buses": [
                {"route": "Métro (16 lines, city-wide)", "operator": "RATP", "frequency": "Every 2–5 min", "fare": "€2.15/ride"},
                {"route": "RER B (CDG ↔ city)", "operator": "RATP/SNCF", "frequency": "Every 10 min", "fare": "€11.80"},
            ],
            "cabs": [
                {"name": "Uber", "type": "Ride hailing", "deeplink": "https://m.uber.com/looking", "note": "Full coverage"},
                {"name": "G7 Taxi", "type": "Official taxi app", "deeplink": "https://www.g7.fr", "note": "Fixed airport fares"},
            ],
            "bike_rentals": [
                {"name": "Vélib' Métropole", "price": "€3–10/day", "location": "1,400 docking stations"},
            ],
            "car_rentals": [
                {"name": "Europcar", "price": "€45–90/day", "location": "CDG & city — you likely won't need one"},
            ],
        },
    },
    "tokyo": {
        "slug": "tokyo", "name": "Tokyo", "country": "Japan",
        "tagline": "Neon nights, ancient shrines",
        "description": "Ramen counters, cherry blossoms, vending-machine everything and the world's most punctual chaos.",
        "image": "https://images.pexels.com/photos/1510610/pexels-photo-1510610.jpeg?auto=compress&w=1400",
        "lat": 35.6762, "lng": 139.6503, "best_time": "March – May, Oct – Nov",
        "attractions": [
            {"name": "Senso-ji Temple", "lat": 35.7148, "lng": 139.7967, "type": "heritage"},
            {"name": "Shibuya Crossing", "lat": 35.6595, "lng": 139.7005, "type": "heritage"},
            {"name": "Meiji Shrine", "lat": 35.6764, "lng": 139.6993, "type": "heritage"},
            {"name": "Ueno Park", "lat": 35.7156, "lng": 139.7745, "type": "nature"},
            {"name": "Tsukiji Outer Market", "lat": 35.6654, "lng": 139.7707, "type": "market"},
        ],
        "hubs": [
            {"name": "Haneda Airport (HND)", "type": "airport", "lat": 35.5494, "lng": 139.7798},
            {"name": "Tokyo Station", "type": "rail", "lat": 35.6812, "lng": 139.7671},
        ],
        "transport": {
            "buses": [
                {"route": "Yamanote Line (city loop)", "operator": "JR East", "frequency": "Every 2–4 min", "fare": "¥150–210"},
                {"route": "Tokyo Metro (9 lines)", "operator": "Tokyo Metro", "frequency": "Every 3–5 min", "fare": "¥180–330"},
            ],
            "cabs": [
                {"name": "GO Taxi", "type": "Taxi app", "deeplink": "https://go.goinc.jp", "note": "Japan's biggest taxi app"},
                {"name": "Uber", "type": "Ride hailing", "deeplink": "https://m.uber.com/looking", "note": "Premium pricing"},
            ],
            "bike_rentals": [
                {"name": "Docomo Bike Share", "price": "¥165/30min", "location": "Red bikes, city-wide docks"},
            ],
            "car_rentals": [
                {"name": "Toyota Rent a Car", "price": "¥7,000–12,000/day", "location": "IDP required — trains beat cars here"},
            ],
        },
    },
    "santorini": {
        "slug": "santorini", "name": "Santorini", "country": "Greece",
        "tagline": "Blue domes over the caldera",
        "description": "Cliff-hung white villages, wine from volcanic soil and the Aegean's most famous sunset at Oia.",
        "image": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=80",
        "lat": 36.3932, "lng": 25.4615, "best_time": "May – June, Sept – Oct",
        "attractions": [
            {"name": "Oia Sunset Point", "lat": 36.4618, "lng": 25.3753, "type": "nature"},
            {"name": "Fira Old Town", "lat": 36.4166, "lng": 25.4326, "type": "heritage"},
            {"name": "Red Beach", "lat": 36.3480, "lng": 25.3944, "type": "beach"},
            {"name": "Akrotiri Ruins", "lat": 36.3514, "lng": 25.4036, "type": "heritage"},
            {"name": "Santo Wines Winery", "lat": 36.3830, "lng": 25.4480, "type": "market"},
        ],
        "hubs": [
            {"name": "Santorini Airport (JTR)", "type": "airport", "lat": 36.3992, "lng": 25.4793},
            {"name": "Athinios Ferry Port", "type": "bus", "lat": 36.3846, "lng": 25.4287},
        ],
        "transport": {
            "buses": [
                {"route": "Fira ↔ Oia", "operator": "KTEL Santorini", "frequency": "Every 30 min", "fare": "€1.60–2"},
                {"route": "Fira ↔ Perissa Beach", "operator": "KTEL Santorini", "frequency": "Every 40 min", "fare": "€2–2.50"},
            ],
            "cabs": [
                {"name": "Santorini Taxi", "type": "Island taxis (~35 total!)", "deeplink": "https://santorini-taxi.gr", "note": "Pre-book in peak season"},
            ],
            "bike_rentals": [
                {"name": "Moto Adam", "price": "€20–35/day", "location": "Fira — ATVs & scooters"},
            ],
            "car_rentals": [
                {"name": "Kosmos Rent a Car", "price": "€40–70/day", "location": "Airport & Fira"},
            ],
        },
    },
    "dubai": {
        "slug": "dubai", "name": "Dubai", "country": "UAE",
        "tagline": "Desert futurism",
        "description": "Sky-piercing towers, gold souks, dune bashing at dusk and brunches that count as cardio.",
        "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=80",
        "lat": 25.2048, "lng": 55.2708, "best_time": "November – March",
        "attractions": [
            {"name": "Burj Khalifa", "lat": 25.1972, "lng": 55.2744, "type": "heritage"},
            {"name": "Dubai Mall & Fountain", "lat": 25.1985, "lng": 55.2796, "type": "market"},
            {"name": "Gold Souk, Deira", "lat": 25.2697, "lng": 55.2977, "type": "market"},
            {"name": "Jumeirah Beach", "lat": 25.2048, "lng": 55.2382, "type": "beach"},
            {"name": "Al Fahidi Historic District", "lat": 25.2637, "lng": 55.2972, "type": "heritage"},
        ],
        "hubs": [
            {"name": "Dubai Intl. Airport (DXB)", "type": "airport", "lat": 25.2532, "lng": 55.3657},
            {"name": "BurJuman Metro Station", "type": "rail", "lat": 25.2554, "lng": 55.3047},
        ],
        "transport": {
            "buses": [
                {"route": "Metro Red Line (Airport ↔ Marina)", "operator": "RTA", "frequency": "Every 4–7 min", "fare": "AED 3–7.5"},
                {"route": "Abra across Dubai Creek", "operator": "RTA", "frequency": "Continuous", "fare": "AED 1"},
            ],
            "cabs": [
                {"name": "Careem", "type": "Ride hailing", "deeplink": "https://www.careem.com", "note": "Region's favourite"},
                {"name": "Uber", "type": "Ride hailing", "deeplink": "https://m.uber.com/looking", "note": "Full coverage"},
            ],
            "bike_rentals": [
                {"name": "Careem BIKE", "price": "AED 20/day", "location": "Docked, Downtown & Marina"},
            ],
            "car_rentals": [
                {"name": "Hertz Dubai", "price": "AED 120–250/day", "location": "Airport & malls"},
            ],
        },
    },
    "bangkok": {
        "slug": "bangkok", "name": "Bangkok", "country": "Thailand",
        "tagline": "Street food capital of the world",
        "description": "Glittering temples, floating markets, tuk-tuk sprints and pad thai at 2am — the city that never slows down.",
        "image": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1400&q=80",
        "lat": 13.7563, "lng": 100.5018, "best_time": "November – February",
        "attractions": [
            {"name": "Grand Palace & Wat Phra Kaew", "lat": 13.7500, "lng": 100.4913, "type": "heritage"},
            {"name": "Wat Arun", "lat": 13.7437, "lng": 100.4889, "type": "heritage"},
            {"name": "Chatuchak Weekend Market", "lat": 13.7999, "lng": 100.5502, "type": "market"},
            {"name": "Khao San Road", "lat": 13.7588, "lng": 100.4972, "type": "market"},
            {"name": "Lumphini Park", "lat": 13.7314, "lng": 100.5417, "type": "nature"},
        ],
        "hubs": [
            {"name": "Suvarnabhumi Airport (BKK)", "type": "airport", "lat": 13.6900, "lng": 100.7501},
            {"name": "Siam BTS Interchange", "type": "rail", "lat": 13.7456, "lng": 100.5340},
        ],
        "transport": {
            "buses": [
                {"route": "BTS Skytrain (2 lines)", "operator": "BTS", "frequency": "Every 3–6 min", "fare": "฿17–62"},
                {"route": "Chao Phraya Express Boat", "operator": "CPEX", "frequency": "Every 15 min", "fare": "฿16–33"},
            ],
            "cabs": [
                {"name": "Grab", "type": "Ride hailing", "deeplink": "https://www.grab.com", "note": "Cars, bikes & food"},
                {"name": "Bolt", "type": "Ride hailing", "deeplink": "https://bolt.eu", "note": "Often cheapest"},
            ],
            "bike_rentals": [
                {"name": "Anywheel Bangkok", "price": "฿20–60/day", "location": "Dockless, central districts"},
            ],
            "car_rentals": [
                {"name": "Thai Rent a Car", "price": "฿900–1,800/day", "location": "BKK airport — traffic is legendary"},
            ],
        },
    },
    "singapore": {
        "slug": "singapore", "name": "Singapore", "country": "Singapore",
        "tagline": "The garden city",
        "description": "Supertrees that glow, hawker stalls with Michelin stars and a skyline pool you've seen in every reel.",
        "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1400&q=80",
        "lat": 1.3521, "lng": 103.8198, "best_time": "February – April",
        "attractions": [
            {"name": "Gardens by the Bay", "lat": 1.2816, "lng": 103.8636, "type": "nature"},
            {"name": "Marina Bay Sands SkyPark", "lat": 1.2834, "lng": 103.8607, "type": "heritage"},
            {"name": "Sentosa Island", "lat": 1.2494, "lng": 103.8303, "type": "beach"},
            {"name": "Maxwell Food Centre", "lat": 1.2803, "lng": 103.8451, "type": "market"},
            {"name": "Little India", "lat": 1.3066, "lng": 103.8518, "type": "market"},
        ],
        "hubs": [
            {"name": "Changi Airport (SIN)", "type": "airport", "lat": 1.3644, "lng": 103.9915},
            {"name": "Dhoby Ghaut MRT Interchange", "type": "rail", "lat": 1.2993, "lng": 103.8455},
        ],
        "transport": {
            "buses": [
                {"route": "MRT (6 lines, city-wide)", "operator": "SMRT/SBS", "frequency": "Every 2–5 min", "fare": "S$1.19–2.37"},
                {"route": "Changi ↔ City (EW Line)", "operator": "SMRT", "frequency": "Every 7 min", "fare": "S$2.10"},
            ],
            "cabs": [
                {"name": "Grab", "type": "Ride hailing", "deeplink": "https://www.grab.com", "note": "Full coverage"},
                {"name": "ComfortDelGro", "type": "Taxi app", "deeplink": "https://www.cdgtaxi.com.sg", "note": "Metered taxis"},
            ],
            "bike_rentals": [
                {"name": "Anywheel", "price": "S$1–5/day", "location": "Dockless, island-wide"},
            ],
            "car_rentals": [
                {"name": "Tribecar", "price": "S$8–15/hour", "location": "Hourly self-drive — MRT usually wins"},
            ],
        },
    },
    "phuket": {
        "slug": "phuket", "name": "Phuket", "country": "Thailand",
        "tagline": "Andaman island escape",
        "description": "Long-tail boats to hidden lagoons, limestone cliffs, beach clubs and island-hopping worth every sunburn.",
        "image": "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1400&q=80",
        "lat": 7.8804, "lng": 98.3923, "best_time": "November – April",
        "attractions": [
            {"name": "Patong Beach", "lat": 7.8965, "lng": 98.2963, "type": "beach"},
            {"name": "Big Buddha", "lat": 7.8276, "lng": 98.3128, "type": "heritage"},
            {"name": "Phi Phi Islands (day trip)", "lat": 7.7407, "lng": 98.7784, "type": "nature"},
            {"name": "Old Phuket Town", "lat": 7.8846, "lng": 98.3875, "type": "heritage"},
            {"name": "Phuket Weekend Market", "lat": 7.8724, "lng": 98.3696, "type": "market"},
        ],
        "hubs": [
            {"name": "Phuket Intl. Airport (HKT)", "type": "airport", "lat": 8.1132, "lng": 98.3169},
            {"name": "Phuket Bus Terminal 2", "type": "bus", "lat": 7.9096, "lng": 98.3849},
        ],
        "transport": {
            "buses": [
                {"route": "Airport ↔ Patong Smart Bus", "operator": "Phuket Smart Bus", "frequency": "Every 60 min", "fare": "฿100–170"},
                {"route": "Phuket Town ↔ Beaches (songthaew)", "operator": "Local blue bus", "frequency": "Every 30 min", "fare": "฿30–40"},
            ],
            "cabs": [
                {"name": "Grab", "type": "Ride hailing", "deeplink": "https://www.grab.com", "note": "Watch surge at beaches"},
                {"name": "Bolt", "type": "Ride hailing", "deeplink": "https://bolt.eu", "note": "Usually cheaper"},
            ],
            "bike_rentals": [
                {"name": "Patong Scooter Rental", "price": "฿250–400/day", "location": "Everywhere — helmet on!"},
            ],
            "car_rentals": [
                {"name": "Avis Phuket", "price": "฿1,000–2,000/day", "location": "Airport pickup"},
            ],
        },
    },
    "rome": {
        "slug": "rome", "name": "Rome", "country": "Italy",
        "tagline": "The eternal city",
        "description": "Two thousand years of ruins, carbonara done right and fountains worth every tossed coin.",
        "image": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1400&q=80",
        "lat": 41.9028, "lng": 12.4964, "best_time": "April – June, Sept – Oct",
        "attractions": [
            {"name": "Colosseum", "lat": 41.8902, "lng": 12.4922, "type": "heritage"},
            {"name": "Trevi Fountain", "lat": 41.9009, "lng": 12.4833, "type": "heritage"},
            {"name": "Vatican Museums", "lat": 41.9065, "lng": 12.4536, "type": "heritage"},
            {"name": "Villa Borghese Gardens", "lat": 41.9142, "lng": 12.4921, "type": "nature"},
            {"name": "Campo de' Fiori Market", "lat": 41.8956, "lng": 12.4722, "type": "market"},
        ],
        "hubs": [
            {"name": "Fiumicino Airport (FCO)", "type": "airport", "lat": 41.8003, "lng": 12.2389},
            {"name": "Roma Termini", "type": "rail", "lat": 41.9010, "lng": 12.5011},
        ],
        "transport": {
            "buses": [
                {"route": "Metro A/B/C", "operator": "ATAC", "frequency": "Every 4–8 min", "fare": "€1.50/100min"},
                {"route": "Leonardo Express (FCO ↔ Termini)", "operator": "Trenitalia", "frequency": "Every 15 min", "fare": "€14"},
            ],
            "cabs": [
                {"name": "FreeNow", "type": "Taxi app", "deeplink": "https://www.free-now.com", "note": "Official white taxis"},
                {"name": "Uber", "type": "Ride hailing", "deeplink": "https://m.uber.com/looking", "note": "Black/Van only"},
            ],
            "bike_rentals": [
                {"name": "Lime / Dott e-scooters", "price": "€0.25/min", "location": "Dockless, centro storico"},
            ],
            "car_rentals": [
                {"name": "Maggiore", "price": "€40–80/day", "location": "Termini — ZTL zones, beware!"},
            ],
        },
    },
    "istanbul": {
        "slug": "istanbul", "name": "Istanbul", "country": "Türkiye",
        "tagline": "Where two continents meet",
        "description": "Minarets at sunset, bazaars older than nations, Bosphorus ferries and baklava that ruins all other desserts.",
        "image": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1400&q=80",
        "lat": 41.0082, "lng": 28.9784, "best_time": "April – May, Sept – Nov",
        "attractions": [
            {"name": "Hagia Sophia", "lat": 41.0086, "lng": 28.9802, "type": "heritage"},
            {"name": "Blue Mosque", "lat": 41.0054, "lng": 28.9768, "type": "heritage"},
            {"name": "Grand Bazaar", "lat": 41.0108, "lng": 28.9680, "type": "market"},
            {"name": "Bosphorus Ferry Ride", "lat": 41.0201, "lng": 29.0027, "type": "nature"},
            {"name": "Galata Tower", "lat": 41.0256, "lng": 28.9744, "type": "heritage"},
        ],
        "hubs": [
            {"name": "Istanbul Airport (IST)", "type": "airport", "lat": 41.2753, "lng": 28.7519},
            {"name": "Eminönü Ferry Terminal", "type": "bus", "lat": 41.0176, "lng": 28.9709},
        ],
        "transport": {
            "buses": [
                {"route": "T1 Tram (Sultanahmet ↔ Kabataş)", "operator": "Metro Istanbul", "frequency": "Every 5 min", "fare": "₺27"},
                {"route": "Bosphorus Ferries", "operator": "Şehir Hatları", "frequency": "Every 20–30 min", "fare": "₺27–40"},
            ],
            "cabs": [
                {"name": "BiTaksi", "type": "Taxi app", "deeplink": "https://www.bitaksi.com", "note": "Istanbul's favourite"},
                {"name": "Uber", "type": "Ride hailing", "deeplink": "https://m.uber.com/looking", "note": "Works with yellow taxis"},
            ],
            "bike_rentals": [
                {"name": "İSBİKE", "price": "₺15–40/day", "location": "Docked, coastal paths"},
            ],
            "car_rentals": [
                {"name": "Garenta", "price": "₺800–1,500/day", "location": "IST airport — ferries are more fun"},
            ],
        },
    },
}
