import { useMemo } from 'react';
import { usePlayers, useMatches, useAllUsers, useAllRosters, useAllPredictions, useTeams, usePointsConfig } from '../lib/hooks';
import { calculatePlayerScore, getPlayerSumFromMatches, getCoachScore, getFavoriteTeamScore } from '../lib/utils';

export function Leaderboard() {
  const { players, loading: playersLoading } = usePlayers();
  const { matches, loading: matchesLoading } = useMatches();
  const { users } = useAllUsers();
  const { rosters } = useAllRosters();
  const { predictions } = useAllPredictions();
  const { teams } = useTeams();
  const { pointsConfig, loading: configLoading } = usePointsConfig();

  const leaderboard = useMemo(() => {
    if (playersLoading || matchesLoading || configLoading) return [];

    return users.map(user => {
      let score = 0;
      
      // Calculate roster points
      const userRoster = rosters.find(r => r.userId === user.userId);
      if (userRoster) {
        // Normal players
        const selectedPlayerIds = [userRoster.top, userRoster.jgl, userRoster.mid, userRoster.adc, userRoster.sup];
        
        selectedPlayerIds.forEach(pid => {
          if (!pid) return;
          const p = players.find(player => player.id === pid);
          const matchStats = getPlayerSumFromMatches(pid, matches);
          if (p) {
             (matchStats as any).position = p.position;
          }
          score += calculatePlayerScore(matchStats, pointsConfig);

          // also add global stats just in case we have pre-seeded data
          if (p) score += calculatePlayerScore(p, pointsConfig);
        });

        // Coach points
        if (userRoster.coach) {
          const coach = players.find(player => player.id === userRoster.coach);
          if (coach) {
            score += getCoachScore(coach, teams, matches, pointsConfig);
          }
        }

        // Favorite Team points
        if (userRoster.favoriteTeam) {
          score += getFavoriteTeamScore(userRoster.favoriteTeam, teams, matches, pointsConfig);
        }

        // Assassin points
        if (userRoster.assassin1) {
          const matchStats = getPlayerSumFromMatches(userRoster.assassin1, matches);
          const p1 = players.find(player => player.id === userRoster.assassin1);
          score += (matchStats.kills + ((p1?.kills) || 0)) * pointsConfig.assassin1Kill;
        }
        if (userRoster.assassin2) {
          const matchStats = getPlayerSumFromMatches(userRoster.assassin2, matches);
          const p2 = players.find(player => player.id === userRoster.assassin2);
          score += (matchStats.kills + ((p2?.kills) || 0)) * pointsConfig.assassin2Kill;
        }
        if (userRoster.assassin3) {
          const matchStats = getPlayerSumFromMatches(userRoster.assassin3, matches);
          const p3 = players.find(player => player.id === userRoster.assassin3);
          score += (matchStats.kills + ((p3?.kills) || 0)) * pointsConfig.assassin3Kill;
        }
      }

      // Calculate prediction points
      const userPredictions = predictions.filter(p => p.userId === user.userId);
      userPredictions.forEach(pred => {
        const match = matches.find(m => m.id === pred.matchId);
        if (match) {
          if (match.winner && match.winner === pred.predictedWinner) {
            score += (pointsConfig.predictionCorrect ?? 10);
          }
          if (match.mapWins && pred.mapWins) {
            match.mapWins.forEach((winner, index) => {
              if (pred.mapWins && pred.mapWins[index] === winner) {
                score += (pointsConfig.predictionMapCorrect ?? 2);
              }
            });
          }
        }
      });

      return {
        ...user,
        score
      };
    }).sort((a, b) => b.score - a.score);
  }, [players, matches, users, rosters, predictions, teams, pointsConfig, playersLoading, matchesLoading, configLoading]);

  if (playersLoading || matchesLoading || configLoading) {
    return <div className="text-gray-400">Cargando clasificación...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Clasificación</h2>
        <p className="text-sm text-gray-400">Puntajes basados en tiempo real.</p>
      </div>
      
      <div className="rounded-xl border border-dark-700 bg-dark-800 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-dark-900 text-xs uppercase text-gray-300">
            <tr>
              <th className="px-6 py-4 font-semibold">Rank</th>
              <th className="px-6 py-4 font-semibold">Usuario</th>
              <th className="px-6 py-4 font-semibold text-right">Puntos Totales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {leaderboard.map((user, index) => (
              <tr key={user.userId} className="hover:bg-dark-700/50 transition-colors">
                <td className="px-6 py-4 font-medium">
                  {index === 0 && <span className="text-gold-400">#1 🏆</span>}
                  {index === 1 && <span className="text-gray-300">#2 🥈</span>}
                  {index === 2 && <span className="text-orange-400">#3 🥉</span>}
                  {index > 2 && <span>#{index + 1}</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL} alt={user.displayName} className="h-8 w-8 rounded-full border border-dark-700" />
                    <span className="font-medium text-white">{user.displayName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-lg text-gold-400">
                  {user.score.toFixed(1)}
                </td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center bg-dark-800">
                  No hay usuarios en la porra todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
