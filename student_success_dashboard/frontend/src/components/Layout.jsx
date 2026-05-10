import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ParticleBackground from './ParticleBackground';

export default function Layout() {
  const location = useLocation();
  const [pageKey, setPageKey] = useState(location.pathname);

  useEffect(() => {
    setPageKey(location.pathname);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      {/* Three.js animated particle network */}
      <ParticleBackground />

      <Sidebar />
      <main className="app-main" style={{ position: 'relative', zIndex: 1 }}>
        <div className="page-transition" key={pageKey}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
