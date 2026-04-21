import { CreditCard, DollarSign, Package, TrendingUp, Users } from "lucide-react";

import { cn } from "../../utils/cn";
const DashboardPage = () => {
    return (
        <div className="flex flex-col gap-8 pb-10">
            <section className="relative overflow-hidden rounded-3xl border border-light-200/70 bg-white/85 p-6 shadow-sm backdrop-blur-sm dark:border-dark-700/70 dark:bg-dark-900/60 sm:p-8">
                <div className="absolute -top-20 -right-14 h-52 w-52 rounded-full bg-light-400/20 blur-3xl dark:bg-light-500/10" />
                <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-secdark-700/15 blur-3xl dark:bg-secdark-700/20" />
                <div className="relative flex flex-col gap-2">
                    <span className="inline-flex w-fit items-center rounded-full border border-light-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-light-700 dark:border-dark-600 dark:bg-dark-900/70 dark:text-dark-200">
                        Daily Snapshot
                    </span>
                    <h1 className="title text-2xl font-bold tracking-tight md:text-3xl">Dashboard Overview</h1>
                    <p className="text-light-600 dark:text-dark-300 max-w-2xl text-sm sm:text-base">
                        Welcome back. Here is a polished snapshot of today&apos;s performance and the latest commerce activity.
                    </p>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        icon: Package,
                        title: "Total Products",
                        value: "25,154",
                        change: "+2.5%",
                        color: "text-light-500",
                        bg: "bg-light-500/10",
                    },
                    {
                        icon: DollarSign,
                        title: "Total Paid Orders",
                        value: "$16,000",
                        change: "+12.1%",
                        color: "text-secdark-700",
                        bg: "bg-secdark-700/10",
                    },
                    {
                        icon: Users,
                        title: "Total Customers",
                        value: "15,400",
                        change: "+15.3%",
                        color: "text-light-500",
                        bg: "bg-light-500/10",
                    },
                    {
                        icon: CreditCard,
                        title: "Sales Intensity",
                        value: "12,340",
                        change: "+19.2%",
                        color: "text-secdark-700",
                        bg: "bg-secdark-700/10",
                    },
                ].map(({ icon: Icon, title, value, change, color, bg }, idx) => (
                    <div
                        key={idx}
                        className="group rounded-2xl border border-light-200/70 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-dark-700/70 dark:bg-dark-900/70"
                    >
                        <div className="flex items-center justify-between">
                            <div className={cn("p-2.5 rounded-xl transition-colors duration-300", bg, color)}>
                                <Icon size={22} />
                            </div>
                            <span className="flex items-center gap-1 text-[13px] font-bold text-emerald-500 dark:text-emerald-400">
                                <TrendingUp size={14} />
                                {change}
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-light-600 dark:text-dark-300 text-sm font-medium">{title}</p>
                            <h3 className="text-light-900 dark:text-dark-50 mt-1 text-2xl font-bold tracking-tight">{value}</h3>
                        </div>
                    </div>
                ))}
            </div>

           

        </div>
    );
};

export default DashboardPage;
