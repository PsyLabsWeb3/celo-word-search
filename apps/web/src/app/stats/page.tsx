"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Users, Award, Coins, Activity, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"
import { createPublicClient, http, parseAbiItem, formatEther } from "viem"
import { celo } from "viem/chains"

const CONTRACT_ADDRESS = "0xdC2a624dFFC1f6343F62A02001906252e3cA8fD2"
const CROSSWORD_1_ID = "0xdb4764000c54b9390a601e96783d76e3e3e9d06329637cdd119045bf32624e32"
const CROSSWORD_2_ID = "0x28d1ba71976f4f4fa7344c7025215739bd3f6aa515d13e1fdfbe5245ea419ce2"

interface TransactionStats {
    totalCompletions: number
    totalPrizeDistributions: number
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
    }>
    isLoading: boolean
    error: string | null
}

export default function StatsPage() {
    const [stats, setStats] = useState<TransactionStats>({
        totalCompletions: 0,
        totalPrizeDistributions: 0,
        totalCeloDistributed: 0,
        crossword1Completions: 0,
        crossword2Completions: 0,
        testCompletions: 0,
        uniqueUsers: 0,
        recentTransactions: [],
        isLoading: true,
        error: null
    })

    useEffect(() => {
        async function fetchStats() {
            try {
                const client = createPublicClient({
                    chain: celo,
                    transport: http("https://forno.celo.org"),
                })

                // Fetch CrosswordCompleted events
                const completedEvents = await client.getLogs({
                    address: CONTRACT_ADDRESS,
                    event: parseAbiItem("event CrosswordCompleted(bytes32 indexed crosswordId, address indexed user, uint256 timestamp, uint256 durationMs)"),
                    fromBlock: 52500000n,
                    toBlock: "latest",
                })

                // Fetch PrizeDistributed events
                const prizeEvents = await client.getLogs({
                    address: CONTRACT_ADDRESS,
                    event: parseAbiItem("event PrizeDistributed(bytes32 indexed crosswordId, address indexed winner, uint256 amount, uint256 rank)"),
                    fromBlock: 52500000n,
                    toBlock: "latest",
                })

                // Calculate stats
                const crossword1 = completedEvents.filter(log => log.args.crosswordId === CROSSWORD_1_ID)
                const crossword2 = completedEvents.filter(log => log.args.crosswordId === CROSSWORD_2_ID)
                const testCrosswords = completedEvents.filter(log =>
                    log.args.crosswordId !== CROSSWORD_1_ID && log.args.crosswordId !== CROSSWORD_2_ID
                )

                const uniqueUsersSet = new Set(completedEvents.map(log => log.args.user))

                const totalCelo = prizeEvents.reduce((sum, log) => {
                    return sum + Number(formatEther(log.args.amount || 0n))
                }, 0)

                // Get recent transactions (last 10)
                const allEvents = [
                    ...completedEvents.map(e => ({ ...e, type: "Completion" })),
                    ...prizeEvents.map(e => ({ ...e, type: "Prize" }))
                ].sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))

                const recentTxs = await Promise.all(
                    allEvents.slice(0, 10).map(async (event) => {
                        const block = await client.getBlock({ blockNumber: event.blockNumber })
                        return {
                            hash: event.transactionHash,
                            type: event.type,
                            user: event.type === "Completion"
                                ? (event.args as any).user
                                : (event.args as any).winner,
                            timestamp: new Date(Number(block.timestamp) * 1000),
                            amount: event.type === "Prize"
                                ? formatEther((event.args as any).amount || 0n)
                                : undefined
                        }
                    })
                )

                setStats({
                    totalCompletions: completedEvents.length,
                    totalPrizeDistributions: prizeEvents.length,
                    totalCeloDistributed: totalCelo,
                    crossword1Completions: crossword1.length,
                    crossword2Completions: crossword2.length,
                    testCompletions: testCrosswords.length,
                    uniqueUsers: uniqueUsersSet.size,
                    recentTransactions: recentTxs,
                    isLoading: false,
                    error: null
                })
            } catch (error) {
                console.error("Error fetching stats:", error)
                setStats(prev => ({
                    ...prev,
                    isLoading: false,
                    error: "Error loading blockchain data"
                }))
            }
        }

        fetchStats()
    }, [])

    const totalTransactions = stats.totalCompletions + stats.totalPrizeDistributions

    if (stats.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-red-100">
                <div className="text-center">
                    <div className="inline-block w-16 h-16 mb-4 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
                    <p className="text-xl font-bold text-gray-800">Loading blockchain data...</p>
                    <p className="text-sm text-gray-600 mt-2">Fetching live stats from Celo Mainnet</p>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-red-100 p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/">
                        <Button variant="outline" className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white hover:bg-gray-100">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <a
                        href={`https://celoscan.io/address/${CONTRACT_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button variant="outline" className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white hover:bg-gray-100">
                            View on CeloScan
                            <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                    </a>
                </div>

                {/* Title */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase text-gray-900 mb-2">
                        📊 Live Stats
                    </h1>
                    <p className="text-lg text-gray-700 font-medium">
                        Real-time blockchain transaction data from Celo Mainnet
                    </p>
                    <p className="text-sm text-gray-500 mt-2 font-mono">
                        Contract: {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}
                    </p>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {/* Total Transactions */}
                    <Card className="border-4 border-black bg-gradient-to-br from-green-400 to-green-500 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-green-900 uppercase tracking-wide">Total Transactions</p>
                                <p className="text-5xl font-black text-white mt-2">{totalTransactions}</p>
                                <p className="text-sm text-green-100 mt-1">On-chain verified</p>
                            </div>
                            <Activity className="w-16 h-16 text-green-200" />
                        </div>
                    </Card>

                    {/* Total Completions */}
                    <Card className="border-4 border-black bg-gradient-to-br from-blue-400 to-blue-500 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-blue-900 uppercase tracking-wide">Puzzle Completions</p>
                                <p className="text-5xl font-black text-white mt-2">{stats.totalCompletions}</p>
                                <p className="text-sm text-blue-100 mt-1">Crosswords solved</p>
                            </div>
                            <Users className="w-16 h-16 text-blue-200" />
                        </div>
                    </Card>

                    {/* Unique Users */}
                    <Card className="border-4 border-black bg-gradient-to-br from-purple-400 to-purple-500 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-purple-900 uppercase tracking-wide">Unique Users</p>
                                <p className="text-5xl font-black text-white mt-2">{stats.uniqueUsers}</p>
                                <p className="text-sm text-purple-100 mt-1">Distinct wallets</p>
                            </div>
                            <TrendingUp className="w-16 h-16 text-purple-200" />
                        </div>
                    </Card>

                    {/* Prize Distributions */}
                    <Card className="border-4 border-black bg-gradient-to-br from-orange-400 to-orange-500 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-orange-900 uppercase tracking-wide">Prize Payouts</p>
                                <p className="text-5xl font-black text-white mt-2">{stats.totalPrizeDistributions}</p>
                                <p className="text-sm text-orange-100 mt-1">Internal transactions</p>
                            </div>
                            <Award className="w-16 h-16 text-orange-200" />
                        </div>
                    </Card>

                    {/* CELO Distributed */}
                    <Card className="border-4 border-black bg-gradient-to-br from-yellow-400 to-yellow-500 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-yellow-900 uppercase tracking-wide">CELO Distributed</p>
                                <p className="text-5xl font-black text-white mt-2">{stats.totalCeloDistributed.toFixed(1)}</p>
                                <p className="text-sm text-yellow-100 mt-1">As prizes</p>
                            </div>
                            <Coins className="w-16 h-16 text-yellow-200" />
                        </div>
                    </Card>

                    {/* Contract Age */}
                    <Card className="border-4 border-black bg-gradient-to-br from-pink-400 to-pink-500 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-pink-900 uppercase tracking-wide">Contract Age</p>
                                <p className="text-5xl font-black text-white mt-2">7</p>
                                <p className="text-sm text-pink-100 mt-1">Days active</p>
                            </div>
                            <Clock className="w-16 h-16 text-pink-200" />
                        </div>
                    </Card>
                </div>

                {/* Crossword Breakdown */}
                <Card className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10">
                    <h2 className="text-2xl font-black uppercase mb-6 text-gray-900">📝 Crossword Breakdown</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-r from-indigo-100 to-indigo-200 p-6 rounded-lg border-4 border-black">
                            <h3 className="text-lg font-bold text-indigo-900">Crossword #1</h3>
                            <p className="text-4xl font-black text-indigo-700 mt-2">{stats.crossword1Completions}</p>
                            <p className="text-sm text-indigo-600 mt-1">Dec 1-3, 2025</p>
                        </div>
                        <div className="bg-gradient-to-r from-teal-100 to-teal-200 p-6 rounded-lg border-4 border-black">
                            <h3 className="text-lg font-bold text-teal-900">Crossword #2 (Current)</h3>
                            <p className="text-4xl font-black text-teal-700 mt-2">{stats.crossword2Completions}</p>
                            <p className="text-sm text-teal-600 mt-1">Dec 4-present, 2025</p>
                        </div>
                        {stats.testCompletions > 0 && (
                            <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-lg border-4 border-black">
                                <h3 className="text-lg font-bold text-gray-700">Test Crosswords</h3>
                                <p className="text-4xl font-black text-gray-600 mt-2">{stats.testCompletions}</p>
                                <p className="text-sm text-gray-500 mt-1">Nov 30, 2025</p>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-4 text-center">
                        Total: {stats.crossword1Completions} + {stats.crossword2Completions} + {stats.testCompletions} = {stats.totalCompletions} completions
                    </p>
                </Card>

                {/* Recent Transactions */}
                <Card className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-2xl font-black uppercase mb-6 text-gray-900">🔗 Recent Transactions</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-4 border-black">
                                    <th className="text-left py-3 px-2 font-black text-sm">Type</th>
                                    <th className="text-left py-3 px-2 font-black text-sm">User</th>
                                    <th className="text-left py-3 px-2 font-black text-sm">Time</th>
                                    <th className="text-left py-3 px-2 font-black text-sm">Amount</th>
                                    <th className="text-left py-3 px-2 font-black text-sm">Tx</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentTransactions.map((tx, i) => (
                                    <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === "Completion"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-green-100 text-green-800"
                                                }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 font-mono text-sm">
                                            {tx.user.slice(0, 6)}...{tx.user.slice(-4)}
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

                {/* Footer */}
                <div className="text-center mt-10 text-gray-600">
                    <p className="font-medium">Data fetched directly from Celo Mainnet blockchain</p>
                    <p className="text-sm mt-1">All transactions are verifiable on-chain</p>
                </div>
            </div>
        </main>
    )
}
