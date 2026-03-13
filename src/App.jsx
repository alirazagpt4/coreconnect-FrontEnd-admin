import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

// Components aur Pages imports
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Stores from './pages/Stores';
import Items from './pages/Items';
import AttendanceReport from './pages/AttendanceReport';
import SalesReport from './pages/SalesReport';
import SummaryReport from './pages/SummarySaleReport';
import ShortItemsReport from './pages/ShortItemsReport';
import InterceptionReport from './pages/InterceptionReport'

function App() {
  // AuthContext se token nikalna taake check kar sakein banda login hai ya nahi
  const { token } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        {/* 1. Login Route: Agar token hai toh seedha Users pe bhej do, warna Login dikhao */}
        <Route
          path="/login"
          element={!token ? <Login /> : <Navigate to="/users" />}
        />

        {/* 2. Protected Routes: Ye routes sirf tabhi chalenge jab token hoga */}
        <Route
          path="/"
          element={token ? <Layout /> : <Navigate to="/login" />}
        >
          {/* Default page jab user "/" pe aaye */}
          <Route index element={<Navigate to="/users" />} />

          {/* Main Pages jo Layout (Header+Sidebar) ke andar render honge */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />

          <Route path="stores" element={<Stores />} />
          <Route path="items" element={<Items />} />
          <Route path="attendance-report" element={<AttendanceReport />} />
          <Route path="sales-report" element={<SalesReport />} />
          <Route path="summary-report" element={<SummaryReport />} />
          <Route path="short-items-report" element={<ShortItemsReport />} />
          <Route path="interception-report" element={<InterceptionReport />} />



        </Route>

        {/* 3. Catch All: Agar koi galat URL likhe toh status ke mutabiq redirect karein */}
        <Route path="*" element={<Navigate to={token ? "/users" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;