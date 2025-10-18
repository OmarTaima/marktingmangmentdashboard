import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { TrendingUp, Users, Eye, Heart, Share2, DollarSign, ArrowLeft } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const ReportsPage = () => {
    const [searchParams] = useSearchParams();
    const clientId = searchParams.get("client") || "0";
    const [selectedMonth, setSelectedMonth] = useState("2025-01");
    const [clientData, setClientData] = useState(null);
    const { t } = useLang();

    useEffect(() => {
        // Load client data
        const stodangerData = localStorage.getItem("clientData");
        if (stodangerData) {
            setClientData(JSON.parse(stodangerData));
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
            { name: "Facebook", reach: 18500, engagement: 3200, color: "bg-primary-500" },
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
                        <h1 className="title">
                            {clientData ? `${clientData.business?.businessName} - ${t("monthly_report")}` : t("campaign_reports")}
                        </h1>
                        <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                            {clientData ? t("reports_subtitle_selected") : t("reports_subtitle")}
                        </p>
                    </div>
                </div>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 rounded-lg border bg-white px-4 py-2 focus:outline-none"
                />
            </div>

            {!clientData ? (
                <div className="card">
                    <div className="py-12 text-center">
                        <DollarSign
                            size={48}
                            className="text-secondary-400 mx-auto mb-4"
                        />
                        <h3 className="text-secondary-900 dark:text-secondary-50 mb-2 text-lg font-medium">No Client Selected</h3>
                        <h3 className="text-secondary-900 dark:text-secondary-50 mb-2 text-lg font-medium">{t("no_client_selected")}</h3>
                        <p className="text-secondary-600 dark:text-secondary-400 mb-4">{t("please_complete_onboarding")}</p>
                        <Link
                            to="/campaigns"
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            {t("go_to_campaigns")}
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* Earnings Card */}
                    <div className="card from-primary-500 bg-gradient-to-br to-purple-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-primary-100 mb-1">Total Earnings</p>
                                <h2 className="text-4xl font-bold">{reportData.earnings.total}</h2>
                                <p className="text-primary-100 mt-2 flex items-center gap-2">
                                    <TrendingUp size={16} />
                                    {reportData.earnings.change} from last month
                                </p>
                            </div>
                            <DollarSign
                                size={64}
                                className="text-primary-200 opacity-50"
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
                                    <span className="text-secondary-600 dark:text-secondary-400">{metric.label}</span>
                                    <metric.icon
                                        size={20}
                                        className="text-primary-500"
                                    />
                                </div>
                                <h3 className="text-secondary-900 dark:text-secondary-50 text-2xl font-bold">{metric.value}</h3>
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
                                        <span className="text-secondary-900 dark:text-secondary-50 font-medium">{platform.name}</span>
                                        <div className="flex gap-6 text-sm">
                                            <span className="text-secondary-600 dark:text-secondary-400">
                                                Reach: <strong>{platform.reach.toLocaleString()}</strong>
                                            </span>
                                            <span className="text-secondary-600 dark:text-secondary-400">
                                                Engagement: <strong>{platform.engagement.toLocaleString()}</strong>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-secondary-200 dark:bg-secondary-700 h-2 w-full rounded-full">
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
                                    className="bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-between rounded-lg p-4"
                                >
                                    <div className="flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <span className="text-primary-500 text-xs font-medium">{post.platform}</span>
                                            <span className="text-secondary-500 dark:text-secondary-400 text-xs">{post.date}</span>
                                        </div>
                                        <p className="text-secondary-900 dark:text-secondary-50 font-medium">{post.content}</p>
                                    </div>
                                    <div className="flex gap-6 text-right text-sm">
                                        <div>
                                            <p className="text-secondary-500 dark:text-secondary-400">Reach</p>
                                            <p className="text-secondary-900 dark:text-secondary-50 font-bold">{post.reach.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-secondary-500 dark:text-secondary-400">Engagement</p>
                                            <p className="text-secondary-900 dark:text-secondary-50 font-bold">{post.engagement.toLocaleString()}</p>
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
