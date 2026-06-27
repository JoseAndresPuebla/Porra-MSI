import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Player, Match, Roster, Prediction, User } from '../types';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'players'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p: Player[] = [];
      snapshot.forEach(doc => p.push(doc.data() as Player));
      setPlayers(p);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { players, loading };
}

export function useTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'teams'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const t: any[] = [];
      snapshot.forEach(doc => t.push(doc.data()));
      setTeams(t);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { teams, loading };
}

export function usePhases() {
  const [phases, setPhases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'phases'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p: any[] = [];
      snapshot.forEach(doc => p.push(doc.data()));
      setPhases(p.sort((a, b) => a.order - b.order));
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { phases, loading };
}

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'matches'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const m: Match[] = [];
      snapshot.forEach(doc => m.push(doc.data() as Match));
      setMatches(m);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { matches, loading };
}

export const DEFAULT_POINTS_CONFIG = {
  // General fallback
  playerKills: 3,
  playerAssists: 2,
  playerDeaths: -1,
  playerCS: 0.02,

  // Top
  topKills: 3,
  topAssists: 2,
  topDeaths: -1,
  topCS: 0.02,

  // Jungle
  jungleKills: 3,
  jungleAssists: 2,
  jungleDeaths: -1,
  jungleCS: 0.02,

  // Mid
  midKills: 3,
  midAssists: 2,
  midDeaths: -1,
  midCS: 0.02,

  // ADC
  adcKills: 3,
  adcAssists: 2,
  adcDeaths: -1,
  adcCS: 0.02,

  // Support
  supportKills: 3,
  supportAssists: 2,
  supportDeaths: -1,
  supportCS: 0.02,

  coachMapWin: 15,
  coachMapLoss: -5,
  favoriteTeamMapWin: 15,
  predictionCorrect: 10,
  predictionMapCorrect: 2,
  assassin1Kill: 3,
  assassin2Kill: 2,
  assassin3Kill: 1,
};

export function usePointsConfig() {
  const [pointsConfig, setPointsConfig] = useState(DEFAULT_POINTS_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'pointsConfig'), (doc) => {
      if (doc.exists()) {
        setPointsConfig({ ...DEFAULT_POINTS_CONFIG, ...doc.data() });
      } else {
        setPointsConfig(DEFAULT_POINTS_CONFIG);
      }
      setLoading(false);
    }, (error) => {
      console.error("usePointsConfig error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { pointsConfig, loading };
}

export function useAllUsers() {
  const [users, setUsers] = useState<User[]>([]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const u: User[] = [];
      snapshot.forEach(doc => u.push(doc.data() as User));
      setUsers(u);
    }, (error) => {
      console.error("useAllUsers error:", error);
    });
    return () => unsubscribe();
  }, []);

  return { users };
}

export function useAllRosters() {
  const [rosters, setRosters] = useState<Roster[]>([]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'rosters'), (snapshot) => {
      const r: Roster[] = [];
      snapshot.forEach(doc => r.push(doc.data() as Roster));
      setRosters(r);
    }, (error) => console.error("useAllRosters error:", error));
    return () => unsubscribe();
  }, []);

  return { rosters };
}

export function useAllPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'predictions'), (snapshot) => {
      const p: Prediction[] = [];
      snapshot.forEach(doc => p.push(doc.data() as Prediction));
      setPredictions(p);
    }, (error) => console.error("useAllPredictions error:", error));
    return () => unsubscribe();
  }, []);

  return { predictions };
}
