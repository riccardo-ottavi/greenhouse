
import './App.scss'
import SensorsPage from './pages/SensorsPage';
import SensorDetailPage from './pages/SensorDetailPage';
import ActuatorDetailPage from './pages/ActuatorDetailPage';
import ActuatorsPage from './pages/ActuatorsPage';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import DefaultLayout from './layouts/DefaultLayout';
import DeviceHomePage from './pages/DeviceHomePage';
import HomePage from './pages/HomePage';

function ComingSoonPage({ title }: { title: string }) {
  return (
    <main className="page">
      <h1>{title}</h1>
      <p>This section is currently under development.</p>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="page">
      <h1>404 - Page not found</h1>
      <p>The page you are looking for does not exist.</p>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultLayout />}>
          <Route index element={<HomePage />} />

          <Route path="devices/:id" element={<DeviceHomePage />} />

          <Route
            path="devices/:id/sensors"
            element={<SensorsPage />}
          />

          <Route
            path="devices/:id/sensors/:sensorId"
            element={<SensorDetailPage />}
          />

          <Route
            path="devices/:id/actuators"
            element={<ActuatorsPage />}
          />

          <Route
            path="devices/:id/actuators/:actuatorId"
            element={<ActuatorDetailPage />}
          />
          <Route
            path="devices/:id/trends"
            element={<ComingSoonPage title="Trends" />}
          />

          <Route
            path="devices/:id/alerts"
            element={<ComingSoonPage title="Alerts" />}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
