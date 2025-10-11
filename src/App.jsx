import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/themeContext";
import Layout from "./routes/Layout";
import DashboardPage from "./routes/dashboard/page";

function App() {
    const router = createBrowserRouter(
        [
            {
                path: "/",
                element: <Layout />,
                children: [{ index: true, element: <DashboardPage /> }],
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
            basename: "/marktingmangmentdashboard",
        },
    );
    return (
        <ThemeProvider storageKey="theme">
            <RouterProvider router={router}></RouterProvider>
        </ThemeProvider>
    );
}

export default App;
