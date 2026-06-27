import React, { useState } from 'react';
import { usePlayers, useMatches, useTeams, useAllUsers, useAllRosters, usePointsConfig, DEFAULT_POINTS_CONFIG } from '../lib/hooks';
import { db } from '../lib/firebase';
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, X, Trash2, AlertTriangle, Edit, RefreshCw, Save } from 'lucide-react';
import { generateId } from '../lib/id';
import { AlertModal } from './AlertModal';
import { ConfirmModal } from './ConfirmModal';
import { Team, Player, Match, Roster } from '../types';
import { cleanMatches } from '../lib/data';
import { getPlayerSumFromMatches } from '../lib/utils';

export const BRACKET_POSITIONS = {
  'play-in': [
    { id: 'PI_UR1_1', label: 'Upper R1 - Partido 1' },
    { id: 'PI_UR1_2', label: 'Upper R1 - Partido 2' },
    { id: 'PI_UR2_1', label: 'Upper R2 - Final de Ganadores' },
    { id: 'PI_LR1_1', label: 'Lower R1 - Partido Eliminación' },
    { id: 'PI_LR2_1', label: 'Lower R2 - Decisivo' },
    { id: 'PI_QUAL', label: 'Round 3 - Partido de Clasificación' },
  ],
  'main-stage': [
    { id: 'MS_UR1_1', label: 'Upper R1 - Upper Partido 1' },
    { id: 'MS_UR1_2', label: 'Upper R1 - Upper Partido 2' },
    { id: 'MS_UR1_3', label: 'Upper R1 - Upper Partido 3' },
    { id: 'MS_UR1_4', label: 'Upper R1 - Upper Partido 4' },
    { id: 'MS_UR2_1', label: 'Upper R2 - Semifinal 1' },
    { id: 'MS_UR2_2', label: 'Upper R2 - Semifinal 2' },
    { id: 'MS_UR4_1', label: 'Upper R4 - Final Upper' },
    { id: 'MS_LR1_1', label: 'Lower R1 - Lower Partido 1' },
    { id: 'MS_LR1_2', label: 'Lower R1 - Lower Partido 2' },
    { id: 'MS_LR2_1', label: 'Lower R2 - Lower Partido 1' },
    { id: 'MS_LR2_2', label: 'Lower R2 - Lower Partido 2' },
    { id: 'MS_LR3_1', label: 'Lower R3 - Semifinal' },
    { id: 'MS_LR4_1', label: 'Lower R4 - Final Lower' },
    { id: 'MS_FINAL', label: 'Grand Final' },
  ]
};

export function AdminPanel({ activeSection }: { activeSection: string }) {
  const { players } = usePlayers();
  const { matches } = useMatches();
  const { teams } = useTeams();
  const { rosters } = useAllRosters();

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  const openEditTeam = (team: Team) => {
    setTeamToEdit(team);
    setIsTeamModalOpen(true);
  };

  const openNewTeam = () => {
    setTeamToEdit(null);
    setIsTeamModalOpen(true);
  };

  const openEditPlayer = (player: Player) => {
    setPlayerToEdit(player);
    setIsPlayerModalOpen(true);
  };

  const openNewPlayer = () => {
    setPlayerToEdit(null);
    setIsPlayerModalOpen(true);
  };

  const [purging, setPurging] = useState(false);
  
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: 'success'|'error'}>({
    isOpen: false, title: '', message: '', type: 'success'
  });

  const [confirmInfo, setConfirmInfo] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  const showAlert = (title: string, message: string, type: 'success'|'error') => {
    setAlertInfo({ isOpen: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmInfo({ isOpen: true, title, message, onConfirm });
  };

  const handleDeleteTeam = (id: string, name: string) => {
    showConfirm(
      "Eliminar Equipo",
      `¿Seguro que quieres eliminar el equipo ${name}?`,
      async () => {
        try {
          await deleteDoc(doc(db, 'teams', id));
          showAlert("Equipo Eliminado", `El equipo ${name} ha sido eliminado.`, "success");
        } catch(e) {
          console.error(e);
          showAlert("Error", "No se pudo eliminar el equipo.", "error");
        }
      }
    );
  };

  const handlePurgePlayers = () => {
    showConfirm(
      "Eliminar Jugadores",
      "¿Estás seguro de que quieres eliminar TODOS los jugadores actuales?",
      async () => {
        setPurging(true);
        try {
          for(const p of players) {
            await deleteDoc(doc(db, 'players', p.id));
          }
          showAlert("Jugadores eliminados", "Se han eliminado todos los jugadores antiguos.", "success");
        } catch(e) {
          console.error(e);
          showAlert("Error", "Hubo un error al eliminar jugadores.", "error");
        } finally {
          setPurging(false);
        }
      }
    );
  };

  const { users } = useAllUsers();

  const handleDeleteMatch = (id: string) => {
    showConfirm("Eliminar Partido", `¿Eliminar el partido actual?`, async () => {
      try { await deleteDoc(doc(db, 'matches', id)); showAlert("Éxito", "Partido eliminado.", "success"); }
      catch(e) { showAlert("Error", "No se pudo eliminar el partido.", "error"); }
    });
  };

  const handleCleanData = () => {
    showConfirm("Limpiar Base de Datos (Migración)", "¿Seguro que quieres borrar todos los partidos y predicciones de la DB antigua para empezar limpio el nuevo torneo?", async () => {
      setPurging(true);
      try {
        const result = await cleanMatches();
        showAlert("Base de Datos Limpia", `Se han borrado ${result.deletedMatches} partidos y ${result.deletedPredictions} predicciones.`, "success");
      } catch(e) {
        console.error(e);
        showAlert("Error", "Fallo al limpiar la DB.", "error");
      } finally {
        setPurging(false);
      }
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-red-500">Panel de Administración</h2>
        <p className="text-sm text-gray-400 capitalize">Gestión de {activeSection}</p>
      </div>

      {activeSection === 'teams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-dark-700 pb-2">
             <h3 className="text-xl font-bold text-white">Equipos Activos</h3>
             <button onClick={openNewTeam} className="flex items-center gap-2 px-3 py-1.5 bg-dark-700 rounded-lg text-white font-semibold text-sm hover:bg-dark-600 transition-colors">
               <Plus className="h-4 w-4" /> Nuevo Equipo
             </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((t: Team) => (
              <div key={t.id} className="border border-dark-700 bg-dark-800 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {t.logoUrl ? (
                    <img src={t.logoUrl} alt={t.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <div className="w-10 h-10 bg-dark-900 rounded flex items-center justify-center text-xs font-bold text-gray-500">
                      {t.acronym}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-white">{t.name}</span>
                    <span className="text-sm text-gold-400 font-mono">[{t.acronym}] - {t.region}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditTeam(t)} className="text-gray-400 hover:text-white p-2"><Edit className="h-4 w-4"/></button>
                  <button onClick={() => handleDeleteTeam(t.id, t.name)} className="text-red-500 hover:text-red-400 p-2"><Trash2 className="h-4 w-4"/></button>
                </div>
              </div>
            ))}
            {teams.length === 0 && <p className="text-gray-500">No hay equipos registrados.</p>}
          </div>
        </div>
      )}

      {activeSection === 'players' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-dark-700 pb-2">
             <div className="flex items-center gap-4">
               <h3 className="text-xl font-bold text-white">Estadísticas de Jugadores</h3>
               <button onClick={openNewPlayer} className="flex items-center gap-2 px-3 py-1.5 bg-dark-700 rounded-lg text-white font-semibold text-sm hover:bg-dark-600 transition-colors">
                 <Plus className="h-4 w-4" /> Nuevo
               </button>
             </div>
             {players.length > 0 && (
               <button onClick={handlePurgePlayers} disabled={purging} className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-white bg-red-900/40 hover:bg-red-500/80 px-3 py-1.5 rounded transition-colors disabled:opacity-50">
                 <AlertTriangle className="h-3 w-3" />
                 {purging ? 'Eliminando...' : 'Eliminar Todos'}
               </button>
             )}
          </div>
          <div className="overflow-x-auto rounded-xl border border-dark-700 bg-dark-800">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-dark-900 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Jugador / Equipo</th>
                  <th className="px-4 py-3 text-center w-20">Kills</th>
                  <th className="px-4 py-3 text-center w-20">Deaths</th>
                  <th className="px-4 py-3 text-center w-20">Assists</th>
                  <th className="px-4 py-3 text-center w-24">CS</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {players.map(p => (
                  <PlayerStatRow key={p.id} player={p} teams={teams} matches={matches} showAlert={showAlert} showConfirm={showConfirm} onEdit={() => openEditPlayer(p)} />
                ))}
                {players.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No hay jugadores registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'matches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-dark-700 pb-2">
             <div className="flex items-center gap-4">
               <h3 className="text-xl font-bold text-white">Partidos</h3>
               <button onClick={handleCleanData} disabled={purging} className="flex items-center gap-2 px-3 py-1.5 bg-red-900/40 rounded-lg text-red-400 font-semibold text-xs hover:bg-red-500/80 hover:text-white transition-colors disabled:opacity-50">
                 <RefreshCw className={`h-3 w-3 ${purging ? 'animate-spin' : ''}`} /> Limpiar BD
               </button>
             </div>
             <button onClick={() => setIsMatchModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-dark-700 rounded-lg text-white font-semibold text-sm hover:bg-dark-600 transition-colors">
               <Plus className="h-4 w-4" /> Nuevo Partido
             </button>
          </div>
          <div className="space-y-6">
            {['play-in', 'main-stage'].map(phase => {
              const phaseMatches = matches.filter(m => m.phase === phase);
              if (phaseMatches.length === 0) return null;
              return (
                <div key={phase} className="space-y-3">
                  <h4 className="text-lg font-semibold text-gold-400 uppercase tracking-widest">{phase.replace('-', ' ')}</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {phaseMatches.map(m => (
                      <MatchAdminCard key={m.id} match={m} teams={teams} players={players} rosters={rosters} showAlert={showAlert} onDelete={() => handleDeleteMatch(m.id)} />
                    ))}
                  </div>
                </div>
              );
            })}
            {matches.length === 0 && <p className="text-gray-500">No hay partidos registrados.</p>}
          </div>
        </div>
      )}

      {activeSection === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-dark-700 pb-2">
             <h3 className="text-xl font-bold text-white">Usuarios ({users.length})</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((u: any) => (
              <div key={u.userId} className="border border-dark-700 bg-dark-800 p-4 rounded-xl flex items-center gap-4">
                <img src={u.photoURL} alt="Avatar" className="h-10 w-10 rounded-full bg-dark-900 border border-dark-700" />
                <span className="text-sm font-bold text-white truncate">{u.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'points' && (
        <PointsConfigSection showAlert={showAlert} />
      )}

      <TeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} showAlert={showAlert} editTeam={teamToEdit} />
      <PlayerModal isOpen={isPlayerModalOpen} onClose={() => setIsPlayerModalOpen(false)} teams={teams} showAlert={showAlert} editPlayer={playerToEdit} />
      <MatchModal isOpen={isMatchModalOpen} onClose={() => setIsMatchModalOpen(false)} teams={teams} showAlert={showAlert} />
      
      <ConfirmModal 
        isOpen={confirmInfo.isOpen}
        title={confirmInfo.title}
        message={confirmInfo.message}
        onConfirm={confirmInfo.onConfirm}
        onClose={() => setConfirmInfo(prev => ({...prev, isOpen: false}))}
      />

      <AlertModal 
        isOpen={alertInfo.isOpen}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={() => setAlertInfo(prev => ({...prev, isOpen: false}))}
      />
    </div>
  );
}

function TeamModal({ isOpen, onClose, showAlert, editTeam }: { isOpen: boolean, onClose: () => void, showAlert: any, editTeam?: Team | null }) {
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [region, setRegion] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (editTeam) {
      setName(editTeam.name);
      setAcronym(editTeam.acronym);
      setRegion(editTeam.region);
      setLogoUrl(editTeam.logoUrl || '');
    } else {
      setName('');
      setAcronym('');
      setRegion('');
      setLogoUrl('');
    }
  }, [editTeam, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !acronym || !region) return;
    setSaving(true);
    try {
      const id = editTeam ? editTeam.id : `t_${generateId()}`;
      await setDoc(doc(db, 'teams', id), {
        id, name, acronym: acronym.toUpperCase(), region, logoUrl
      });
      showAlert(editTeam ? "Equipo Actualizado" : "Equipo Creado", `El equipo ${name} ha sido guardado correctamente.`, "success");
      onClose();
    } catch(err) {
      console.error(err);
      showAlert("Error", "No se pudo guardar el equipo.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-dark-700 bg-dark-900">
          <h3 className="font-bold text-white">{editTeam ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Nombre del Equipo</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full rounded bg-dark-900 border border-dark-700 p-2 text-white focus:outline-none focus:border-gold-500" placeholder="Ej: T1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Acrónimo</label>
            <input required value={acronym} onChange={e => setAcronym(e.target.value)} maxLength={5} className="w-full rounded bg-dark-900 border border-dark-700 p-2 text-white focus:outline-none focus:border-gold-500 uppercase" placeholder="Ej: T1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Región</label>
            <select required value={region} onChange={e => setRegion(e.target.value)} className="w-full rounded bg-dark-900 border border-dark-700 p-2 text-white focus:outline-none focus:border-gold-500">
              <option value="">Selecciona una región...</option>
              <option value="Korea">Korea</option>
              <option value="China">China</option>
              <option value="Europa">Europa</option>
              <option value="NA">NA</option>
              <option value="APAC">APAC</option>
              <option value="Brasil">Brasil</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">URL del Logo (Opcional)</label>
            <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="w-full rounded bg-dark-900 border border-dark-700 p-2 text-white focus:outline-none focus:border-gold-500" placeholder="https://ejemplo.com/logo.png" />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-sm text-gray-300 hover:text-white">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-white rounded font-medium text-sm transition-colors">{saving ? 'Guardando...' : 'Guardar Equipo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlayerModal({ isOpen, onClose, teams, showAlert, editPlayer }: { isOpen: boolean, onClose: () => void, teams: Team[], showAlert: any, editPlayer?: Player | null }) {
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [position, setPosition] = useState('Top');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (editPlayer) {
      setName(editPlayer.name);
      setTeamId(editPlayer.teamId);
      setPosition(editPlayer.position);
      setImageUrl(editPlayer.imageUrl || '');
    } else {
      setName('');
      setTeamId('');
      setPosition('Top');
      setImageUrl('');
    }
  }, [editPlayer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !teamId || !position) return;
    setSaving(true);
    try {
      if (editPlayer) {
        await updateDoc(doc(db, 'players', editPlayer.id), {
          name, teamId, position, imageUrl
        });
      } else {
        const id = `p_${generateId()}`;
        await setDoc(doc(db, 'players', id), {
          id, name, teamId, position, imageUrl, kills: 0, deaths: 0, assists: 0, cs: 0
        });
      }
      showAlert(editPlayer ? "Jugador Actualizado" : "Jugador Creado", `El jugador ${name} ha sido guardado exitosamente.`, "success");
      onClose();
    } catch(err) {
      console.error(err);
      showAlert("Error", "No se pudo guardar el jugador.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-dark-700 bg-dark-900">
          <h3 className="font-bold text-white">{editPlayer ? 'Editar Jugador' : 'Nuevo Jugador'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full rounded bg-dark-900 border border-dark-700 p-2 text-white focus:outline-none focus:border-gold-500" placeholder="Ej: Faker" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Equipo</label>
            <select required value={teamId} onChange={e => setTeamId(e.target.value)} className="w-full rounded bg-dark-900 border border-dark-700 p-2 text-white focus:outline-none focus:border-gold-500">
              <option value="">Seleccionar Equipo...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name} [{t.acronym}]</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Posición</label>
            <select required value={position} onChange={e => setPosition(e.target.value)} className="w-full rounded bg-dark-900 border border-dark-700 p-2 text-white focus:outline-none focus:border-gold-500">
              <option value="Top">Top</option>
              <option value="Jungle">Jungle</option>
              <option value="Mid">Mid</option>
              <option value="ADC">ADC</option>
              <option value="Support">Support</option>
              <option value="Coach">Coach</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">URL de Foto (Opcional)</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full rounded bg-dark-900 border border-dark-700 p-2 text-white focus:outline-none focus:border-gold-500" placeholder="https://ejemplo.com/foto.png" />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-sm text-gray-300 hover:text-white">Cancelar</button>
            <button type="submit" disabled={saving || teams.length === 0} className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-white rounded font-medium text-sm transition-colors disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar Jugador'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const PlayerStatRow: React.FC<{ player: Player, teams: Team[], matches: any[], showAlert: any, showConfirm: any, onEdit: () => void }> = ({ player, teams, matches, showAlert, showConfirm, onEdit }) => {
  const handleDelete = () => {
    showConfirm(
      "Eliminar Jugador",
      `¿Eliminar al jugador ${player.name}?`,
      async () => {
        try {
          await deleteDoc(doc(db, 'players', player.id));
        } catch(e) {
          console.error(e);
          showAlert("Error", "No se pudo eliminar el jugador.", "error");
        }
      }
    );
  };

  const team = teams.find(t => t.id === player.teamId);
  const teamDisplay = team ? team.acronym : 'N/A';
  
  const matchStats = getPlayerSumFromMatches(player.id, matches);
  const totalK = (player.kills || 0) + matchStats.kills;
  const totalD = (player.deaths || 0) + matchStats.deaths;
  const totalA = (player.assists || 0) + matchStats.assists;
  const totalCS = (player.cs || 0) + matchStats.cs;

  return (
    <tr className="hover:bg-dark-700/30">
      <td className="px-4 py-2 font-medium">
        <div className="text-white flex items-center gap-2">
          {player.imageUrl && <img src={player.imageUrl} alt={player.name} className="w-6 h-6 object-cover rounded-full" />}
          {teamDisplay} {player.name}
        </div>
        <div className="text-xs text-gold-400 opacity-80">{player.position}</div>
      </td>
      <td className="px-4 py-2 text-center text-white">{totalK}</td>
      <td className="px-4 py-2 text-center text-white">{totalD}</td>
      <td className="px-4 py-2 text-center text-white">{totalA}</td>
      <td className="px-4 py-2 text-center text-white">{totalCS.toFixed(0)}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={onEdit} className="text-gray-400 hover:text-white p-1 rounded hover:bg-dark-700">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={handleDelete} className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

const MatchAdminCard: React.FC<{ match: any, teams: Team[], players: Player[], rosters: Roster[], showAlert: any, onDelete: () => void }> = ({ match, teams, players, rosters, showAlert, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSetWinner = async (winner: string | null) => {
    try {
      await updateDoc(doc(db, 'matches', match.id), { 
        winner,
        mapWins: null,
        team1Score: null,
        team2Score: null,
      });
    } catch(e) {
      console.error(e);
      showAlert("Error", "No se pudo actualizar el partido.", "error");
    }
  };

  return (
    <>
      <div className="border border-dark-700 bg-dark-800 p-4 rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="font-bold flex gap-3 text-white items-center">
              <span>{match.team1}</span>
              <span className="text-gray-500 text-xs uppercase tracking-wider">vs</span>
              <span>{match.team2}</span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-1">
              Pos: {match.bracketPosition}
              {match.winner && match.team1Score !== undefined && match.team2Score !== undefined && (
                <span className="ml-2 text-gold-500">Resultado Bo5: {match.team1Score} - {match.team2Score}</span>
              )}
            </div>
          </div>
          <button onClick={onDelete} className="text-red-500 hover:text-red-400 p-1"><Trash2 className="h-4 w-4"/></button>
        </div>
        <div className="flex gap-2 justify-between mt-2">
          <button onClick={() => setIsModalOpen(true)} className={`flex-1 py-1 text-xs rounded font-bold ${match.winner ? 'bg-gold-500 text-dark-900 border-gold-500' : 'bg-dark-900 text-gray-400 border border-dark-700 hover:text-white hover:border-gold-500'}`}>{match.winner ? 'Editar Resultado' : 'Establecer Resultado'}</button>
          <button onClick={() => handleSetWinner(null)} className="px-3 py-1 text-xs rounded font-bold bg-dark-900 text-gray-400 border border-dark-700 hover:text-red-400">Reset</button>
        </div>
      </div>
      <AdminResultModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} match={match} teams={teams} players={players} rosters={rosters} showAlert={showAlert} />
    </>
  );
}

function AdminResultModal({ isOpen, onClose, match, teams, players, rosters, showAlert }: any) {
  const [mapWins, setMapWins] = useState<string[]>([]);
  const [playerStats, setPlayerStats] = useState<Record<string, Record<string, { kills: number, deaths: number, assists: number, cs: number }>>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'mapas' | 'stats'>('mapas');
  const [selectedMapStats, setSelectedMapStats] = useState<number>(0);

  React.useEffect(() => {
    if (isOpen && match?.mapWins) {
      setMapWins(match.mapWins);
    } else if (isOpen) {
      setMapWins([]);
    }
    if (isOpen && match?.playerStats) {
      setPlayerStats(match.playerStats);
    } else if (isOpen) {
      setPlayerStats({});
    }
  }, [isOpen, match]);

  if (!isOpen || !match) return null;

  const t1wins = mapWins.filter(w => w === match.team1).length;
  const t2wins = mapWins.filter(w => w === match.team2).length;
  const isFinished = t1wins === 3 || t2wins === 3;
  const mapsToShow = Math.min(5, mapWins.length + (isFinished ? 0 : 1));

  const t1 = teams.find((t: any) => t.acronym === match.team1);
  const t2 = teams.find((t: any) => t.acronym === match.team2);

  const pickedPlayerIds = new Set<string>();
  rosters.forEach((r: any) => {
    if (r.top) pickedPlayerIds.add(r.top);
    if (r.jgl) pickedPlayerIds.add(r.jgl);
    if (r.mid) pickedPlayerIds.add(r.mid);
    if (r.adc) pickedPlayerIds.add(r.adc);
    if (r.sup) pickedPlayerIds.add(r.sup);
    if (r.assassin1) pickedPlayerIds.add(r.assassin1);
    if (r.assassin2) pickedPlayerIds.add(r.assassin2);
    if (r.assassin3) pickedPlayerIds.add(r.assassin3);
  });

  const relevantPlayers = players.filter((p: any) => 
    (p.teamId === t1?.id || p.teamId === t2?.id) && pickedPlayerIds.has(p.id)
  );

  const handleSelectMap = (index: number, winner: string) => {
    const newWins = [...mapWins].slice(0, index);
    newWins.push(winner);
    setMapWins(newWins);
  };

  const handleStatChange = (mapIndex: number, playerId: string, field: 'kills' | 'deaths' | 'assists' | 'cs', value: string) => {
    setPlayerStats(prev => {
      const newStats = { ...prev };
      if (!newStats[mapIndex]) newStats[mapIndex] = {};
      if (!newStats[mapIndex][playerId]) newStats[mapIndex][playerId] = { kills: 0, deaths: 0, assists: 0, cs: 0 };
      newStats[mapIndex][playerId][field] = parseInt(value) || 0;
      return newStats;
    });
  };

  const handleSave = async () => {
    if (!isFinished && activeTab === 'mapas') return;
    setSaving(true);
    try {
      const winner = t1wins === 3 ? match.team1 : match.team2;
      await updateDoc(doc(db, 'matches', match.id), {
        winner: isFinished ? winner : null,
        mapWins,
        team1Score: t1wins,
        team2Score: t2wins,
        playerStats
      });
      showAlert("Partido Guardado", "El resultado del partido y las puntuaciones han sido actualizados.", "success");
      onClose();
    } catch (e: any) {
      console.error(e);
      showAlert("Error", "Error al guardar resultado: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-3 border-b border-dark-700 bg-dark-900 shrink-0">
          <div className="flex bg-dark-800 p-1 rounded-lg border border-dark-700">
            <button 
              onClick={() => setActiveTab('mapas')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'mapas' ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Resultados Mapas
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'stats' ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Puntuaciones Jugadores
            </button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white mr-2"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'mapas' && (
            <>
              <div className="flex items-center justify-between mb-8">
                 <div className="flex flex-col items-center flex-1">
                    {t1 && t1.logoUrl ? <img src={t1.logoUrl} className="w-12 h-12 object-contain mb-2" /> : <div className="w-12 h-12 bg-dark-900 rounded mb-2"></div>}
                    <span className="font-bold text-xl text-white">{match.team1}</span>
                 </div>
                 <div className="flex flex-col items-center px-4">
                    <span className="text-sm font-bold text-gray-500 uppercase">Score</span>
                    <span className="text-3xl font-black text-gold-500">{t1wins} - {t2wins}</span>
                 </div>
                 <div className="flex flex-col items-center flex-1">
                    {t2 && t2.logoUrl ? <img src={t2.logoUrl} className="w-12 h-12 object-contain mb-2" /> : <div className="w-12 h-12 bg-dark-900 rounded mb-2"></div>}
                    <span className="font-bold text-xl text-white">{match.team2}</span>
                 </div>
              </div>

              <div className="space-y-3">
                 {Array.from({ length: mapsToShow }).map((_, i) => (
                    <div key={i} className="bg-dark-900/50 p-3 rounded-lg border border-dark-700">
                       <div className="text-xs font-bold text-gray-400 mb-2 uppercase text-center tracking-wider">Mapa {i + 1}</div>
                       <div className="flex gap-2">
                          <button 
                             onClick={() => handleSelectMap(i, match.team1)}
                             className={`flex-1 py-2 font-bold rounded transition-all border ${mapWins[i] === match.team1 ? 'bg-gold-500 text-dark-900 border-gold-500' : 'bg-dark-800 text-gray-400 border-dark-600 hover:border-gold-500 hover:text-white'}`}
                          >
                             {match.team1} Win
                          </button>
                          <button 
                             onClick={() => handleSelectMap(i, match.team2)}
                             className={`flex-1 py-2 font-bold rounded transition-all border ${mapWins[i] === match.team2 ? 'bg-gold-500 text-dark-900 border-gold-500' : 'bg-dark-800 text-gray-400 border-dark-600 hover:border-gold-500 hover:text-white'}`}
                          >
                             {match.team2} Win
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
            </>
          )}

          {activeTab === 'stats' && (
            <div className="flex flex-col h-full gap-4">
              <div className="flex gap-2 justify-center shrink-0">
                {Array.from({ length: Math.max(1, mapWins.length) }).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setSelectedMapStats(i)}
                    className={`px-4 py-2 rounded text-sm font-bold ${selectedMapStats === i ? 'bg-gold-500 text-dark-900' : 'bg-dark-900 border border-dark-700 text-gray-400'}`}
                  >
                    Mapa {i + 1}
                  </button>
                ))}
              </div>

              {relevantPlayers.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500">
                  Ningún jugador de este partido fue elegido en rosters o asesinos.
                </div>
              ) : (
                <div className="overflow-x-auto border border-dark-700 rounded-lg">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-dark-900 text-xs uppercase text-gray-300">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Jugador</th>
                        <th className="px-3 py-2 font-semibold text-center w-20">Kills</th>
                        <th className="px-3 py-2 font-semibold text-center w-20">Deaths</th>
                        <th className="px-3 py-2 font-semibold text-center w-20">Assists</th>
                        <th className="px-3 py-2 font-semibold text-center w-20">CS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                      {relevantPlayers.map((p: any) => {
                        const stats = playerStats[selectedMapStats]?.[p.id] || { kills: 0, deaths: 0, assists: 0, cs: 0 };
                        return (
                          <tr key={p.id} className="hover:bg-dark-700/50">
                            <td className="px-3 py-2">
                              <div className="font-bold text-white">{p.name}</div>
                              <div className="text-[10px] text-gray-500">{p.teamId === t1?.id ? match.team1 : match.team2}</div>
                            </td>
                            <td className="px-1 py-2">
                              <input type="number" min="0" value={stats.kills || ''} onChange={(e) => handleStatChange(selectedMapStats, p.id, 'kills', e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded px-2 py-1 text-center text-white focus:border-gold-500" placeholder="0" />
                            </td>
                            <td className="px-1 py-2">
                              <input type="number" min="0" value={stats.deaths || ''} onChange={(e) => handleStatChange(selectedMapStats, p.id, 'deaths', e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded px-2 py-1 text-center text-white focus:border-gold-500" placeholder="0" />
                            </td>
                            <td className="px-1 py-2">
                              <input type="number" min="0" value={stats.assists || ''} onChange={(e) => handleStatChange(selectedMapStats, p.id, 'assists', e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded px-2 py-1 text-center text-white focus:border-gold-500" placeholder="0" />
                            </td>
                            <td className="px-1 py-2">
                              <input type="number" min="0" value={stats.cs || ''} onChange={(e) => handleStatChange(selectedMapStats, p.id, 'cs', e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded px-2 py-1 text-center text-white focus:border-gold-500" placeholder="0" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-dark-700 bg-dark-900 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-300 hover:text-white transition-colors">Cancelar</button>
          <button 
             onClick={handleSave} 
             disabled={saving}
             className="flex-1 py-3 text-sm font-bold bg-gold-600 hover:bg-gold-500 text-white rounded transition-colors disabled:opacity-50"
          >
             {saving ? 'Guardando...' : 'Guardar y Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

  function MatchModal({ isOpen, onClose, teams, showAlert }: { isOpen: boolean, onClose: () => void, teams: Team[], showAlert: any }) {
    const [phase, setPhase] = useState<'play-in' | 'main-stage'>('play-in');
    const [bracketPosition, setBracketPosition] = useState('');
    const [team1, setTeam1] = useState('');
    const [team2, setTeam2] = useState('');
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!bracketPosition || !team1 || !team2 || team1 === team2) {
        if(team1 === team2) showAlert("Obvio crack", "No pueden jugar el mismo equipo contra sí mismo.", "error");
        return;
      }
      setSaving(true);
      try {
        const id = `m_${generateId()}`;
        await setDoc(doc(db, 'matches', id), {
          id, phase, bracketPosition, team1, team2, winner: null
        });
        showAlert("Partido Creado", `El partido ha sido registrado.`, "success");
        setTeam1(''); setTeam2(''); setBracketPosition('');
        onClose();
      } catch(err) {
        console.error(err);
        showAlert("Error", "No se pudo crear el partido.", "error");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center p-4 border-b border-dark-700 bg-dark-900">
            <h3 className="font-bold text-white">Nuevo Partido</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Fase</label>
              <select required value={phase} onChange={e => { setPhase(e.target.value as any); setBracketPosition(''); }} className="w-full rounded bg-dark-900 border border-dark-700 p-2 text-white focus:outline-none focus:border-gold-500">
                <option value="play-in">Play-In</option>
                <option value="main-stage">Main Stage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Posición en Bracket</label>
              <select required value={bracketPosition} onChange={e => setBracketPosition(e.target.value)} className="w-full rounded bg-dark-900 border border-dark-700 p-2 text-white focus:outline-none focus:border-gold-500">
                <option value="">Seleccionar Posición...</option>
                {BRACKET_POSITIONS[phase].map(pos => <option key={pos.id} value={pos.id}>{pos.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Equipo 1</label>
              <select required value={team1} onChange={e => setTeam1(e.target.value)} className="w-full rounded bg-dark-900 border border-dark-700 p-2 text-white focus:outline-none focus:border-gold-500">
                <option value="">Seleccionar Equipo...</option>
                {teams.map(t => <option key={t.id} value={t.acronym}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Equipo 2</label>
              <select required value={team2} onChange={e => setTeam2(e.target.value)} className="w-full rounded bg-dark-900 border border-dark-700 p-2 text-white focus:outline-none focus:border-gold-500">
                <option value="">Seleccionar Equipo...</option>
                {teams.map(t => <option key={t.id} value={t.acronym}>{t.name}</option>)}
              </select>
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-sm text-gray-300 hover:text-white">Cancelar</button>
              <button type="submit" disabled={saving || teams.length < 2} className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-white rounded font-medium text-sm transition-colors disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

function PointsConfigSection({ showAlert }: { showAlert: any }) {
  const { pointsConfig, loading } = usePointsConfig();
  const [localConfig, setLocalConfig] = useState(DEFAULT_POINTS_CONFIG);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!loading) setLocalConfig(pointsConfig);
  }, [pointsConfig, loading]);

  const handleChange = (field: string, value: string) => {
    setLocalConfig(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'pointsConfig'), localConfig);
      showAlert("Configuración Guardada", "Los valores de puntuación han sido actualizados y aplicados.", "success");
    } catch(e) {
      console.error(e);
      showAlert("Error", "No se pudo guardar la configuración.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-400">Cargando configuración...</div>;

  const renderPositionConfig = (posLabel: string, posPrefix: string) => (
    <div className="border border-dark-700 bg-dark-800 p-5 rounded-xl space-y-4">
       <h4 className="font-bold text-gold-400 border-b border-dark-700 pb-2">{posLabel}</h4>
       <div>
          <label className="block text-sm text-gray-400 mb-1">Por cada Kill</label>
          <input type="number" step="0.1" value={(localConfig as any)[`${posPrefix}Kills`]} onChange={e => handleChange(`${posPrefix}Kills`, e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" />
       </div>
       <div>
          <label className="block text-sm text-gray-400 mb-1">Por cada Asistencia</label>
          <input type="number" step="0.1" value={(localConfig as any)[`${posPrefix}Assists`]} onChange={e => handleChange(`${posPrefix}Assists`, e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" />
       </div>
       <div>
          <label className="block text-sm text-gray-400 mb-1">Por cada Muerte</label>
          <input type="number" step="0.1" value={(localConfig as any)[`${posPrefix}Deaths`]} onChange={e => handleChange(`${posPrefix}Deaths`, e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" />
       </div>
       <div>
          <label className="block text-sm text-gray-400 mb-1">Por cada CS</label>
          <input type="number" step="0.01" value={(localConfig as any)[`${posPrefix}CS`]} onChange={e => handleChange(`${posPrefix}CS`, e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" />
       </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-dark-700 pb-2">
         <h3 className="text-xl font-bold text-white">Configuración de Puntos</h3>
         <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gold-600 rounded-lg text-white font-bold text-sm hover:bg-gold-500 transition-colors disabled:opacity-50">
           <Save className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
         </button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {renderPositionConfig('Top Laner', 'top')}
        {renderPositionConfig('Jungler', 'jungle')}
        {renderPositionConfig('Mid Laner', 'mid')}
        {renderPositionConfig('ADC', 'adc')}
        {renderPositionConfig('Support', 'support')}

        {/* Coach y Favorito */}
        <div className="border border-dark-700 bg-dark-800 p-5 rounded-xl space-y-4">
           <h4 className="font-bold text-gold-400 border-b border-dark-700 pb-2">Coach y Equipo Favorito</h4>
           <div>
              <label className="block text-sm text-gray-400 mb-1">Coach: Por Mapa Ganado</label>
              <input type="number" step="1" value={localConfig.coachMapWin} onChange={e => handleChange('coachMapWin', e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" />
           </div>
           <div>
              <label className="block text-sm text-gray-400 mb-1">Coach: Por Mapa Perdido</label>
              <input type="number" step="1" value={localConfig.coachMapLoss} onChange={e => handleChange('coachMapLoss', e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" />
           </div>
           <div>
              <label className="block text-sm text-gray-400 mb-1">Equipo Favorito: Por Mapa Ganado</label>
              <input type="number" step="1" value={localConfig.favoriteTeamMapWin} onChange={e => handleChange('favoriteTeamMapWin', e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" />
           </div>
        </div>

        {/* Asesinos */}
        <div className="border border-dark-700 bg-dark-800 p-5 rounded-xl space-y-4">
           <h4 className="font-bold text-gold-400 border-b border-dark-700 pb-2">Asesinos (Pts por Kill)</h4>
           <div>
              <label className="block text-sm text-gray-400 mb-1">Asesino Principal</label>
              <input type="number" step="0.1" value={localConfig.assassin1Kill} onChange={e => handleChange('assassin1Kill', e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" />
           </div>
           <div>
              <label className="block text-sm text-gray-400 mb-1">Segundo Asesino</label>
              <input type="number" step="0.1" value={localConfig.assassin2Kill} onChange={e => handleChange('assassin2Kill', e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" />
           </div>
           <div>
              <label className="block text-sm text-gray-400 mb-1">Tercer Asesino</label>
              <input type="number" step="0.1" value={localConfig.assassin3Kill} onChange={e => handleChange('assassin3Kill', e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded p-2 text-white" />
           </div>
        </div>
      </div>
    </div>
  );
}
