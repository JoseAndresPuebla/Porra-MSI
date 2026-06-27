import { useState } from 'react';
import { useAuth, AuthProvider } from './AuthContext';
import { Trophy, Users, Swords, Settings, LogOut, LogIn, GitMerge } from 'lucide-react';
import { cn } from './lib/utils';
import { RosterManager } from './components/RosterManager';
import { Leaderboard } from './components/Leaderboard';
import { MatchPredictions } from './components/MatchPredictions';
import { AdminPanel } from './components/AdminPanel';
import { Brackets } from './components/Brackets';

function MainApp() {
  const { user, isAdmin, loading, signIn, logOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'roster' | 'predictions' | 'brackets' | 'admin-players' | 'admin-teams' | 'admin-matches' | 'admin-users' | 'admin-points'>('leaderboard');
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gold-500">Cargando...</div>;
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
          <Trophy className="h-10 w-10 text-gold-400" />
          MSI Porra <span className="text-gold-400">2026</span>
        </h1>
        <p className="text-gray-400 max-w-md text-center">
          Inicia sesión para crear tu roster de ensueño, predecir los partidos y ganar puntos basados en el rendimiento real del Mid-Season Invitational.
        </p>
        <button
          onClick={signIn}
          className="flex items-center gap-2 rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-dark-900 transition-colors hover:bg-gold-400"
        >
          <LogIn className="h-5 w-5" />
          Entrar con Google
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'leaderboard', label: 'Clasificación', icon: Trophy },
    { id: 'roster', label: 'Mi Roster', icon: Users },
    { id: 'predictions', label: 'Predicciones', icon: Swords },
    { id: 'brackets', label: 'Torneo', icon: GitMerge },
  ] as const;

  const adminTabs = [
    { id: 'admin-players', label: 'Jugadores' },
    { id: 'admin-teams', label: 'Equipos' },
    { id: 'admin-matches', label: 'Partidos' },
    { id: 'admin-users', label: 'Usuarios' },
    { id: 'admin-points', label: 'Puntos' },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-r border-dark-700 bg-dark-800 md:w-64 flex flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-dark-700 px-6">
          <Trophy className="h-6 w-6 text-gold-400" />
          <span className="text-lg font-bold">MSI Porra</span>
        </div>
        <nav className="flex-1 space-y-1 p-4 flex flex-col overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 min-w-max md:min-w-0 md:w-full transition-colors text-sm font-medium',
                  activeTab === tab.id
                    ? 'bg-gold-500/10 text-gold-400'
                    : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}

          {isAdmin && (
            <div className="pt-2">
              <button
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className="flex items-center justify-between w-full rounded-lg px-4 py-3 transition-colors text-sm font-medium text-gray-400 hover:bg-dark-700 hover:text-white"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  Administrar
                </div>
                <span className="text-xs transition-transform" style={{ transform: adminMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
              </button>
              
              {adminMenuOpen && (
                <div className="ml-4 mt-1 space-y-1 pl-4 border-l border-dark-700">
                  {adminTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-2 w-full transition-colors text-sm font-medium',
                        activeTab === tab.id
                          ? 'bg-red-500/10 text-red-400'
                          : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
        <div className="border-t border-dark-700 p-4">
          <div className="flex items-center gap-3 mb-4">
            <img src={user.photoURL} alt="Profile" className="h-10 w-10 rounded-full border border-dark-700 bg-dark-900" />
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-white">{user.displayName}</p>
            </div>
          </div>
          <button
            onClick={logOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-dark-700"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-5xl">
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'roster' && <RosterManager />}
          {activeTab === 'predictions' && <MatchPredictions />}
          {activeTab === 'brackets' && <Brackets />}
          {isAdmin && activeTab.startsWith('admin-') && <AdminPanel activeSection={activeTab.replace('admin-', '')} />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
