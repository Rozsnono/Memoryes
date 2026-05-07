"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Send, Mic, MoreHorizontal, Paperclip } from "lucide-react";
import Link from "next/link";
import Pusher from "pusher-js";
import apiClient from "@/lib/apiClient";

export default function ChatPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // MOCK USER - In a real app, get this from your Auth Store
    const currentUser = { id: "user_123", name: "Alex" };
    const spaceId = "family_vault_1";

    // 1. Load History & Setup Pusher
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await apiClient.get(`/api/messages?spaceId=${spaceId}/`);
                setMessages(data);
                setIsLoading(false);
            } catch (err) {
                console.error("History fetch failed");
            }
        };

        fetchHistory();

        // Setup Pusher Client
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        const channel = pusher.subscribe(spaceId);

        channel.bind("new-message", (newMessage: any) => {
            setMessages((prev) => [...prev, newMessage]);
        });

        return () => {
            pusher.unsubscribe(spaceId);
        };
    }, []);

    // 2. Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // 3. Send Message Function
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const messageText = inputText;
        setInputText(""); // Optimistic UI: clear immediately

        try {
            await apiClient.post("/api/messages/", {
                spaceId: "family_vault_1", // Make sure this matches your GET request
                senderId: "user_123",
                senderName: "Alex",
                text: messageText,
                type: 'text'
            });
        } catch (err: any) {
            console.error("Frontend Error:", err.response?.data || err.message);
            alert("Failed to send: " + (err.response?.data?.error || "Network Error"));
            setInputText(messageText); // Put text back if failed
        }
    };
    return (
        <div className="flex flex-col h-screen bg-[#F8F9FA]">
            {/* Header */}
            <header className="px-4 pt-12 pb-4 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex items-center gap-3 sticky top-0 z-30">
                <Link href="/dashboard" className="p-2 -ml-2 text-slate-400">
                    <ChevronLeft size={24} />
                </Link>
                <div className="w-10 h-10 rounded-2xl bg-memoria-soft flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                    <div className="w-full h-full bg-memoria-primary flex items-center justify-center text-white font-bold text-xs">V</div>
                </div>
                <div className="flex-1">
                    <h2 className="text-sm font-bold text-memoria-clay leading-none">Family Vault</h2>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-1 italic">Real-time Active</p>
                </div>
                <button className="p-2 text-slate-400"><MoreHorizontal size={20} /></button>
            </header>

            {/* Messages List */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-32"
            >
                {isLoading ? (
                    <div className="flex justify-center py-10 text-slate-300 text-xs font-bold uppercase tracking-widest">Loading Conversation...</div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg._id} className={`flex flex-col ${msg.senderId === currentUser.id ? "items-end" : "items-start"}`}>
                            {msg.senderId !== currentUser.id && (
                                <span className="text-[9px] font-bold text-slate-400 mb-1 ml-2 uppercase tracking-tighter">{msg.senderName}</span>
                            )}
                            <div className={`max-w-[80%] p-4 rounded-[1.8rem] text-sm shadow-sm ${msg.senderId === currentUser.id
                                ? "bg-memoria-clay text-white rounded-tr-none"
                                : "bg-white text-memoria-clay rounded-tl-none border border-slate-100"
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Bar */}
            <div className="bg-white border-t border-slate-100 px-4 pt-3 pb-10">
                <form onSubmit={sendMessage} className="flex items-end gap-2 max-w-md mx-auto">
                    <button type="button" className="p-2 mb-1 text-memoria-primary bg-memoria-soft rounded-full">
                        <Paperclip size={20} />
                    </button>

                    <div className="flex-1 bg-slate-50 rounded-[1.5rem] border border-slate-200 p-1 flex items-end">
                        <textarea
                            rows={1}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                            placeholder="Message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 resize-none max-h-32 outline-none"
                        />
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        type="submit"
                        className={`p-3 mb-0.5 rounded-full shadow-lg transition-colors ${inputText ? "bg-memoria-clay text-white" : "bg-slate-100 text-slate-300"
                            }`}
                    >
                        <Send size={20} fill={inputText ? "currentColor" : "none"} />
                    </motion.button>
                </form>
            </div>
        </div>
    );
}