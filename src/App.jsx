import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/themeContext";
import { LangProvider } from "./contexts/langContext";
import Layout from "./routes/Layout";
import DashboardPage from "./routes/dashboard/page";
import OnboardingPage from "./routes/onboarding/page";
import ClientsPage from "./routes/clients/page";
import ClientDetailPage from "./routes/clients/detail/page";
import PlanningPage from "./routes/planning/page";
import CampaignsPage from "./routes/campaigns/page";
import PackagesPage from "./routes/packages/page";
import ContractPage from "./routes/contracts/page";
import ReportsPage from "./routes/reports/page";

function App() {
    // React Router basename should match the build base. Vite exposes the base via import.meta.env.BASE_URL
    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    const router = createBrowserRouter(
        [
            {
                path: "/",
                element: <Layout />,
                children: [
                    { index: true, element: <DashboardPage /> },
                    { path: "onboarding", element: <OnboardingPage /> },
                    { path: "clients", element: <ClientsPage /> },
                    { path: "clients/:id", element: <ClientDetailPage /> },
                    { path: "planning", element: <PlanningPage /> },
                    { path: "campaigns", element: <CampaignsPage /> },
                    { path: "packages", element: <PackagesPage /> },
                    { path: "contracts", element: <ContractPage /> },
                    { path: "reports", element: <ReportsPage /> },
                ],
            },
            {
                path: "analytics",
                element: <h1 className="title">Analytics</h1>,
            },
            {
                path: "users",
                element: <h1 className="title">Users</h1>,
            },
            {
                path: "services",
                element: <h1 className="title">Services</h1>,
            },
            {
                path: "strategies",
                element: <h1 className="title">Strategies</h1>,
            },
        ],
        {
            basename: base,
        },
    );
    return (
        <LangProvider>
            <ThemeProvider storageKey="theme">
                <RouterProvider router={router}></RouterProvider>
            </ThemeProvider>
        </LangProvider>
    );
}

export default App;
