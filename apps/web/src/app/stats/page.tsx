"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Users, Award, Coins, Activity, TrendingUp, Clock, Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

interface TransactionStats {
    totalCompletions: number
    totalPrizeDistributions: number
    totalCrosswordsCreated: number
    totalCeloDistributed: number
    crossword1Completions: number
    crossword2Completions: number
    testCompletions: number
    uniqueUsers: number
    recentTransactions: Array<{
        hash: string
        type: string
        user: string
        timestamp: Date
        amount?: string
        contractAddress: string
    }>
    isLoading: boolean
    error: string | null
}

export default function StatsPage() {
    const [stats, setStats] = useState<TransactionStats>({
        totalCompletions: 0,
        totalPrizeDistributions: 0,
        totalCrosswordsCreated: 0,
        totalCeloDistributed: 0,
        crossword1Completions: 0,
        crossword2Completions: 0,
        testCompletions: 0,
        uniqueUsers: 0,
        recentTransactions: [],
        isLoading: true,
        error: null
    });

    const router = useRouter();
    const [isFetchingRealData, setIsFetchingRealData] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch real data function
    const fetchRealStats = async (showLoadingState = true) => {
        if (showLoadingState) setIsFetchingRealData(true);
        else setIsRefreshing(true);
        
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            const data = await response.json();

            // Convert timestamp numbers back to Date objects for display
            const processedData = {
                ...data,
                isLoading: false, 
                recentTransactions: data.recentTransactions.map((tx: any) => ({
                    ...tx,
                    timestamp: new Date(tx.timestamp)
                }))
            };

            setStats(processedData);
        } catch (error) {
            console.error("Error fetching stats:", error);
            setStats(prev => ({
                ...prev,
                isLoading: false,
                error: "Error loading blockchain data"
            }));
        } finally {
            setIsFetchingRealData(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRealStats();
    }, []);

    const totalTransactions = stats.totalCompletions + stats.totalPrizeDistributions + stats.totalCrosswordsCreated

    // Don't show loading state since we have mock data immediately
    // The UI will update when real data arrives

    return (
        <main className="min-h-screen bg-background p-3 sm:p-6 md:p-8">
            <div className="mx-auto max-w-6xl">
                {/* Title - Responsive sizing */}
                <div className="text-center mb-6 sm:mb-10">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase text-foreground mb-2">
                        📊 Live Stats
                    </h1>
                    <p className="text-sm sm:text-lg text-muted-foreground font-medium px-2">
                        Combined blockchain data from Celo Mainnet
                    </p>
                </div>
                
                {/* Header Buttons - Synced with Active Crosswords */}
                <div className="flex justify-center flex-wrap gap-4 mb-8">
                    <Button
                        onClick={() => router.push("/")}
                        className="border-4 border-black bg-accent font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-accent hover:shadow-none whitespace-normal h-auto min-h-[44px]"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 shrink-0" />
                        Back
                    </Button>

                    <Button
                        onClick={() => fetchRealStats(false)}
                        disabled={isFetchingRealData || isRefreshing}
                        className="border-4 border-black bg-yellow-400 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-yellow-500 hover:shadow-none whitespace-normal h-auto min-h-[44px]"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
                    </Button>
                </div>

                {isFetchingRealData ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                        <Loader2 className="w-16 h-16 animate-spin text-purple-600 mb-4" />
                        <h2 className="text-xl text-center font-black uppercase tracking-tight">Fetching Blockchain Data...</h2>
                        <p className="text-muted-foreground font-medium mt-2 text-center px-4">
                            Aggregating legacy and modular contract events from Celo Mainnet.
                        </p>
                    </div>
                ) : (
                    <>

                {/* Main Stats Grid - 2 columns on mobile, 3 on desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-10">
                    {/* Total Transactions */}
                    <Card className="border-4 border-black bg-gradient-to-br from-green-400 to-green-500 p-3 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-green-900 uppercase tracking-wide">Transactions</p>
                                <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-1">{totalTransactions}</p>
                                <p className="text-[10px] sm:text-xs text-green-100 mt-0.5 sm:mt-1">On-chain</p>
                            </div>
                            <Activity className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-green-200 shrink-0" />
                        </div>
                    </Card>

                    {/* Total Completions */}
                    <Card className="border-4 border-black bg-gradient-to-br from-blue-400 to-blue-500 p-3 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-blue-900 uppercase tracking-wide">Completions</p>
                                <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-1">{stats.totalCompletions}</p>
                                <p className="text-[10px] sm:text-xs text-blue-100 mt-0.5 sm:mt-1">Puzzles solved</p>
                            </div>
                            <Users className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-blue-200 shrink-0" />
                        </div>
                    </Card>

                    {/* Unique Users */}
                    <Card className="border-4 border-black bg-gradient-to-br from-purple-400 to-purple-500 p-3 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-purple-900 uppercase tracking-wide">Users</p>
                                <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-1">{stats.uniqueUsers}</p>
                                <p className="text-[10px] sm:text-xs text-purple-100 mt-0.5 sm:mt-1">Unique wallets</p>
                            </div>
                            <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-purple-200 shrink-0" />
                        </div>
                    </Card>

                    {/* Prize Distributions */}
                    <Card className="border-4 border-black bg-gradient-to-br from-orange-400 to-orange-500 p-3 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-orange-900 uppercase tracking-wide">Payouts</p>
                                <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-1">{stats.totalPrizeDistributions}</p>
                                <p className="text-[10px] sm:text-xs text-orange-100 mt-0.5 sm:mt-1">Prize txs</p>
                            </div>
                            <Award className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-orange-200 shrink-0" />
                        </div>
                    </Card>

                    {/* CELO Distributed */}
                    <Card className="border-4 border-black bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-yellow-900 uppercase tracking-wide">CELO</p>
                                <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-1">{stats.totalCeloDistributed.toFixed(1)}</p>
                                <p className="text-[10px] sm:text-xs text-yellow-100 mt-0.5 sm:mt-1">Distributed</p>
                            </div>
                            <Coins className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-yellow-200 shrink-0" />
                        </div>
                    </Card>

                    {/* Average Prize Amount */}
                    <Card className="border-4 border-black bg-gradient-to-br from-pink-400 to-pink-500 p-3 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-pink-900 uppercase tracking-wide">Avg Prize</p>
                                <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-1">
                                    {stats.totalPrizeDistributions > 0
                                        ? (stats.totalCeloDistributed / stats.totalPrizeDistributions).toFixed(2)
                                        : '0.00'}
                                </p>
                                <p className="text-[10px] sm:text-xs text-pink-100 mt-0.5 sm:mt-1">CELO per payout</p>
                            </div>
                            <Coins className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-pink-200 shrink-0" />
                        </div>
                    </Card>
                </div>

                {/* Crossword Breakdown */}
                {/* <Card className="border-4 border-black bg-white p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6 sm:mb-10">
                    <h2 className="text-lg sm:text-2xl font-black uppercase mb-4 sm:mb-6 text-foreground">📝 Crossword Breakdown</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div className="bg-gradient-to-r from-indigo-100 to-indigo-200 p-4 sm:p-5 rounded-lg border-4 border-black">
                            <h3 className="text-sm sm:text-base font-bold text-indigo-900">Crossword #1</h3>
                            <p className="text-3xl sm:text-4xl font-black text-indigo-700 mt-2">{stats.crossword1Completions}</p>
                            <p className="text-xs sm:text-sm text-indigo-600 mt-1">Dec 1-3, 2025</p>
                        </div>
                        <div className="bg-gradient-to-r from-teal-100 to-teal-200 p-4 sm:p-5 rounded-lg border-4 border-black">
                            <h3 className="text-sm sm:text-base font-bold text-teal-900">Crossword #2 <span className="text-teal-700">(Current)</span></h3>
                            <p className="text-3xl sm:text-4xl font-black text-teal-700 mt-2">{stats.crossword2Completions}</p>
                            <p className="text-xs sm:text-sm text-teal-600 mt-1">Dec 4-present</p>
                        </div>
                        {stats.testCompletions > 0 && (
                            <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 sm:p-5 rounded-lg border-4 border-black sm:col-span-2 lg:col-span-1">
                                <h3 className="text-sm sm:text-base font-bold text-gray-700">Test Crosswords</h3>
                                <p className="text-3xl sm:text-4xl font-black text-gray-600 mt-2">{stats.testCompletions}</p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Nov 30, 2025</p>
                            </div>
                        )}
                    </div>
                </Card> */}

                {/* Recent Transactions - Cards on mobile, table on desktop */}
                <Card className="border-4 border-black bg-white p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-lg sm:text-2xl font-black uppercase mb-4 sm:mb-6 text-foreground">🔗 Recent Transactions</h2>

                    {/* Mobile: Card layout */}
                    <div className="sm:hidden space-y-3">
                        {stats.recentTransactions.map((tx, i) => (
                            <div key={i} className="bg-gray-50 rounded-lg p-3 border-2 border-black">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.type === "Completion"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-green-100 text-green-800"
                                        }`}>
                                        {tx.type}
                                    </span>
                                    <a
                                        href={`https://celoscan.io/tx/${tx.hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 p-1"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-700">0x{tx.user.slice(2, 8)}...{tx.user.slice(-6)}</span>
                                    {tx.amount && (
                                        <span className="font-bold text-orange-600">{parseFloat(tx.amount).toFixed(2)} CELO</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-600 mt-1">
                                    {tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-4 border-black">
                                    <th className="text-left py-3 px-2 font-black text-xs sm:text-sm">Type</th>
                                    <th className="text-left py-3 px-2 font-black text-xs sm:text-sm">User</th>
                                    <th className="text-left py-3 px-2 font-black text-xs sm:text-sm">Time</th>
                                    <th className="text-left py-3 px-2 font-black text-xs sm:text-sm">Amount</th>
                                    <th className="text-left py-3 px-2 font-black text-xs sm:text-sm">Tx</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentTransactions.map((tx, i) => (
                                    <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.type === "Completion"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-green-100 text-green-800"
                                                }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-sm font-mono">
                                            0x{tx.user.slice(2, 8)}...{tx.user.slice(-6)}
                                        </td>
                                        <td className="py-3 px-2 text-sm text-gray-600">
                                            {tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString()}
                                        </td>
                                        <td className="py-3 px-2 font-bold">
                                            {tx.amount ? `${parseFloat(tx.amount).toFixed(2)} CELO` : "-"}
                                        </td>
                                        <td className="py-3 px-2">
                                            <a
                                                href={`https://celoscan.io/tx/${tx.hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div className="flex flex-wrap gap-2 mt-4">
                        <a
                            href={`https://celoscan.io/address/${process.env.NEXT_PUBLIC_LEGACY_CONTRACT_ADDRESS || "0xdC2a624dFFC1f6343F62A02001906252e3cA8fD2"}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto"
                        >
                            <Button variant="outline" className="w-full sm:w-auto border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm">
                                <span className="hidden sm:inline">Contract v1</span>
                                <span className="sm:hidden">Contract v1</span>
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                        </a>
                        <a
                            href={`https://celoscan.io/address/${process.env.NEXT_PUBLIC_NEW_CONTRACT_ADDRESS || ""}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto"
                        >
                            <Button variant="outline" className="w-full sm:w-auto border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs sm:text-sm">
                                <span className="hidden sm:inline">Contract v1.1</span>
                                <span className="sm:hidden">Contract v1.1</span>
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                        </a>
                        <a
                            href={`https://celoscan.io/address/${process.env.NEXT_PUBLIC_LATEST_CONTRACT_ADDRESS || ""}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto"
                        >
                            <Button variant="outline" className="w-full sm:w-auto border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs sm:text-sm">
                                <span className="hidden sm:inline">Contract v2.0 (Latest)</span>
                                <span className="sm:hidden">Contract v2.0 (Latest)</span>
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                        </a>
                    </div>

                {/* Footer */}
                {!isFetchingRealData && (
                    <div className="text-center mt-6 sm:mt-10 text-muted-foreground px-4">
                        <p className="text-xs sm:text-sm font-medium">Data fetched directly from Celo Mainnet blockchain</p>
                        <p className="text-[10px] sm:text-xs mt-1">All transactions are verifiable on-chain</p>
                    </div>
                )}
                    </>
                )}
            </div>
        </main>
    )
}
