import { recentSalesData, topProducts } from "../../constants";
import { useTheme } from "next-themes";
import { CreditCard, DollarSign, Package, PencilLine, Star, Trash, TrendingUp, Users } from "lucide-react";
import { Footer } from "../../Layouts/Footer";

const DashboardPage = () => {
    useTheme();

    return (
        <div className="flex flex-col gap-6 px-3 sm:px-4 md:px-6 lg:px-8">
            {/* Page Title */}
            <h1 className="title text-2xl font-semibold md:text-3xl">Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[
                    {
                        icon: Package,
                        title: "Total Products",
                        value: "25,154",
                        change: "25%",
                    },
                    {
                        icon: DollarSign,
                        title: "Total Paid Orders",
                        value: "$16,000",
                        change: "12%",
                    },
                    {
                        icon: Users,
                        title: "Total Customers",
                        value: "15,400k",
                        change: "15%",
                    },
                    {
                        icon: CreditCard,
                        title: "Sales",
                        value: "12,340",
                        change: "19%",
                    },
                ].map(({ icon: Icon, title, value, change }, idx) => (
                    <div
                        key={idx}
                        className="card"
                    >
                        <div className="card-header">
                            <div className="bg-light-500/20 text-light-500 dark:bg-secdark-700/20 dark:text-secdark-700 w-fit rounded-lg p-2 transition-colors">
                                <Icon size={26} />
                            </div>
                            <p className="card-title">{title}</p>
                        </div>
                        <div className="card-body bg-light-500/20 dark:bg-dark-950 transition-colors">
                            <p className="text-light-900 dark:text-dark-50 text-2xl font-bold transition-colors sm:text-3xl">{value}</p>
                            <span className="border-light-500 text-light-500 dark:border-secdark-700 dark:text-secdark-700 flex w-fit items-center gap-x-2 rounded-full border px-2 py-1 text-sm font-medium">
                                <TrendingUp size={16} />
                                {change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Overview + Recent Sales */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
                {/* Recent Sales */}
                <div className="card xl: col-span-1 lg:col-span-7">
                    <div className="card-header">
                        <p className="card-title">Recent Sales</p>
                    </div>
                    <div className="card-body h-[250px] overflow-auto p-0 sm:h-[300px]">
                        {recentSalesData.map((sale) => (
                            <div
                                key={sale.id}
                                className="flex items-center justify-between gap-x-4 px-3 py-2"
                            >
                                <div className="flex items-center gap-x-3">
                                    <img
                                        src={sale.image}
                                        alt={sale.name}
                                        className="size-9 flex-shrink-0 rounded-full object-cover sm:size-10"
                                    />
                                    <div className="flex flex-col">
                                        <p className="text-light-900 dark:text-dark-50 text-sm font-medium sm:text-base">{sale.name}</p>
                                        <p className="text-light-600 dark:text-dark-400 text-xs sm:text-sm">{sale.email}</p>
                                    </div>
                                </div>
                                <p className="text-light-900 dark:text-dark-50 text-sm font-medium sm:text-base">${sale.total}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Orders Table */}
            <div className="card overflow-x-auto">
                <div className="card-header">
                    <p className="card-title">Top Orders</p>
                </div>
                <div className="card-body p-0">
                    <table className="table min-w-[700px] sm:min-w-full">
                        <thead className="table-header">
                            <tr className="table-row">
                                <th className="table-head">#</th>
                                <th className="table-head">Product</th>
                                <th className="table-head">Price</th>
                                <th className="table-head">Status</th>
                                <th className="table-head">Rating</th>
                                <th className="table-head">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="table-body">
                            {topProducts.map((product) => (
                                <tr
                                    key={product.number}
                                    className="table-row"
                                >
                                    <td className="table-cell">{product.number}</td>
                                    <td className="table-cell">
                                        <div className="flex items-center gap-x-3 sm:gap-x-4">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="size-10 rounded-lg object-cover sm:size-14"
                                            />
                                            <div className="flex flex-col">
                                                <p className="text-sm sm:text-base">{product.name}</p>
                                                <p className="text-light-600 dark:text-dark-400 text-xs sm:text-sm">{product.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="table-cell">${product.price}</td>
                                    <td className="table-cell">{product.status}</td>
                                    <td className="table-cell">
                                        <div className="flex items-center gap-x-1 sm:gap-x-2">
                                            <Star
                                                size={16}
                                                className="fill-yellow-600 stroke-yellow-600"
                                            />
                                            {product.rating}
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex items-center gap-x-3">
                                            <button className="text-light-500 dark:text-secdark-700">
                                                <PencilLine size={18} />
                                            </button>
                                            <button className="text-danger-500">
                                                <Trash size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default DashboardPage;
