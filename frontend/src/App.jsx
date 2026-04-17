import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { LanguageProvider } from './i18n/LanguageContext';
import LanguageToggle from './components/LanguageToggle';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import CustomerLogin from './pages/CustomerLogin';
import CustomerSignUp from './pages/CustomerSignUp';
import Dashboard from './pages/Dashboard';
import FlaggedAccounts from './pages/FlaggedAccounts';
import Customer360 from './pages/Customer360';
import CustomerPortal from './pages/CustomerPortal';
import FraudReview from './pages/FraudReview';
import InterventionQueue from './pages/InterventionQueue';
import MSMEProfile from './pages/MSMEProfile';
import RetailProfile from './pages/RetailProfile';
import SupplyChainGraph from './pages/SupplyChainGraph';

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem('vc_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/customer-login" element={<CustomerLogin />} />
            <Route path="/customer-signup" element={<CustomerSignUp />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/flagged" element={<ProtectedRoute><FlaggedAccounts /></ProtectedRoute>} />
            <Route path="/customer/:id" element={<ProtectedRoute><Customer360 /></ProtectedRoute>} />
            <Route path="/customer/:id/retail" element={<ProtectedRoute><RetailProfile /></ProtectedRoute>} />
            <Route path="/customer/:id/msme" element={<ProtectedRoute><MSMEProfile /></ProtectedRoute>} />
            <Route path="/interventions" element={<ProtectedRoute><InterventionQueue /></ProtectedRoute>} />
            <Route path="/fraud" element={<ProtectedRoute><FraudReview /></ProtectedRoute>} />
            <Route path="/supply-chain" element={<ProtectedRoute><SupplyChainGraph /></ProtectedRoute>} />
            <Route path="/portal/:id" element={<ProtectedRoute><CustomerPortal /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <LanguageToggle />
        </ToastProvider>
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
