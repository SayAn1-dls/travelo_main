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
}
