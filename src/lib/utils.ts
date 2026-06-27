import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const POINTS_CONFIG = {
  COACH_MAP_WIN: 15,
  COACH_MAP_LOSS: -5,
  FAV_TEAM_MAP_WIN: 15,
};

export function calculatePlayerScore(player: {
  kills?: number;
  deaths?: number;
  assists?: number;
  cs?: number;
  position?: string;
}, pointsConfig: any) {
  if (!player) return 0;

  const pos = player.position ? player.position.toLowerCase() : '';
  let kMultiplier = pointsConfig.playerKills;
  let aMultiplier = pointsConfig.playerAssists;
  let dMultiplier = pointsConfig.playerDeaths;
  let csMultiplier = pointsConfig.playerCS;

  if (pos === 'top') {
    kMultiplier = pointsConfig.topKills ?? kMultiplier;
    aMultiplier = pointsConfig.topAssists ?? aMultiplier;
    dMultiplier = pointsConfig.topDeaths ?? dMultiplier;
    csMultiplier = pointsConfig.topCS ?? csMultiplier;
  } else if (pos === 'jungle') {
    kMultiplier = pointsConfig.jungleKills ?? kMultiplier;
    aMultiplier = pointsConfig.jungleAssists ?? aMultiplier;
    dMultiplier = pointsConfig.jungleDeaths ?? dMultiplier;
    csMultiplier = pointsConfig.jungleCS ?? csMultiplier;
  } else if (pos === 'mid') {
    kMultiplier = pointsConfig.midKills ?? kMultiplier;
    aMultiplier = pointsConfig.midAssists ?? aMultiplier;
    dMultiplier = pointsConfig.midDeaths ?? dMultiplier;
    csMultiplier = pointsConfig.midCS ?? csMultiplier;
  } else if (pos === 'adc') {
    kMultiplier = pointsConfig.adcKills ?? kMultiplier;
    aMultiplier = pointsConfig.adcAssists ?? aMultiplier;
    dMultiplier = pointsConfig.adcDeaths ?? dMultiplier;
    csMultiplier = pointsConfig.adcCS ?? csMultiplier;
  } else if (pos === 'support') {
    kMultiplier = pointsConfig.supportKills ?? kMultiplier;
    aMultiplier = pointsConfig.supportAssists ?? aMultiplier;
    dMultiplier = pointsConfig.supportDeaths ?? dMultiplier;
    csMultiplier = pointsConfig.supportCS ?? csMultiplier;
  }

  return ((player.kills || 0) * kMultiplier) + 
         ((player.assists || 0) * aMultiplier) + 
         ((player.deaths || 0) * dMultiplier) + 
         ((player.cs || 0) * csMultiplier);
}

export function getPlayerSumFromMatches(playerId: string, matches: any[]) {
  let ks = 0, ds = 0, as = 0, csSum = 0;
  matches.forEach(match => {
    if (match.playerStats) {
      Object.values(match.playerStats).forEach((mapStats: any) => {
        if (mapStats[playerId]) {
          ks += mapStats[playerId].kills || 0;
          ds += mapStats[playerId].deaths || 0;
          as += mapStats[playerId].assists || 0;
          csSum += mapStats[playerId].cs || 0;
        }
      });
    }
  });
  return { kills: ks, deaths: ds, assists: as, cs: csSum };
}

export function getCoachScore(coach: any, teams: any[], matches: any[], pointsConfig: any) {
  if (!coach || coach.position !== 'Coach') return 0;
  const coachTeam = teams.find((t: any) => t.id === coach.teamId);
  if (!coachTeam) return 0;

  let score = 0;
  matches.forEach(match => {
    if (match.mapWins) {
      const teamMapWins = match.mapWins.filter((w: string) => w === coachTeam.acronym).length;
      const totalMaps = match.mapWins.length;
      const teamMapLosses = (match.team1 === coachTeam.acronym || match.team2 === coachTeam.acronym) 
          ? totalMaps - teamMapWins 
          : 0;

      score += teamMapWins * pointsConfig.coachMapWin;
      score += teamMapLosses * pointsConfig.coachMapLoss;
    }
  });
  return score;
}

export function getFavoriteTeamScore(teamId: string, teams: any[], matches: any[], pointsConfig: any) {
  if (!teamId) return 0;
  const favTeam = teams.find((t: any) => t.id === teamId);
  if (!favTeam) return 0;

  let score = 0;
  matches.forEach(match => {
    if (match.mapWins) {
      const teamMapWins = match.mapWins.filter((w: string) => w === favTeam.acronym).length;
      score += teamMapWins * pointsConfig.favoriteTeamMapWin;
    }
  });
  return score;
}

export function getPlayerTotalScore(player: any, teams: any[], matches: any[], pointsConfig: any) {
  if (!player) return 0;
  if (player.position === 'Coach') {
    return getCoachScore(player, teams, matches, pointsConfig);
  }
  const matchStats = getPlayerSumFromMatches(player.id, matches);
  (matchStats as any).position = player.position;
  return calculatePlayerScore(matchStats, pointsConfig) + calculatePlayerScore(player, pointsConfig);
}
