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
      {/* Ambient gradient orbs + faint particle dust behind the light canvas */}
      <div className="bg-orbs">
        <span className="orb" />
        <span className="orb" />
        <span className="orb" />
      </div>
      <ParticleBackground theme="light" />

      <Sidebar />
      <main className="app-main" style={{ position: 'relative', zIndex: 1 }}>
        <div className="page-transition" key={pageKey}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
