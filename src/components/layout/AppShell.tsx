/**
 * AppShell - Main layout component with sidebar navigation and content area.
 * Features glassmorphism design with subtle background blur.
 */
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="flex w-full">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
