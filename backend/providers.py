import random
from abc import ABC, abstractmethod

CITIES = {
    "Mumbai": {"code": "BOM", "station": "CSMT"},
    "Delhi": {"code": "DEL", "station": "NDLS"},
    "Bengaluru": {"code": "BLR", "station": "SBC"},
    "Goa": {"code": "GOI", "station": "MAO"},
    "Jaipur": {"code": "JAI", "station": "JP"},
    "Kochi": {"code": "COK", "station": "ERS"},
    "Dehradun": {"code": "DED", "station": "DDN"},
    "Chennai": {"code": "MAA", "station": "MAS"},
    "Kolkata": {"code": "CCU", "station": "KOAA"},
    "Hyderabad": {"code": "HYD", "station": "SC"},
    "Bali": {"code": "DPS", "station": "DPS"},
    "Manali": {"code": "KUU", "station": "JDNX"},
    "Udaipur": {"code": "UDR", "station": "UDZ"},
    "Varanasi": {"code": "VNS", "station": "BSB"},
}

AIRLINES = [("IndiGo", "6E"), ("Air India", "AI"), ("Vistara", "UK"), ("SpiceJet", "SG"), ("Akasa Air", "QP")]
TRAIN_NAMES = ["Rajdhani Express", "Shatabdi Express", "Vande Bharat Express", "Duronto Express", "Garib Rath", "Tejas Express", "Superfast Express"]
HOTEL_TEMPLATES = ["The {} Retreat", "{} Palace Hotel", "Casa {} Boutique", "{} Sands Resort", "Zostel {}", "The Fern {}", "{} Heritage Haveli", "Taj Vista {}"]
HOTEL_IMAGES = [
    "https://images.pexels.com/photos/2417842/pexels-photo-2417842.jpeg?auto=compress&w=800",
    "https://images.pexels.com/photos/33389169/pexels-photo-33389169.jpeg?auto=compress&w=800",
    "https://images.unsplash.com/photo-1559414059-34fe0a59e57a?w=800&q=80",
]
AMENITIES = ["Free WiFi", "Pool", "Breakfast included", "Spa", "Beach access", "Airport shuttle", "Rooftop bar", "Gym", "Pet friendly"]
CLASS_MULT = {"economy": 1.0, "premium_economy": 1.6, "business": 2.8, "first": 4.2}


def fmt_time(h, m):
    return f"{h:02d}:{m:02d}"


class BookingProvider(ABC):
    """Abstraction layer — swap with Amadeus/IRCTC/Booking.com providers via env config later."""

    @abstractmethod
    def search_flights(self, origin, destination, date, passengers, travel_class): ...

    @abstractmethod
    def search_trains(self, origin, destination, date, passengers, travel_class): ...

    @abstractmethod
    def search_hotels(self, destination, date, nights, rooms): ...


class MockProvider(BookingProvider):
    def search_flights(self, origin, destination, date, passengers, travel_class):
        rng = random.Random(f"F:{origin}:{destination}:{date}")
        o = CITIES.get(origin, {"code": origin[:3].upper()})
        d = CITIES.get(destination, {"code": destination[:3].upper()})
        mult = CLASS_MULT.get(travel_class, 1.0)
        results = []
        for i in range(rng.randint(6, 9)):
            airline, code = rng.choice(AIRLINES)
            dep_h, dep_m = rng.randint(5, 22), rng.choice([0, 10, 15, 25, 30, 40, 45, 55])
            duration = rng.randint(75, 280)
            arr_total = dep_h * 60 + dep_m + duration
            stops = rng.choices([0, 1], weights=[7, 3])[0]
            price = int(rng.randint(2800, 9800) * mult * (1.15 if stops else 1))
            results.append({
                "id": f"FL-{code}{rng.randint(100, 999)}-{i}",
                "airline": airline,
                "flight_no": f"{code}-{rng.randint(100, 999)}",
                "origin": origin, "origin_code": o["code"],
                "destination": destination, "destination_code": d["code"],
                "depart": fmt_time(dep_h, dep_m),
                "arrive": fmt_time((arr_total // 60) % 24, arr_total % 60),
                "duration_mins": duration,
                "stops": stops,
                "travel_class": travel_class,
                "price": price,
                "date": date,
            })
        return sorted(results, key=lambda x: x["price"])

    def search_trains(self, origin, destination, date, passengers, travel_class):
        rng = random.Random(f"T:{origin}:{destination}:{date}")
        o = CITIES.get(origin, {"station": origin[:4].upper()})
        d = CITIES.get(destination, {"station": destination[:4].upper()})
        results = []
        class_prices = {"sleeper": (450, 900), "3A": (1100, 2200), "2A": (1700, 3200), "1A": (2800, 5400)}
        lo, hi = class_prices.get(travel_class, (450, 900))
        for i in range(rng.randint(5, 8)):
            name = rng.choice(TRAIN_NAMES)
            dep_h, dep_m = rng.randint(4, 23), rng.choice([0, 5, 15, 20, 30, 35, 45, 50])
            duration = rng.randint(240, 1100)
            arr_total = dep_h * 60 + dep_m + duration
            results.append({
                "id": f"TR-{rng.randint(10000, 29999)}-{i}",
                "train_name": name,
                "train_no": str(rng.randint(10000, 29999)),
                "origin": origin, "origin_code": o["station"],
                "destination": destination, "destination_code": d["station"],
                "depart": fmt_time(dep_h, dep_m),
                "arrive": fmt_time((arr_total // 60) % 24, arr_total % 60),
                "duration_mins": duration,
                "travel_class": travel_class,
                "seats_left": rng.randint(2, 120),
                "price": rng.randint(lo, hi),
                "date": date,
            })
        return sorted(results, key=lambda x: x["price"])

    def search_hotels(self, destination, date, nights, rooms):
        rng = random.Random(f"H:{destination}:{date}")
        results = []
        for i in range(rng.randint(6, 9)):
            name = rng.choice(HOTEL_TEMPLATES).format(destination)
            rating = round(rng.uniform(3.4, 5.0), 1)
            price = int(rng.randint(1800, 14500) * (0.7 + rating / 8))
            results.append({
                "id": f"HT-{destination[:3].upper()}{rng.randint(100, 999)}-{i}",
                "name": name,
                "destination": destination,
                "rating": rating,
                "reviews": rng.randint(48, 2400),
                "price_per_night": price,
                "image": rng.choice(HOTEL_IMAGES),
                "amenities": rng.sample(AMENITIES, 4),
                "room_type": rng.choice(["Deluxe Room", "Sea View Suite", "Garden Villa", "Standard Room"]),
                "nights": nights,
                "rooms": rooms,
                "date": date,
            })
        return sorted(results, key=lambda x: -x["rating"])


provider: BookingProvider = MockProvider()
