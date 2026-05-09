"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User as UserIcon,
    Settings,
    Share2,
    Palette,
    LogOut,
    ChevronRight,
    Copy,
    Check,
    Camera,
    ShieldCheck,
    Loader2,
    X,
    ChevronDown,
    LayoutGrid,
    Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { Navbar } from "@/components/ui/Navbar";
import { NativeBiometric } from 'capacitor-native-biometric';
import Link from "next/link";
import { toast } from "sonner";

const THEMES = [
    { name: "Lavender", color: "#9B86BD" },
    { name: "Rose", color: "#FFD1DC" },
    { name: "Mint", color: "#E0F2F1" },
    { name: "Sky", color: "#E0F7FA" },
    { name: "Clay", color: "#4A4E69" },
];

export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Data State
    const [user, setUser] = useState<any>(null);
    const [activeTheme, setActiveTheme] = useState("#9B86BD");
    const [activeSpace, setActiveSpace] = useState<any>(null);

    // UI States
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await apiClient.get('/api/profile/');
                setUser(data);
                // Find the object for the active space from the spaces array
                const current = data.spaces.find((s: any) => s._id === data.activeSpace);
                setActiveSpace(current);
                if (current?.themeColor) setActiveTheme(current.themeColor);
            } catch (err) {
                console.error("Profile fetch failed");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // --- SPACE SWITCHER LOGIC ---
    const handleSwitchSpace = async (spaceId: string) => {
        setIsUpdating(true);
        try {
            const { data } = await apiClient.post('/api/spaces/switch/', { spaceId });
            setUser(data);
            const newActive = data.spaces.find((s: any) => s._id === data.activeSpace);
            setActiveSpace(newActive);
            if (newActive?.themeColor) setActiveTheme(newActive.themeColor);
            setIsSwitcherOpen(false);
        } catch (err) {
            toast.error("Failed to switch space");
        } finally {
            setIsUpdating(false);
        }
    };

    // --- AVATAR UPLOAD LOGIC ---
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        try {
            const { data: signData } = await apiClient.post('/api/media/sign/');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', signData.apiKey);
            formData.append('timestamp', signData.timestamp);
            formData.append('signature', signData.signature);
            formData.append('folder', 'memoryes_avatars');

            const cloudRes = await fetch(
                `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
                { method: 'POST', body: formData }
            );
            const cloudData = await cloudRes.json();

            const { data: updatedUser } = await apiClient.patch('/api/profile/', {
                avatar: cloudData.secure_url
            });

            setUser(updatedUser);
        } catch (err) {
            toast.error("Failed to upload avatar");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const updateTheme = async (color: string) => {
        setActiveTheme(color);
        setIsUpdating(true);
        try {
            await apiClient.patch('/api/profile/', { themeColor: color });
        } catch (err) { console.error("Theme update failed"); }
        finally { setIsUpdating(false); }
    };

    const handleBiometricToggle = async () => {
        try {
            const result = await NativeBiometric.isAvailable();
            if (!result.isAvailable) return toast.error("Biometrics not available");
            const verified = await NativeBiometric.verifyIdentity({
                reason: "Secure your memories",
                title: "Security",
                description: "Please authenticate",
            });
            if (verified) {
                const { data } = await apiClient.patch('/api/profile/', { bioEnabled: !user.bioEnabled });
                setUser(data);
            }
        } catch (err) { console.log("Biometric failed"); toast.error("Biometric authentication failed"); }
    };

    const handleSignOut = () => {
        localStorage.removeItem("memoryes_token");
        localStorage.removeItem("memoryes_user");
        router.push("/login");
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-memoryes-background">
            <Loader2 className="animate-spin text-memoryes-primary" size={32} />
        </div>
    );

    return (
        <div className="min-h-screen bg-memoryes-background pb-32">
            {/* --- AVATAR & IDENTITY --- */}
            <header className="p-8 pt-20 flex flex-col items-center text-center">
                <div className="relative mb-6">
                    <motion.div
                        animate={{ backgroundColor: activeTheme }}
                        className="w-32 h-32 rounded-[2.8rem] p-1 shadow-2xl transition-colors duration-500 relative"
                    >
                        {isUploadingAvatar && (
                            <div className="absolute inset-1 rounded-[2.5rem] bg-black/40 z-10 flex items-center justify-center backdrop-blur-sm">
                                <Loader2 className="animate-spin text-white" size={24} />
                            </div>
                        )}
                        <img
                            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                            className="w-full h-full rounded-[2.5rem] border-4 border-white object-cover bg-white shadow-inner"
                            alt="Avatar"
                        />
                    </motion.div>

                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 bg-white p-2.5 rounded-full shadow-lg text-memoryes-clay active:scale-90 transition-transform"
                    >
                        <Camera size={18} />
                    </button>
                </div>

                <h2 className="text-3xl font-serif italic text-memoryes-clay">{user.name}</h2>

                {/* --- SPACE SWITCHER BUTTON --- */}
                <div className="mt-3 relative">
                    <button
                        onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                        className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm active:scale-95 transition-all"
                    >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeTheme }} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                            {activeSpace?.name || "Select Space"}
                        </span>
                        <ChevronDown size={14} className={`text-slate-300 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isSwitcherOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsSwitcherOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-2 z-50 overflow-hidden"
                                >
                                    <div className="space-y-1">
                                        {user.spaces?.map((space: any) => (
                                            <button
                                                key={space._id}
                                                onClick={() => handleSwitchSpace(space._id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors ${space._id === user.activeSpace ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: space.themeColor }}>
                                                        <LayoutGrid size={14} />
                                                    </div>
                                                    <span className={`text-[11px] font-bold ${space._id === user.activeSpace ? 'text-memoryes-clay' : 'text-slate-400'}`}>
                                                        {space.name}
                                                    </span>
                                                </div>
                                                {space._id === user.activeSpace && <Check size={14} className="text-emerald-500" />}
                                            </button>
                                        ))}
                                        <Link href="/setup-space" className="w-full mt-1 flex items-center gap-3 p-3 rounded-2xl text-slate-300 border-t border-slate-50 pt-3">
                                            <Plus size={14} />
                                            <span className="text-[11px] font-bold">New Vault</span>
                                        </Link>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            <section className="px-6 space-y-8">
                {/* --- INVITE CARD --- */}
                {activeSpace?.type !== 'personal' && (
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4 text-slate-300">
                            <span className="text-[10px] font-black uppercase tracking-widest">Space Invite Code</span>
                            <Share2 size={16} />
                        </div>
                        <div className="flex items-center justify-between bg-slate-50 rounded-[1.5rem] p-4 border border-slate-100">
                            <span className="text-2xl font-mono font-bold tracking-[0.3em] text-memoryes-clay ml-2">
                                {activeSpace?.inviteCode || "------"}
                            </span>
                            <button
                                onClick={() => {
                                    if (!activeSpace?.inviteCode) return;
                                    navigator.clipboard.writeText(activeSpace.inviteCode);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- THEME PICKER --- */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2 text-slate-400">
                        <Palette size={14} />
                        <h4 className="text-[10px] font-black uppercase tracking-[3px]">Vault Theme</h4>
                    </div>
                    <div className="flex justify-between bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-50 relative">
                        {THEMES.map((t) => (
                            <button
                                key={t.name}
                                onClick={() => updateTheme(t.color)}
                                className={`w-10 h-10 rounded-full border-4 transition-all ${activeTheme === t.color ? 'border-white ring-4 ring-slate-100 scale-110 shadow-lg' : 'border-transparent opacity-40'}`}
                                style={{ backgroundColor: t.color }}
                            />
                        ))}
                        {isUpdating && (
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-[2.5rem] z-10">
                                <Loader2 className="animate-spin text-memoryes-clay" size={20} />
                            </div>
                        )}
                    </div>
                </div>

                {/* --- SETTINGS LIST --- */}
                <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-50 space-y-1">
                    <ProfileItem
                        onClick={() => setIsEditOpen(true)}
                        icon={UserIcon}
                        title="Profile Details"
                        sub={user.name}
                    />
                    <ProfileItem
                        onClick={handleBiometricToggle}
                        icon={ShieldCheck}
                        title="Biometric Shield"
                        sub={user.bioEnabled ? "Protected" : "Disabled"}
                        toggle
                        toggleActive={user.bioEnabled}
                    />
                    <ProfileItem icon={Settings} title="Preferences" sub="App & Notifications" />
                </div>

                <button
                    onClick={handleSignOut}
                    className="w-full py-5 rounded-[2.2rem] bg-rose-50 text-rose-500 font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </section>

            {/* --- EDIT NAME MODAL --- */}
            <AnimatePresence>
                {isEditOpen && (
                    <EditProfileModal
                        user={user}
                        onClose={() => setIsEditOpen(false)}
                        onUpdate={(updated: any) => setUser(updated)}
                    />
                )}
            </AnimatePresence>

            <Navbar />
        </div>
    );
}

function ProfileItem({ icon: Icon, title, sub, toggle, toggleActive, onClick }: any) {
    return (
        <div onClick={onClick} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-3xl transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white shadow-sm transition-colors">
                    <Icon size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-memoryes-clay">{title}</h4>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{sub}</p>
                </div>
            </div>
            {toggle ? (
                <div className={`w-10 h-6 rounded-full relative p-1 transition-colors duration-300 ${toggleActive ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                    <motion.div animate={{ x: toggleActive ? 16 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
            ) : (
                <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
            )}
        </div>
    );
}

function EditProfileModal({ user, onClose, onUpdate }: any) {
    const [name, setName] = useState(user.name);
    const [isSaving, setIsSaving] = useState(false);
    const saveChanges = async () => {
        setIsSaving(true);
        try {
            const { data } = await apiClient.patch('/api/profile/', { name });
            onUpdate(data);
            onClose();
        } catch (err) { toast.error("Update failed"); }
        finally { setIsSaving(false); }
    };
    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 pb-12 z-[160] max-w-md mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-serif italic text-memoryes-clay">Edit Profile</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
                </div>
                <div className="space-y-6">
                    <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-memoryes-clay outline-none" value={name} onChange={(e) => setName(e.target.value)} />
                    <button onClick={saveChanges} disabled={isSaving || name === user.name} className="w-full bg-memoryes-clay text-white py-4 rounded-[1.5rem] font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSaving ? <Loader2 className="animate-spin" /> : "Save Changes"}
                    </button>
                </div>
            </motion.div>
        </>
    );
}