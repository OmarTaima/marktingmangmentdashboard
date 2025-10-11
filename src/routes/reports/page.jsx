import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { TrendingUp, Users, Eye, Heart, Share2, DollarSign, ArrowLeft } from "lucide-react";

const ReportsPage = () => {
    const [searchParams] = useSearchParams();
    const clientId = searchParams.get("client") || "0";
    const [selectedMonth, setSelectedMonth] = useState("2025-01");
    const [clientData, setClientData] = useState(null);

    useEffect(() => {
        // Load client data
        const storedData = localStorage.getItem("clientData");
        if (storedData) {
            setClientData(JSON.parse(storedData));
        }
    }, [clientId]);

    // Mock data - in real app this would come from backend based on clientId
    const reportData = {
        earnings: {
            total: "$12,450",
            change: "+18%",
            trend: "up",
        },
        metrics: [
            { label: "Reach", value: "45.2K", change: "+12%", icon: Eye },
            { label: "Engagement", value: "8.5K", change: "+25%", icon: Heart },
            { label: "Followers", value: "12.8K", change: "+8%", icon: Users },
            { label: "Shares", value: "1.2K", change: "+15%", icon: Share2 },
        ],
        platforms: [
            { name: "Facebook", reach: 18500, engagement: 3200, color: "bg-blue-500" },
            { name: "Instagram", reach: 21000, engagement: 4100, color: "bg-pink-500" },
            { name: "TikTok", reach: 15200, engagement: 2800, color: "bg-purple-500" },
            { name: "X (Twitter)", reach: 8900, engagement: 1400, color: "bg-sky-500" },
        ],
        topPosts: [
            {
                id: 1,
                platform: "Instagram",
                content: "New product launch campaign",
                reach: 8500,
                engagement: 1200,
                date: "2025-01-15",
            },
            {
                id: 2,
                platform: "Facebook",
                content: "Customer testimonial video",
                reach: 6200,
                engagement: 980,
                date: "2025-01-20",
            },
            {
                id: 3,
                platform: "TikTok",
                content: "Behind the scenes reel",
                reach: 12000,
                engagement: 2100,
                date: "2025-01-25",
            },
        ],
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {clientData && (
                        <Link
                            to="/campaigns"
                            className="btn-ghost"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                    )}
                    <div>
                        <h1 className="title">{clientData ? `${clientData.business?.businessName} - Monthly Report` : "Campaign Reports"}</h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-400">
                            {clientData ? "Track your campaign performance and earnings" : "Select a client to view their monthly report"}
                        </p>
                    </div>
                </div>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
            </div>

            {!clientData ? (
                <div className="card">
                    <div className="py-12 text-center">
                        <DollarSign
                            size={48}
                            className="mx-auto mb-4 text-slate-400"
                        />
                        <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-50">No Client Selected</h3>
                        <p className="mb-4 text-slate-600 dark:text-slate-400">
                            Please add a client through onboarding first, then view their reports from the campaigns page.
                        </p>
                        <Link
                            to="/campaigns"
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            Go to Campaigns
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* Earnings Card */}
                    <div className="card bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-blue-100">Total Earnings</p>
                                <h2 className="text-4xl font-bold">{reportData.earnings.total}</h2>
                                <p className="mt-2 flex items-center gap-2 text-blue-100">
                                    <TrendingUp size={16} />
                                    {reportData.earnings.change} from last month
                                </p>
                            </div>
                            <DollarSign
                                size={64}
                                className="text-blue-200 opacity-50"
                            />
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        {reportData.metrics.map((metric, index) => (
                            <div
                                key={index}
                                className="card"
                            >
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{metric.label}</span>
                                    <metric.icon
                                        size={20}
                                        className="text-blue-500"
                                    />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{metric.value}</h3>
                                <p className="mt-1 text-sm text-green-600">{metric.change} vs last month</p>
                            </div>
                        ))}
                    </div>

                    {/* Platform Performance */}
                    <div className="card">
                        <h3 className="card-title mb-4">Platform Performance</h3>
                        <div className="space-y-4">
                            {reportData.platforms.map((platform, index) => (
                                <div key={index}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="font-medium text-slate-900 dark:text-slate-50">{platform.name}</span>
                                        <div className="flex gap-6 text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">
                                                Reach: <strong>{platform.reach.toLocaleString()}</strong>
                                            </span>
                                            <span className="text-slate-600 dark:text-slate-400">
                                                Engagement: <strong>{platform.engagement.toLocaleString()}</strong>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                                        <div
                                            className={`${platform.color} h-2 rounded-full transition-all`}
                                            style={{ width: `${(platform.reach / 25000) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Posts */}
                    <div className="card">
                        <h3 className="card-title mb-4">Top Performing Posts</h3>
                        <div className="space-y-3">
                            {reportData.topPosts.map((post) => (
                                <div
                                    key={post.id}
                                    className="flex items-center justify-between rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50"
                                >
                                    <div className="flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <span className="text-xs font-medium text-blue-500">{post.platform}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{post.date}</span>
                                        </div>
                                        <p className="font-medium text-slate-900 dark:text-slate-50">{post.content}</p>
                                    </div>
                                    <div className="flex gap-6 text-right text-sm">
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Reach</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-50">{post.reach.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Engagement</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-50">{post.engagement.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportsPage;
