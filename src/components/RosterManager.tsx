import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { usePlayers, useAllRosters, useTeams, useMatches, usePointsConfig } from '../lib/hooks';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { calculatePlayerScore, getPlayerSumFromMatches, getPlayerTotalScore, getFavoriteTeamScore } from '../lib/utils';
import { Team, Player, Roster } from '../types';
import { X, Search } from 'lucide-react';

export function RosterManager() {
  const { user } = useAuth();
  const { players, loading } = usePlayers();
  const { rosters } = useAllRosters();
  const { teams } = useTeams();
  const { matches } = useMatches();
  const { pointsConfig, loading: configLoading } = usePointsConfig();
  
  const [selectedTop, setSelectedTop] = useState('');
  const [selectedJgl, setSelectedJgl] = useState('');
  const [selectedMid, setSelectedMid] = useState('');
  const [selectedAdc, setSelectedAdc] = useState('');
  const [selectedSup, setSelectedSup] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [assassin1, setAssassin1] = useState('');
  const [assassin2, setAssassin2] = useState('');
  const [assassin3, setAssassin3] = useState('');
  const [saving, setSaving] = useState(false);

  const [selectingRole, setSelectingRole] = useState<{ id: string, label: string, options: Player[], onSelect: (id: string) => void, colorScheme: 'gold' | 'red' } | null>(null);
  const [selectingTeam, setSelectingTeam] = useState<{ id: string, label: string, options: Team[], onSelect: (id: string) => void, colorScheme: 'gold' | 'red' } | null>(null);
  const [activeTab, setActiveTab] = useState<'equipo' | 'asesinos' | 'favorito'>('equipo');

  useEffect(() => {
    if (!user) return;
    const myRoster = rosters.find(r => r.userId === user.userId);
    if (myRoster) {
      setSelectedTop(myRoster.top || '');
      setSelectedJgl(myRoster.jgl || '');
      setSelectedMid(myRoster.mid || '');
      setSelectedAdc(myRoster.adc || '');
      setSelectedSup(myRoster.sup || '');
      setSelectedCoach(myRoster.coach || '');
      setFavoriteTeam(myRoster.favoriteTeam || '');
      setAssassin1(myRoster.assassin1 || '');
      setAssassin2(myRoster.assassin2 || '');
      setAssassin3(myRoster.assassin3 || '');
    }
  }, [rosters, user]);

  const autoSave = async (updates: Partial<Roster>) => {
    if (!user) return;
    setSaving(true);
    try {
      const currentRoster = rosters.find(r => r.userId === user.userId);
      if (!currentRoster) {
        const newRoster = {
          userId: user.userId,
          top: selectedTop,
          jgl: selectedJgl,
          mid: selectedMid,
          adc: selectedAdc,
          sup: selectedSup,
          coach: selectedCoach,
          favoriteTeam: favoriteTeam,
          assassin1: assassin1,
          assassin2: assassin2,
          assassin3: assassin3,
          updatedAt: Date.now(),
          ...updates
        };
        await setDoc(doc(db, 'rosters', user.userId), newRoster);
      } else {
        await setDoc(doc(db, 'rosters', user.userId), { ...updates, updatedAt: Date.now() }, { merge: true });
      }
    } catch (e: any) {
      console.error(e);
      alert("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const getPlayerOptions = (position: 'Top' | 'Jungle' | 'Mid' | 'ADC' | 'Support' | 'Coach') => {
    return players.filter(p => p.position === position);
  };

  const openSelection = (id: keyof Roster, label: string, options: Player[], setter: (v: string) => void, colorScheme: 'gold' | 'red' = 'gold') => {
    setSelectingRole({ 
      id, 
      label, 
      options, 
      onSelect: (val) => { 
        setter(val); 
        autoSave({ [id]: val }); 
      }, 
      colorScheme 
    });
  };

  const openTeamSelection = (id: keyof Roster, label: string, options: Team[], setter: (v: string) => void, colorScheme: 'gold' | 'red' = 'gold') => {
    setSelectingTeam({ 
      id, 
      label, 
      options, 
      onSelect: (val) => { 
        setter(val); 
        autoSave({ [id]: val }); 
      }, 
      colorScheme 
    });
  };

  const currentRosterIds = [selectedTop, selectedJgl, selectedMid, selectedAdc, selectedSup].filter(Boolean);
  const currentRosterPlayers = players.filter(p => currentRosterIds.includes(p.id));

  if (loading || configLoading) return <div className="text-gray-400">Cargando jugadores...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Mi Roster</h2>
            <p className="text-sm text-gray-400">Configura tu equipo, asesinos y equipo favorito.</p>
          </div>
          {saving && <span className="text-sm text-gold-500 animate-pulse">Guardando...</span>}
        </div>
        <div className="flex bg-dark-800 p-1 rounded-lg border border-dark-700">
          <button 
            onClick={() => setActiveTab('equipo')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'equipo' ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Equipo
          </button>
          <button 
            onClick={() => setActiveTab('asesinos')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'asesinos' ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Asesinos
          </button>
          <button 
            onClick={() => setActiveTab('favorito')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'favorito' ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Favorito
          </button>
        </div>
      </div>

      {activeTab === 'equipo' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <PositionCard
          label="Top Laner"
          value={selectedTop}
          onClick={() => openSelection('top', 'Top Laner', getPlayerOptions('Top'), setSelectedTop, 'gold')}
          options={players}
          teams={teams}
          matches={matches}
          pointsConfig={pointsConfig}
        />
        <PositionCard
          label="Jungler"
          value={selectedJgl}
          onClick={() => openSelection('jgl', 'Jungler', getPlayerOptions('Jungle'), setSelectedJgl, 'gold')}
          options={players}
          teams={teams}
          matches={matches}
          pointsConfig={pointsConfig}
        />
        <PositionCard
          label="Mid Laner"
          value={selectedMid}
          onClick={() => openSelection('mid', 'Mid Laner', getPlayerOptions('Mid'), setSelectedMid, 'gold')}
          options={players}
          teams={teams}
          matches={matches}
          pointsConfig={pointsConfig}
        />
        <PositionCard
          label="ADC"
          value={selectedAdc}
          onClick={() => openSelection('adc', 'ADC', getPlayerOptions('ADC'), setSelectedAdc, 'gold')}
          options={players}
          teams={teams}
          matches={matches}
          pointsConfig={pointsConfig}
        />
        <PositionCard
          label="Support"
          value={selectedSup}
          onClick={() => openSelection('sup', 'Support', getPlayerOptions('Support'), setSelectedSup, 'gold')}
          options={players}
          teams={teams}
          matches={matches}
          pointsConfig={pointsConfig}
        />
        <PositionCard
          label="Coach"
          value={selectedCoach}
          onClick={() => openSelection('coach', 'Coach', getPlayerOptions('Coach'), setSelectedCoach, 'gold')}
          options={players}
          teams={teams}
          matches={matches}
          pointsConfig={pointsConfig}
        />
      </div>
      )}

      {activeTab === 'asesinos' && (
      <div className="mt-4">
        <div className="grid gap-6 md:grid-cols-3">
          <AssassinCard
            label={`Asesino Principal (${pointsConfig.assassin1Kill} Pts/Kill)`}
            value={assassin1}
            onClick={() => openSelection('assassin1', 'Asesino Principal', players.filter(p => p.position !== 'Coach'), setAssassin1, 'red')}
            options={players}
            teams={teams}
            matches={matches}
            pointsConfig={pointsConfig}
          />
          <AssassinCard
            label={`Segundo Asesino (${pointsConfig.assassin2Kill} Pts/Kill)`}
            value={assassin2}
            onClick={() => openSelection('assassin2', 'Segundo Asesino', players.filter(p => p.position !== 'Coach'), setAssassin2, 'red')}
            options={players}
            teams={teams}
            matches={matches}
            pointsConfig={pointsConfig}
          />
          <AssassinCard
            label={`Tercer Asesino (${pointsConfig.assassin3Kill} Pts/Kill)`}
            value={assassin3}
            onClick={() => openSelection('assassin3', 'Tercer Asesino', players.filter(p => p.position !== 'Coach'), setAssassin3, 'red')}
            options={players}
            teams={teams}
            matches={matches}
            pointsConfig={pointsConfig}
          />
        </div>
      </div>
      )}

      {activeTab === 'favorito' && (
      <div className="mt-4 mb-8">
        <div className="grid gap-6 md:grid-cols-3">
          <FavoriteTeamCard
             label="Equipo Favorito"
             value={favoriteTeam}
             onClick={() => openTeamSelection('favoriteTeam', 'Equipo Favorito', teams, setFavoriteTeam, 'gold')}
             options={teams}
             matches={matches}
             pointsConfig={pointsConfig}
          />
        </div>
      </div>
      )}

      <PlayerSelectionModal 
        isOpen={!!selectingRole} 
        onClose={() => setSelectingRole(null)} 
        selectingRole={selectingRole} 
        teams={teams} 
        matches={matches}
        pointsConfig={pointsConfig}
      />
      
      <TeamSelectionModal 
        isOpen={!!selectingTeam} 
        onClose={() => setSelectingTeam(null)} 
        selectingTeam={selectingTeam} 
      />
    </div>
  );
}

function PositionCard({ label, value, onClick, options, teams, matches, pointsConfig }: { label: string, value: string, onClick: () => void, options: Player[], teams: Team[], matches: any[], pointsConfig: any }) {
  const selectedPlayer = options.find((p) => p.id === value);
  const team = selectedPlayer ? teams.find((t) => t.id === selectedPlayer.teamId) : null;

  return (
    <div 
      className="rounded-xl border border-dark-700 bg-dark-800 p-5 cursor-pointer hover:border-gold-500 transition-all hover:-translate-y-1 flex flex-col items-center justify-center min-h-[180px] text-center"
      onClick={onClick}
    >
      <div className="mb-4 text-sm font-medium text-gray-400 uppercase tracking-wider">{label}</div>
      {selectedPlayer ? (
        <div className="flex flex-col items-center gap-3">
          {selectedPlayer.imageUrl ? (
            <img src={selectedPlayer.imageUrl} alt={selectedPlayer.name} className="w-20 h-20 object-contain drop-shadow-md" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-dark-900 border-2 border-gold-500 flex items-center justify-center text-xl font-bold text-gray-500">
              {selectedPlayer.name?.slice(0,2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center justify-center gap-2 text-xl font-bold text-white tracking-wide">
              {team && team.logoUrl && <img src={team.logoUrl} className="w-5 h-5 object-contain" />}
              {team ? `${team.acronym} ` : ''}{selectedPlayer.name}
            </div>
            <div className="text-sm font-medium text-gold-400 mt-1">
              Score: {getPlayerTotalScore(selectedPlayer, teams, matches, pointsConfig).toFixed(1)} pts
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-gray-600 gap-3">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
                <span className="text-3xl font-light">+</span>
            </div>
            <span className="text-sm">Seleccionar Jugador</span>
        </div>
      )}
    </div>
  );
}

function AssassinCard({ label, value, onClick, options, teams, matches, pointsConfig }: { label: string, value: string, onClick: () => void, options: Player[], teams: Team[], matches: any[], pointsConfig: any }) {
  const selectedPlayer = options.find((p) => p.id === value);
  const team = selectedPlayer ? teams.find((t) => t.id === selectedPlayer.teamId) : null;
  const totalKills = selectedPlayer ? (selectedPlayer.kills || 0) + getPlayerSumFromMatches(selectedPlayer.id, matches).kills : 0;

  return (
    <div 
      className="rounded-xl border border-red-900/30 bg-dark-800/80 p-5 cursor-pointer hover:border-red-500 transition-all hover:-translate-y-1 flex flex-col items-center justify-center min-h-[160px] text-center"
      onClick={onClick}
    >
      <div className="mb-3 text-xs font-medium text-red-500 uppercase tracking-wider">{label}</div>
      {selectedPlayer ? (
        <div className="flex flex-col items-center gap-2">
          {selectedPlayer.imageUrl ? (
            <img src={selectedPlayer.imageUrl} alt={selectedPlayer.name} className="w-16 h-16 object-contain drop-shadow-md" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-dark-900 border-2 border-red-500 flex items-center justify-center text-lg font-bold text-gray-500">
              {selectedPlayer.name?.slice(0,2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center justify-center gap-1.5 text-lg font-bold text-white">
              {team && team.logoUrl && <img src={team.logoUrl} className="w-4 h-4 object-contain" />}
              {team ? `${team.acronym} ` : ''}{selectedPlayer.name} <span className="text-xs text-gray-400 font-normal">({selectedPlayer.position})</span>
            </div>
            <div className="text-sm font-bold text-red-400 mt-0.5">
              {totalKills} Kills
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-red-900/40 gap-2">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-red-900/40 flex items-center justify-center">
                <span className="text-2xl font-light">+</span>
            </div>
            <span className="text-sm">Seleccionar Asesino</span>
        </div>
      )}
    </div>
  );
}

function PlayerSelectionModal({ isOpen, onClose, selectingRole, teams, matches, pointsConfig }: any) {
  const [search, setSearch] = useState('');

  if (!isOpen || !selectingRole) return null;

  const { label, options, onSelect, colorScheme } = selectingRole;
  
  const borderHover = colorScheme === 'red' ? 'hover:border-red-500' : 'hover:border-gold-500';

  const filteredOptions = options.filter((p: Player) => {
    const team = teams.find((t: Team) => t.id === p.teamId);
    const searchLower = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(searchLower) ||
      p.position?.toLowerCase().includes(searchLower) ||
      (team && team.name?.toLowerCase().includes(searchLower)) ||
      (team && team.acronym?.toLowerCase().includes(searchLower))
    );
  });

  return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-4 border-b border-dark-700 bg-dark-900 shrink-0">
                  <h3 className="font-bold text-lg text-white">Seleccionar {label}</h3>
                  <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              <div className="p-4 border-b border-dark-700 bg-dark-900/50 shrink-0">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                   <input 
                     type="text" 
                     placeholder="Buscar jugador, equipo o posición..." 
                     value={search}
                     onChange={e => setSearch(e.target.value)}
                     className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold-500"
                   />
                 </div>
              </div>
              
              <div className="p-4 overflow-y-auto grid gap-3 sm:grid-cols-2">
                  {filteredOptions.map((p: Player) => {
                      const team = teams.find((t: Team) => t.id === p.teamId);
                      
                      return (
                          <div 
                              key={p.id} 
                              onClick={() => { onSelect(p.id); onClose(); }}
                              className={`flex items-center gap-3 p-3 rounded-lg border border-dark-700 bg-dark-900 cursor-pointer transition-colors hover:bg-dark-800 ${borderHover}`}
                          >
                              {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-14 h-14 object-contain drop-shadow-md" />
                              ) : (
                                  <div className="w-12 h-12 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center font-bold text-gray-500">
                                      {p.name.slice(0,2).toUpperCase()}
                                  </div>
                              )}
                              <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                      <div className="font-bold text-white truncate">{team ? `${team.acronym} ` : ''}{p.name}</div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                      {colorScheme === 'red' ? (
                                          <span className="text-xs font-medium text-red-400 whitespace-nowrap">{p.position} - {(p.kills || 0) + getPlayerSumFromMatches(p.id, matches).kills} Kills</span>
                                      ) : (
                                          <span className="text-xs font-medium text-gold-400 whitespace-nowrap">Score: {getPlayerTotalScore(p, teams, matches, pointsConfig).toFixed(1)}</span>
                                      )}
                                  </div>
                              </div>
                              {team && team.logoUrl && (
                                  <img src={team.logoUrl} className="w-11 h-11 object-contain opacity-60 shrink-0 ml-2 mr-4" />
                              )}
                          </div>
                      );
                  })}
                  {filteredOptions.length === 0 && (
                      <div className="col-span-1 sm:col-span-2 py-8 text-center text-gray-500">
                          No hay jugadores disponibles.
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
}

function FavoriteTeamCard({ label, value, onClick, options, matches, pointsConfig }: { label: string, value: string, onClick: () => void, options: Team[], matches: any[], pointsConfig: any }) {
  const selectedTeam = options.find((t) => t.id === value);

  return (
    <div 
      className="rounded-xl border border-dark-700 bg-dark-800 p-5 cursor-pointer hover:border-gold-500 transition-all hover:-translate-y-1 flex flex-col items-center justify-center min-h-[160px] text-center"
      onClick={onClick}
    >
      <div className="mb-3 text-xs font-medium text-gold-400 uppercase tracking-wider">{label}</div>
      {selectedTeam ? (
        <div className="flex flex-col items-center gap-2">
          {selectedTeam.logoUrl ? (
            <img src={selectedTeam.logoUrl} alt={selectedTeam.name} className="w-16 h-16 object-contain drop-shadow-md" />
          ) : (
            <div className="w-14 h-14 rounded bg-dark-900 border-2 border-gold-500 flex items-center justify-center text-lg font-bold text-gray-500">
              {selectedTeam.acronym?.slice(0,3).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col items-center justify-center gap-1 mt-1">
            <span className="text-lg font-bold text-white">{selectedTeam.name}</span>
            <span className="text-sm font-medium text-gold-400">Score: {getFavoriteTeamScore(selectedTeam.id, options, matches, pointsConfig)} pts</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-gray-600 gap-2">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
                <span className="text-2xl font-light">+</span>
            </div>
            <span className="text-sm">Seleccionar Equipo</span>
        </div>
      )}
    </div>
  );
}

function TeamSelectionModal({ isOpen, onClose, selectingTeam }: any) {
  const [search, setSearch] = useState('');

  if (!isOpen || !selectingTeam) return null;

  const { label, options, onSelect } = selectingTeam;

  const filteredOptions = options.filter((t: Team) => {
    const searchLower = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(searchLower) ||
      t.acronym?.toLowerCase().includes(searchLower) ||
      t.region?.toLowerCase().includes(searchLower)
    );
  });

  return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-4 border-b border-dark-700 bg-dark-900 shrink-0">
                  <h3 className="font-bold text-lg text-white">Seleccionar {label}</h3>
                  <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              <div className="p-4 border-b border-dark-700 bg-dark-900/50 shrink-0">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                   <input 
                     type="text" 
                     placeholder="Buscar equipo..." 
                     value={search}
                     onChange={e => setSearch(e.target.value)}
                     className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold-500"
                   />
                 </div>
              </div>
              
              <div className="p-4 overflow-y-auto grid gap-3 sm:grid-cols-3">
                  {filteredOptions.map((t: Team) => (
                      <div 
                          key={t.id} 
                          onClick={() => { onSelect(t.id); onClose(); }}
                          className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-dark-700 bg-dark-900 cursor-pointer transition-all hover:-translate-y-1 hover:border-gold-500`}
                      >
                          {t.logoUrl ? (
                              <img src={t.logoUrl} alt={t.name} className="w-16 h-16 object-contain drop-shadow-md" />
                          ) : (
                              <div className="w-16 h-16 rounded bg-dark-800 border border-dark-600 flex items-center justify-center font-bold text-gray-500 text-xl">
                                  {t.acronym}
                              </div>
                          )}
                          <div className="text-center">
                              <div className="font-bold text-white text-sm">{t.name}</div>
                              <div className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">{t.region}</div>
                          </div>
                      </div>
                  ))}
                  {filteredOptions.length === 0 && (
                      <div className="col-span-1 sm:col-span-3 py-8 text-center text-gray-500">
                          Ningún equipo coincide con la búsqueda.
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
}

