import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Link } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import NavBar from './components/NavBar';
import Landing from './components/Landing';
import SignIn from './components/VigilKura';
import Profile from './components/Profile';
import Monitor from './components/Monitor';
import Settings from './components/Settings';
import History from './components/History';
import Legal from './components/Legal';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import ResetPasswordForm from './components/ResetPasswordForm';

// Footer shown on every page — links to the combined legal page
const Footer = () => (
    <footer style={{
        marginTop: 'auto',
        padding: '16px',
        textAlign: 'center',
        borderTop: '1px solid #e0e0e0',
        fontSize: '0.75rem',
        color: '#9e9e9e',
    }}>
        <Link to="/legal" style={{ color: 'inherit' }}>Privacy & Terms</Link>
    </footer>
);

// Layout wraps every page — nav on top, footer pinned to bottom
const Layout = () => (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavBar />
        <div style={{ flex: 1 }}>
            <Outlet />
        </div>
        <Footer />
    </div>
);

const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            { path: '/', element: <Landing /> },
            { path: '/vigilkura', element: <SignIn /> },
            { path: '/monitor', element: <Monitor /> },
            { path: '/settings', element: <Settings /> },
            { path: '/history', element: <History /> },
            { path: '/user/:username', element: <Profile /> },
            { path: '/legal', element: <Legal /> },
            { path: '/forgot-password', element: <ForgotPasswordForm /> },
            { path: '/reset-password', element: <ResetPasswordForm /> },
            { path: '*', element: <SignIn /> },
        ],
    },
]);

const App = () => (
    <AuthProvider>
        <RouterProvider router={router} />
    </AuthProvider>
);

export default App;
