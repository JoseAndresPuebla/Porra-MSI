import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useMatches, useAllPredictions, useTeams, usePointsConfig } from '../lib/hooks';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { BRACKET_POSITIONS } from './AdminPanel';
import { X } from 'lucide-react';

export function MatchPredictions() {
  const { user } = useAuth();
  const { matches, loading } = useMatches();
  const { predictions } = useAllPredictions();
  const { teams } = useTeams();
  const { pointsConfig, loading: configLoading } = usePointsConfig();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  if (loading || configLoading) return <div className="text-gray-400">Cargando partidos...</div>;

  const playInMatches = matches.filter(m => m.phase === 'play-in');
  const mainStageMatches = matches.filter(m => m.phase === 'main-stage');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gold-400 to-gold-600 mb-2">Predicciones</h2>
        <p className="text-sm text-gray-400">Predice el ganador y resultado de cada mapa en una serie al mejor de 5 para sumar puntos.</p>
      </div>

      {playInMatches.length === 0 && mainStageMatches.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-dark-800 rounded-xl border border-dark-700">
          Actualmente no hay partidos disponibles para predecir.
        </div>
      )}

      {playInMatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest border-b border-dark-700 pb-2">Play-In</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {playInMatches.map(match => (
              <MatchCard key={match.id} match={match} userId={user?.userId} allPredictions={predictions} teams={teams} pointsConfig={pointsConfig} onClick={() => setSelectedMatch(match)} />
            ))}
          </div>
        </div>
      )}

      {mainStageMatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest border-b border-dark-700 pb-2">Main Stage</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mainStageMatches.map(match => (
              <MatchCard key={match.id} match={match} userId={user?.userId} allPredictions={predictions} teams={teams} pointsConfig={pointsConfig} onClick={() => setSelectedMatch(match)} />
            ))}
          </div>
        </div>
      )}

      <PredictionModal 
        isOpen={!!selectedMatch} 
        onClose={() => setSelectedMatch(null)} 
        match={selectedMatch} 
        userId={user?.userId} 
        allPredictions={predictions} 
        teams={teams} 
      />
    </div>
  );
}

function MatchCard({ match, userId, allPredictions, teams, pointsConfig, onClick }: any) {
  const myPred = allPredictions.find((p: any) => p.userId === userId && p.matchId === match.id);
  const isCompleted = match.winner !== null && match.winner !== '';
  const myPredictedWinner = myPred?.predictedWinner;
  
  let pointsEarned = 0;
  if (isCompleted && myPred) {
    if (myPredictedWinner === match.winner) {
      pointsEarned += (pointsConfig.predictionCorrect ?? 10);
    }
    if (match.mapWins && myPred.mapWins) {
      match.mapWins.forEach((winner: string, index: number) => {
        if (myPred.mapWins && myPred.mapWins[index] === winner) {
          pointsEarned += (pointsConfig.predictionMapCorrect ?? 2);
        }
      });
    }
  }

  const isCorrect = isCompleted && pointsEarned > 0;
  const isWrong = isCompleted && myPredictedWinner && pointsEarned === 0;

  const posInfo = BRACKET_POSITIONS[match.phase as 'play-in' | 'main-stage']?.find((p: any) => p.id === match.bracketPosition);

  const t1 = teams.find((t: any) => t.acronym === match.team1);
  const t2 = teams.find((t: any) => t.acronym === match.team2);

  return (
    <div 
      onClick={() => { if (!isCompleted) onClick(); }}
      className={`rounded-xl border border-dark-700 bg-dark-800 p-5 relative overflow-hidden flex flex-col justify-between transition-all ${!isCompleted ? 'hover:border-gold-500 cursor-pointer hover:-translate-y-1' : 'opacity-80'}`}
    >
      {isCompleted && (
        <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold uppercase rounded-bl-lg ${isCorrect ? 'bg-green-500/20 text-green-400' : isWrong ? 'bg-red-500/20 text-red-400' : 'bg-dark-700 text-gray-400'}`}>
          {isCorrect ? `+${pointsEarned} Puntos` : isWrong ? 'Fallado' : 'Sin Predecir'}
        </div>
      )}
      <div className="mb-4">
        <h3 className="text-sm font-semibold uppercase text-gold-400 opacity-90">
          {posInfo ? posInfo.label : 'Partido'}
        </h3>
      </div>
      <div className="flex gap-3 h-full pb-6">
        <div className={`flex-1 flex flex-col justify-center items-center gap-2 rounded-lg py-3 border transition-all ${myPredictedWinner === match.team1 ? 'border-gold-500 bg-gold-500/10 text-gold-400' : 'border-dark-700 bg-dark-900 text-gray-300'} ${isCompleted && match.winner === match.team1 ? 'ring-2 ring-green-500 opacity-100 bg-green-500/10 border-green-500' : ''}`}>
           {t1 && t1.logoUrl ? <img src={t1.logoUrl} className="w-8 h-8 object-contain" /> : null}
           <span className="text-2xl font-bold">{match.team1}</span>
           {myPredictedWinner === match.team1 && <span className="text-[10px] uppercase font-bold text-gold-500 bg-gold-500/20 px-2 py-0.5 rounded">Mi Pick</span>}
        </div>

        <div className="flex flex-col items-center justify-center text-dark-500 text-sm font-bold">
          <span>VS</span>
          {myPred && myPred.team1Score !== undefined && myPred.team2Score !== undefined && (
            <span className="text-gold-500 text-xs mt-1">{myPred.team1Score} - {myPred.team2Score}</span>
          )}
        </div>

        <div className={`flex-1 flex flex-col justify-center items-center gap-2 rounded-lg py-3 border transition-all ${myPredictedWinner === match.team2 ? 'border-gold-500 bg-gold-500/10 text-gold-400' : 'border-dark-700 bg-dark-900 text-gray-300'} ${isCompleted && match.winner === match.team2 ? 'ring-2 ring-green-500 opacity-100 bg-green-500/10 border-green-500' : ''}`}>
           {t2 && t2.logoUrl ? <img src={t2.logoUrl} className="w-8 h-8 object-contain" /> : null}
           <span className="text-2xl font-bold">{match.team2}</span>
           {myPredictedWinner === match.team2 && <span className="text-[10px] uppercase font-bold text-gold-500 bg-gold-500/20 px-2 py-0.5 rounded">Mi Pick</span>}
        </div>
      </div>
      {!isCompleted && !myPredictedWinner && (
        <div className="absolute bottom-0 left-0 right-0 py-1.5 bg-dark-700/50 text-center text-xs text-gray-400 font-medium">Click para predecir</div>
      )}
      {!isCompleted && myPredictedWinner && (
        <div className="absolute bottom-0 left-0 right-0 py-1.5 bg-gold-500/10 text-center text-xs text-gold-500 font-medium border-t border-gold-500/20">Click para modificar</div>
      )}
    </div>
  );
}

function PredictionModal({ isOpen, onClose, match, userId, allPredictions, teams }: any) {
  const [mapWins, setMapWins] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const myPred = match ? allPredictions.find((p: any) => p.userId === userId && p.matchId === match.id) : null;

  useEffect(() => {
    if (isOpen && myPred?.mapWins) {
      setMapWins(myPred.mapWins);
    } else if (isOpen) {
      setMapWins([]);
    }
  }, [isOpen, match, myPred]);

  if (!isOpen || !match) return null;

  const t1wins = mapWins.filter(w => w === match.team1).length;
  const t2wins = mapWins.filter(w => w === match.team2).length;
  const isFinished = t1wins === 3 || t2wins === 3;
  const mapsToShow = Math.min(5, mapWins.length + (isFinished ? 0 : 1));

  const t1 = teams.find((t: any) => t.acronym === match.team1);
  const t2 = teams.find((t: any) => t.acronym === match.team2);

  const handleSelectMap = (index: number, winner: string) => {
    const newWins = [...mapWins].slice(0, index);
    newWins.push(winner);
    setMapWins(newWins);
  };

  const handleSave = async () => {
    if (!userId || !isFinished) return;
    setSaving(true);
    try {
      const predId = `${userId}_${match.id}`;
      const predictedWinner = t1wins === 3 ? match.team1 : match.team2;
      await setDoc(doc(db, 'predictions', predId), {
        userId,
        matchId: match.id,
        predictedWinner,
        mapWins,
        team1Score: t1wins,
        team2Score: t2wins,
        updatedAt: Date.now()
      }, { merge: true });
      onClose();
    } catch (e: any) {
      console.error('Error in setDoc:', e);
      alert("Error al guardar la predicción: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-2xl flex flex-col md:max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-dark-700 bg-dark-900 shrink-0">
          <h3 className="font-bold text-lg text-white">Predicción Bo5</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto">
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
             {Array.from({ length: mapsToShow }).map((_, i) => {
                const mapIsCompleted = match.mapWins && match.mapWins[i];
                const predictedMapWinner = mapWins[i];
                const actualMapWinner = match.mapWins ? match.mapWins[i] : null;
                const isMapCorrect = mapIsCompleted && predictedMapWinner === actualMapWinner;
                const isMapWrong = mapIsCompleted && predictedMapWinner && predictedMapWinner !== actualMapWinner;
                
                return (
                  <div key={i} className={`p-3 rounded-lg border ${isMapCorrect ? 'border-green-500 bg-green-500/10' : isMapWrong ? 'border-red-500 bg-red-500/10' : 'border-dark-700 bg-dark-900/50'}`}>
                     <div className="flex justify-between items-center mb-2">
                       <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mapa {i + 1}</div>
                       {mapIsCompleted && (
                         <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isMapCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                           {isMapCorrect ? 'Acertado' : 'Fallado'}
                         </div>
                       )}
                     </div>
                     <div className="flex gap-2">
                        <button 
                           onClick={() => !match.winner && handleSelectMap(i, match.team1)}
                           disabled={!!match.winner}
                           className={`flex-1 py-2 font-bold rounded transition-all border ${predictedMapWinner === match.team1 ? 'bg-gold-500 text-dark-900 border-gold-500' : 'bg-dark-800 text-gray-400 border-dark-600 hover:border-gold-500 hover:text-white'} disabled:cursor-default disabled:hover:border-dark-600 disabled:hover:text-gray-400`}
                        >
                           {match.team1} {actualMapWinner === match.team1 && '✓'}
                        </button>
                        <button 
                           onClick={() => !match.winner && handleSelectMap(i, match.team2)}
                           disabled={!!match.winner}
                           className={`flex-1 py-2 font-bold rounded transition-all border ${predictedMapWinner === match.team2 ? 'bg-gold-500 text-dark-900 border-gold-500' : 'bg-dark-800 text-gray-400 border-dark-600 hover:border-gold-500 hover:text-white'} disabled:cursor-default disabled:hover:border-dark-600 disabled:hover:text-gray-400`}
                        >
                           {match.team2} {actualMapWinner === match.team2 && '✓'}
                        </button>
                     </div>
                  </div>
                );
             })}
          </div>
        </div>

        <div className="p-4 border-t border-dark-700 bg-dark-900 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-300 hover:text-white transition-colors">Cancelar</button>
          <button 
             onClick={handleSave} 
             disabled={!isFinished || saving}
             className="flex-1 py-3 text-sm font-bold bg-gold-600 hover:bg-gold-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {saving ? 'Guardando...' : 'Guardar Predicción'}
          </button>
        </div>
      </div>
    </div>
  );
}