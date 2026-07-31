import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, List, X, SignOut, UserCircle, AirplaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";

const links = [
  { to: "/dashboard", label: "Home" },
  { to: "/book",      label: "Book" },
  { to: "/explore",   label: "Explore" },
  { to: "/trips",     label: "Trips" },
  { to: "/bookings",  label: "My Bookings" },
];

function ProfileDialog({ user, refreshMe }) {
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", upi_vpa: user?.upi_vpa || "" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await api.put("/auth/profile", form);
      await refreshMe();
      toast.success("Profile updated");
    } catch (e) {
      toast.error(formatApiError(e));
    }
    setSaving(false);
  };
  return (
    <DialogContent className="bg-[#141414] border border-white/10 text-white rounded-2xl" data-testid="profile-dialog">
      <DialogHeader>
        <DialogTitle className="font-bebas text-3xl tracking-wider text-white">Your Profile</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <Label className="text-white/60 font-semibold text-xs uppercase tracking-widest">Name</Label>
          <Input data-testid="profile-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white/5 border-white/10 text-white focus:border-[#FF4500] rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/60 font-semibold text-xs uppercase tracking-widest">Phone</Label>
          <Input data-testid="profile-phone-input" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-white/5 border-white/10 text-white focus:border-[#FF4500] rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/60 font-semibold text-xs uppercase tracking-widest">UPI ID</Label>
          <Input data-testid="profile-upi-input" placeholder="yourname@okhdfcbank" value={form.upi_vpa} onChange={(e) => setForm({ ...form, upi_vpa: e.target.value })} className="bg-white/5 border-white/10 text-white focus:border-[#FF4500] rounded-xl" />
          <p className="text-xs text-white/30">Friends who owe you get a one-tap "Pay via UPI" button using this ID.</p>
        </div>
        <button data-testid="profile-save-btn" onClick={save} disabled={saving} className="btn-flame w-full text-base py-3">
          {saving ? "Saving\u2026" : "Save Profile"}
        </button>
      </div>
    </DialogContent>
  );
}

function NotificationsBell() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const unread = items.filter((n) => !n.read).length;
  const load = () => api.get("/notifications").then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);
  const openItem = async (n) => {
    api.post(`/notifications/read/${n.id}`).then(load).catch(() => {});
    if (n.data?.trip_id) navigate(`/trips/${n.data.trip_id}`);
    else if (n.data?.booking_id) navigate(`/ticket/${n.data.booking_id}`);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button data-testid="notifications-bell" className="relative p-2 rounded-xl hover:bg-white/10 transition-colors text-white/70 hover:text-white">
          <Bell size={20} weight="duotone" />
          {unread > 0 && (
            <span data-testid="notifications-unread-count" className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-[#FF4500] text-white text-[10px] flex items-center justify-center font-bold">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 max-h-[420px] overflow-y-auto bg-[#141414] border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="font-bold text-white">Notifications</span>
          {items.length > 0 && (
            <button data-testid="notifications-read-all" className="text-xs text-[#FF4500] hover:underline font-semibold" onClick={() => api.post("/notifications/read-all").then(load)}>Mark all read</button>
          )}
        </div>
        {items.length === 0 && <p className="p-6 text-sm text-white/40 text-center font-medium">Nothing yet. Go plan something epic.</p>}
        {items.map((n) => (
          <div key={n.id} data-testid="notification-item" className={`px-4 py-3 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 transition-colors ${!n.read ? "bg-[#FF4500]/5" : ""}`} onClick={() => openItem(n)}>
            <p className="text-sm font-semibold text-white">{n.title}</p>
            <p className="text-sm text-white/50">{n.message}</p>
            {n.data?.upi_link && (
              <a data-testid="notification-pay-now" href={n.data.upi_link} onClick={(e) => e.stopPropagation()} className="inline-block mt-2 text-xs font-bold text-white bg-[#FF4500] hover:bg-[#CC3700] rounded-full px-4 py-1.5 transition-colors no-underline">Pay Now via UPI</a>
            )}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default function Navbar() {
  const { user, logout, refreshMe } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <header className="glass sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/dashboard" data-testid="nav-logo" className="flex items-center gap-2.5 no-underline group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center group-hover:scale-110 transition-transform">
            <AirplaneTilt size={18} weight="fill" className="text-white" />
          </div>
          <span className="font-bebas text-2xl text-white tracking-widest">TRAVELO<span className="text-[#FF4500]">.</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} data-testid={`nav-link-${l.label.toLowerCase().replace(" ", "-")}`}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive ? "bg-[#FF4500] text-white" : "text-white/60 hover:text-white hover:bg-white/8"
                }`
              }>{l.label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <NotificationsBell />
          <Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="nav-avatar" className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FF4500] to-[#FF8C00] text-white font-black text-sm flex items-center justify-center ml-2 hover:scale-110 transition-transform">
                  {(user?.name || "T").charAt(0).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#141414] border border-white/10 rounded-2xl text-white">
                <div className="px-3 py-2">
                  <p className="text-sm font-bold text-white">{user?.name}</p>
                  <p className="text-xs text-white/40">{user?.email}</p>
                  {!user?.upi_vpa && <Badge variant="outline" className="mt-1 text-[10px] border-[#FF4500] text-[#FF4500]">Add UPI ID for settlements</Badge>}
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DialogTrigger asChild>
                  <DropdownMenuItem data-testid="nav-profile-menu-item" className="text-white/70 hover:text-white hover:bg-white/8 cursor-pointer rounded-xl">
                    <UserCircle size={18} className="mr-2 text-[#FF4500]" /> Profile & UPI
                  </DropdownMenuItem>
                </DialogTrigger>
                <DropdownMenuItem data-testid="nav-logout" className="text-white/70 hover:text-white hover:bg-white/8 cursor-pointer rounded-xl" onClick={async () => { await logout(); navigate("/"); }}>
                  <SignOut size={18} className="mr-2 text-white/40" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {user && <ProfileDialog user={user} refreshMe={refreshMe} />}
          </Dialog>
          <button data-testid="nav-mobile-toggle" className="md:hidden p-2 text-white/70 hover:text-white transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="md:hidden px-4 pb-4 flex flex-col gap-1.5" data-testid="nav-mobile-menu">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive ? "bg-[#FF4500] text-white" : "text-white/60 hover:text-white hover:bg-white/8"
                }`
              }>{l.label}</NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
