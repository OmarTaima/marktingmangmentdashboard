import { recentSalesData, topProducts } from "../../constants";
import { CreditCard, DollarSign, Package, PencilLine, Star, Trash, TrendingUp, Users } from "lucide-react";
import { Footer } from "../../Layouts/Footer";
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-4 flex flex-col rounded-3xl border border-light-200/70 bg-white/90 p-5 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/70">
                    <div className="flex items-center justify-between">
                        <h2 className="text-light-900 dark:text-dark-50 text-lg font-semibold">Recent Activity</h2>
                        <button className="text-light-500 dark:text-secdark-400 text-xs font-bold hover:underline">View all</button>
                    </div>
                    <div className="mt-4 flex flex-col gap-1 overflow-auto max-h-[400px] pr-1 scrollbar-thin">
                        {recentSalesData.map((sale) => (
                            <div
                                key={sale.id}
                                className="group flex items-center justify-between gap-x-4 rounded-xl p-3 transition-colors hover:bg-light-50 dark:hover:bg-dark-800/50"
                            >
                                <div className="flex items-center gap-x-3">
                                    <div className="relative">
                                        <img
                                            src={sale.image}
                                            alt={sale.name}
                                            className="size-10 flex-shrink-0 rounded-xl object-cover ring-2 ring-light-100 dark:ring-dark-800 group-hover:ring-light-200 dark:group-hover:ring-dark-700 transition-all"
                                        />
                                        <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-dark-900" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-light-900 dark:text-dark-50 text-sm font-bold leading-tight">{sale.name}</p>
                                        <p className="text-light-400 dark:text-dark-500 text-[12px] truncate max-w-[120px]">{sale.email}</p>
                                    </div>
                                </div>
                                <p className="text-light-900 dark:text-dark-50 text-sm font-bold tracking-tight">${sale.total}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-8 overflow-hidden rounded-3xl border border-light-200/70 bg-white/90 p-5 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/70">
                    <div className="flex items-center justify-between">
                        <h2 className="text-light-900 dark:text-dark-50 text-lg font-semibold">Top Performance</h2>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="table">
                            <thead className="table-header">
                                <tr className="table-row border-none hover:bg-transparent">
                                    <th className="table-head">Product</th>
                                    <th className="table-head">Price</th>
                                    <th className="table-head">Status</th>
                                    <th className="table-head">Rating</th>
                                    <th className="table-head text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="table-body">
                                {topProducts.map((product) => (
                                    <tr
                                        key={product.number}
                                        className="table-row group"
                                    >
                                        <td className="table-cell">
                                            <div className="flex items-center gap-x-4">
                                                <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-light-100 dark:bg-dark-800 p-1">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="h-full w-full rounded-lg object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-sm font-bold text-light-900 dark:text-dark-50">{product.name}</p>
                                                    <p className="text-light-400 dark:text-dark-500 text-xs">{product.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="table-cell font-bold">${product.price}</td>
                                        <td className="table-cell">
                                            <span className={cn(
                                                "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold ring-1 ring-inset",
                                                product.status === "Delivered" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400"
                                            )}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex items-center gap-1.5">
                                                <Star
                                                    size={14}
                                                    className="fill-amber-400 stroke-amber-400"
                                                />
                                                <span className="font-bold">{product.rating}</span>
                                            </div>
                                        </td>
                                        <td className="table-cell text-center">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-light-100 dark:hover:bg-dark-800 rounded-lg text-light-600 dark:text-dark-400 transition-colors">
                                                    <PencilLine size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-lg text-danger-500 transition-colors">
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default DashboardPage;
