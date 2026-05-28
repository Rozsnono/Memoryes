"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Chess, Square, Color, PieceSymbol } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, Loader2, Trophy, Swords,
    CircleDot, ShieldCheck
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { pieceData, Pieces } from "@/lib/chessPieces";

// --- HIGH-FIDELITY SVG CHESS PIECES ---
const ChessPiece = ({ type, color }: { type: PieceSymbol; color: Color }) => {
    const isWhite = color === 'w';
    const fill = isWhite ? "#FFFFFF" : "#334155"; // Pure white vs Slate-700
    const stroke = "#1e293b"; // Dark slate outline for both

    return (
        <Pieces symbol={type} color={color === 'w' ? 'white' : 'black'} />
    )
};

function ChessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const gameId = searchParams.get('id');

    const game = useRef(new Chess());

    const [dbGame, setDbGame] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [optionSquares, setOptionSquares] = useState<Square[]>([]);
    const [orientation, setOrientation] = useState<'white' | 'black'>('white');
    const [board, setBoard] = useState(game.current.board());

    useEffect(() => {
        const init = async () => {
            try {
                const { data: userData } = await apiClient.get('/api/auth/me/');
                setUser(userData);

                if (gameId) {
                    const { data: gameData } = await apiClient.patch('/api/games/chess/join/', {
                        gameId, userId: userData._id, userName: userData.name, spaceId: userData.activeSpace
                    });

                    setDbGame(gameData);
                    game.current.load(gameData.fen);
                    setBoard(game.current.board());

                    const isBlack = gameData.blackPlayer?.id?.toString() === userData._id.toString();
                    setOrientation(isBlack ? 'black' : 'white');

                    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
                        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
                    });
                    const channel = pusher.subscribe(userData.activeSpace);

                    channel.bind('chess-move', (data: any) => {
                        if (data.gameId === gameId && data.fen !== game.current.fen()) {
                            game.current.load(data.fen);
                            setBoard(game.current.board());
                        }
                    });

                    return () => pusher.unsubscribe(userData.activeSpace);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [gameId]);

    const userColor = dbGame?.whitePlayer?.id?.toString() === user?._id?.toString() ? 'w' : 'b';
    const isMyTurn = game.current.turn() === userColor;

    const handleSquareClick = async (square: Square) => {
        if (!isMyTurn || game.current.isGameOver()) return;

        // If a piece is selected and we click a valid move square
        if (selectedSquare && optionSquares.includes(square)) {
            try {
                const move = game.current.move({ from: selectedSquare, to: square, promotion: 'q' });
                if (move) {
                    setBoard(game.current.board());
                    setSelectedSquare(null);
                    setOptionSquares([]);
                    await apiClient.patch('/api/games/chess/move/', {
                        gameId: dbGame._id, fen: game.current.fen(), move: move.san, spaceId: user.activeSpace
                    });
                    return;
                }
            } catch (e) { }
        }

        // Selecting a piece of your own color
        const piece = game.current.get(square);
        if (piece && piece.color === userColor) {
            setSelectedSquare(square);
            const moves = game.current.moves({ square, verbose: true });
            setOptionSquares(moves.map(m => m.to as Square));
        } else {
            setSelectedSquare(null);
            setOptionSquares([]);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-memoryes-background"><Loader2 className="animate-spin text-memoryes-primary" /></div>;


    const startNew = async (side: string) => {
        setLoading(true);
        const { data } = await apiClient.post('/api/games/chess/', { spaceId: user.activeSpace, userId: user._id, userName: user.name, side });
        router.push(`/games/chess/?id=${data._id}`);
    };

    if (!gameId) {
        return (
            <div className="min-h-screen bg-memoryes-background p-8 flex flex-col justify-center items-center text-center">
                <header className="absolute top-12 left-6">
                    <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm"><ChevronLeft /></button>
                </header>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 w-full max-w-sm">
                    <div className="space-y-4">
                        <div className="w-24 h-24 bg-white rounded-[3rem] flex items-center justify-center mx-auto shadow-xl">
                            <Swords size={48} className="text-memoryes-primary" />
                        </div>
                        <h1 className="text-4xl font-serif italic text-memoryes-clay">The Board Room</h1>
                        <p className="text-slate-400 text-sm">Choose your side to start the family session.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button onClick={() => startNew('white')} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 flex flex-col items-center gap-3 active:scale-95 transition-all">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-inner" />
                            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">White</span>
                        </button>
                        <button onClick={() => startNew('black')} className="bg-slate-900 p-6 rounded-[2.5rem] border-2 border-slate-800 shadow-xl flex flex-col items-center gap-3 active:scale-95 transition-all">
                            <div className="w-10 h-10 rounded-full bg-black border-2 border-slate-700 shadow-inner" />
                            <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Black</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }


    // --- BOARD RENDER LOGIC ---
    const rows = [0, 1, 2, 3, 4, 5, 6, 7];
    const cols = [0, 1, 2, 3, 4, 5, 6, 7];
    const displayRows = orientation === 'white' ? [...rows] : [...rows].reverse();
    const displayCols = orientation === 'white' ? [...cols] : [...cols].reverse();
    const getSquareName = (r: number, f: number): Square => {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        return (files[f] + (8 - r)) as Square;
    };
    const opponent = orientation === 'white' ? dbGame?.blackPlayer : dbGame?.whitePlayer;

    return (
        <div className="h-screen w-full bg-memoryes-background flex flex-col overflow-hidden">
            <header className="px-6 pt-12 pb-4 flex justify-between items-center z-50">
                <button onClick={() => router.push('/games')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400"><ChevronLeft size={20} /></button>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-full shadow-sm border border-slate-50">
                    <CircleDot size={10} className="text-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[2px]">Synced Session</span>
                </div>
                <div className="w-10" />
            </header>

            {/* OPPONENT AREA */}
            <div className="px-8 py-2">
                <div className="flex items-center gap-3 bg-white/40 px-3 py-2 rounded-2xl border border-white/50 w-fit">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center font-bold text-slate-300 border border-slate-100 shadow-sm">
                        {opponent?.name?.charAt(0) || "?"}
                    </div>
                    <p className="text-xs font-bold text-memoryes-clay">{opponent?.name || "Awaiting Family..."}</p>
                </div>
            </div>

            {/* MAIN GAME BOARD (CENTERED) */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-[420px] aspect-square bg-white rounded-[2rem] shadow-2xl border-[10px] border-white grid grid-cols-8 grid-rows-8 overflow-hidden relative">
                    {displayRows.map((r) => (
                        displayCols.map((f) => {
                            const sq = getSquareName(r, f);
                            const piece = board[r][f];
                            const isDark = (r + f) % 2 === 1;
                            const isSelected = selectedSquare === sq;
                            const isOption = optionSquares.includes(sq);

                            return (
                                <div
                                    key={sq}
                                    onClick={() => handleSquareClick(sq)}
                                    className={`relative flex items-center justify-center transition-all ${isDark ? 'bg-memoryes-primary' : 'bg-memoryes-soft'
                                        }`}
                                >
                                    {/* Tile Overlays */}
                                    {isSelected && <div className="absolute inset-0 bg-rose-400/40 z-10" />}
                                    {isOption && (
                                        <div className="absolute w-4 h-4 rounded-full bg-black/10 z-10 border border-black/5" />
                                    )}

                                    {/* THE SVG PIECE */}
                                    {piece && <ChessPiece type={piece.type} color={piece.color} />}
                                </div>
                            );
                        })
                    ))}

                    <AnimatePresence>
                        {game.current.isGameOver() && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-10">
                                <div className="bg-white p-8 rounded-[3.5rem] text-center space-y-6 shadow-2xl">
                                    <Trophy size={48} className="text-amber-500 mx-auto" />
                                    <h2 className="text-2xl font-serif italic text-memoryes-clay leading-tight">Checkmate</h2>
                                    <button onClick={() => router.push('/games')} className="w-full py-4 bg-memoryes-clay text-white rounded-xl font-bold">Lounge</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* YOUR AREA (BOTTOM) */}
            <div className="px-8 py-10 bg-white/50 backdrop-blur-xl border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-memoryes-primary flex items-center justify-center shadow-lg text-white font-black border-2 border-white">
                        {user?.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-black text-memoryes-clay leading-none mb-1">{user?.name} (You)</p>
                        <p className="text-[9px] font-bold text-memoryes-primary uppercase tracking-widest">{orientation} Side</p>
                    </div>
                </div>
                {isMyTurn && !game.current.isGameOver() && (
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="bg-emerald-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">Your Move</motion.div>
                )}
            </div>
        </div>
    );
}

export default function ChessPage() {
    return <Suspense fallback={null}><ChessContent /></Suspense>;
}