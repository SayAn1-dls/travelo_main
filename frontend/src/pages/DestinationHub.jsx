import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bus, Taxi, Scooter, Car, ChatCircleDots, ArrowSquareOut, MapPin, AirplaneTilt } from "@phosphor-icons/react";

const pin = (color) =>
  L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
  });

const attractionPin = pin("#FF5A36");
const hubPin = pin("#0A2540");

export default function DestinationHub() {
  const { slug } = useParams();
  const [dest, setDest] = useState(null);

  useEffect(() => {
    setDest(null);
    api.get(`/destinations/${slug}`).then((r) => setDest(r.data)).catch(() => {});
  }, [slug]);

  if (!dest) return <div className="max-w-5xl mx-auto px-5 py-20 text-center text-muted-foreground">Loading destination…</div>;

  const t = dest.transport;

  return (
    <div>
      <section className="relative h-[46vh] min-h-[320px] overflow-hidden">
        <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 max-w-7xl mx-auto px-5 sm:px-8 pb-8 text-white">
          <p className="text-xs uppercase tracking-[0.25em] text-white/70">{dest.country} · Best time: {dest.best_time}</p>
          <h1 className="font-display text-4xl sm:text-6xl font-bold mt-1" data-testid="destination-title">{dest.name}</h1>
          <p className="text-white/85 mt-1 max-w-lg text-sm sm:text-base">{dest.description}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Getting around {dest.name}</h2>
            <p className="text-muted-foreground text-sm mt-1">Transport hubs, attractions and local rides — all in one map.</p>
          </div>
          <Button
            data-testid="ask-tara-btn"
            onClick={() => window.dispatchEvent(new CustomEvent("travelo-open-chat"))}
            className="rounded-full bg-[#0A2540] hover:bg-[#123B66] shrink-0"
          >
            <ChatCircleDots size={18} className="mr-2" weight="duotone" /> Ask Tara about {dest.name}
          </Button>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-[#E5E4E0]" data-testid="destination-map">
            <MapContainer center={[dest.lat, dest.lng]} zoom={11} style={{ height: "440px", width: "100%" }} scrollWheelZoom={false}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {dest.attractions.map((a) => (
                <Marker key={a.name} position={[a.lat, a.lng]} icon={attractionPin}>
                  <Popup><b>{a.name}</b><br />{a.type}</Popup>
                </Marker>
              ))}
              {dest.hubs.map((h) => (
                <Marker key={h.name} position={[h.lat, h.lng]} icon={hubPin}>
                  <Popup><b>{h.name}</b><br />{h.type}</Popup>
                </Marker>
              ))}
            </MapContainer>
            <div className="bg-white px-4 py-2.5 flex gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#FF5A36]" /> Attractions</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#0A2540]" /> Transport hubs</span>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-display text-lg font-bold flex items-center gap-2"><MapPin size={18} weight="duotone" className="text-[#FF5A36]" /> Don't miss</h3>
            {dest.attractions.map((a) => (
              <div key={a.name} className="bg-white border border-[#E5E4E0] rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="font-medium text-sm">{a.name}</span>
                <Badge variant="outline" className="text-[10px] capitalize">{a.type}</Badge>
              </div>
            ))}
            <h3 className="font-display text-lg font-bold flex items-center gap-2 pt-2"><AirplaneTilt size={18} weight="duotone" className="text-[#0A2540]" /> Arrival hubs</h3>
            {dest.hubs.map((h) => (
              <div key={h.name} className="bg-white border border-[#E5E4E0] rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="font-medium text-sm">{h.name}</span>
                <Badge variant="outline" className="text-[10px] capitalize">{h.type}</Badge>
              </div>
            ))}
          </div>
        </div>

        <Tabs defaultValue="buses" className="mt-12">
          <TabsList className="rounded-full h-12 p-1 bg-[#F0EFEB] flex-wrap h-auto">
            <TabsTrigger data-testid="transport-tab-buses" value="buses" className="rounded-full px-5 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"><Bus size={16} className="mr-1.5" />Buses</TabsTrigger>
            <TabsTrigger data-testid="transport-tab-cabs" value="cabs" className="rounded-full px-5 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"><Taxi size={16} className="mr-1.5" />Cabs</TabsTrigger>
            <TabsTrigger data-testid="transport-tab-bikes" value="bikes" className="rounded-full px-5 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"><Scooter size={16} className="mr-1.5" />Bike rentals</TabsTrigger>
            <TabsTrigger data-testid="transport-tab-cars" value="cars" className="rounded-full px-5 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"><Car size={16} className="mr-1.5" />Car rentals</TabsTrigger>
          </TabsList>

          <TabsContent value="buses" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {t.buses.map((b) => (
              <div key={b.route} data-testid="transport-bus-card" className="bg-white border border-[#E5E4E0] rounded-2xl p-5">
                <Bus size={24} weight="duotone" className="text-[#FF5A36]" />
                <p className="font-semibold mt-2">{b.route}</p>
                <p className="text-sm text-muted-foreground">{b.operator}</p>
                <div className="flex justify-between mt-3 text-sm"><span className="text-muted-foreground">{b.frequency}</span><span className="font-bold">{b.fare}</span></div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="cabs" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {t.cabs.map((c) => (
              <div key={c.name} data-testid="transport-cab-card" className="bg-white border border-[#E5E4E0] rounded-2xl p-5">
                <Taxi size={24} weight="duotone" className="text-[#FF5A36]" />
                <p className="font-semibold mt-2">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.type} · {c.note}</p>
                {c.deeplink && (
                  <a data-testid="cab-deeplink" href={c.deeplink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-[#0A2540] hover:underline">
                    Open app <ArrowSquareOut size={14} />
                  </a>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="bikes" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {t.bike_rentals.map((b) => (
              <div key={b.name} data-testid="transport-bike-card" className="bg-white border border-[#E5E4E0] rounded-2xl p-5">
                <Scooter size={24} weight="duotone" className="text-[#FF5A36]" />
                <p className="font-semibold mt-2">{b.name}</p>
                <p className="text-sm text-muted-foreground">{b.location}</p>
                <p className="font-bold text-sm mt-3">{b.price}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="cars" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {t.car_rentals.map((c) => (
              <div key={c.name} data-testid="transport-car-card" className="bg-white border border-[#E5E4E0] rounded-2xl p-5">
                <Car size={24} weight="duotone" className="text-[#FF5A36]" />
                <p className="font-semibold mt-2">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.location}</p>
                <p className="font-bold text-sm mt-3">{c.price}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-12 bg-[#FFF1EC] border border-[#E5E4E0] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-display text-lg font-bold">Ready to go to {dest.name}?</p>
            <p className="text-sm text-muted-foreground">Search flights, trains and stays in one place.</p>
          </div>
          <Button asChild data-testid="destination-book-cta" className="rounded-full bg-[#FF5A36] hover:bg-[#E64322]">
            <Link to="/book">Book this trip</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
