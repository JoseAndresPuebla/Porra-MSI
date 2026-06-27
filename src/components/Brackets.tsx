import React, { useState } from 'react';
import { useMatches, useTeams } from '../lib/hooks';
import { Match, Team } from '../types';

export function Brackets() {
  const { matches } = useMatches();
  const { teams } = useTeams();
  const [activePhase, setActivePhase] = useState<'play-in' | 'main-stage'>('play-in');

  const getMatchByPos = (pos: string) => matches.find(m => m.bracketPosition === pos);

  const getTeam = (acronym: string) => teams.find(t => t.acronym === acronym);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end border-b border-dark-700 pb-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gold-400 to-gold-600 mb-2">Tournament Bracket</h2>
          <p className="text-gray-400">Progreso visual del torneo dividido en Play-In y Main Stage.</p>
        </div>
        <div className="flex bg-dark-900 rounded-lg p-1 border border-dark-700">
          <button 
            onClick={() => setActivePhase('play-in')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activePhase === 'play-in' ? 'bg-gold-500 text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Play-In
          </button>
          <button 
            onClick={() => setActivePhase('main-stage')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activePhase === 'main-stage' ? 'bg-gold-500 text-dark-900 shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Main Stage
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-8">
        <div className="min-w-max relative" style={activePhase === 'main-stage' ? { width: '1240px', height: '700px' } : { width: '820px', height: '400px' }}>
          {activePhase === 'play-in' ? (
            <PlayInBracket getMatchByPos={getMatchByPos} getTeam={getTeam} />
          ) : (
            <MainStageBracket getMatchByPos={getMatchByPos} getTeam={getTeam} />
          )}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match, getTeam, x, y, title }: { match?: Match, getTeam: (a: string) => Team | undefined, x: number, y: number, title: string }) {
  const team1 = match ? getTeam(match.team1) : null;
  const team2 = match ? getTeam(match.team2) : null;
  
  const isCompleted = match?.winner !== undefined && match?.winner !== null && match?.winner !== '';

  const drawTeamRow = (acronym: string | undefined, team: Team | null, isWinner: boolean, score: number | undefined | null) => {
    let bgClass = '';
    if (isCompleted) {
      bgClass = isWinner ? 'bg-green-500/20' : 'bg-red-500/20';
    }

    return (
      <div className={`flex items-center justify-between px-3 py-1.5 border-b border-dark-700 last:border-0 ${bgClass}`}>
        <div className="flex items-center gap-2">
          {team && team.logoUrl ? (
            <img src={team.logoUrl} className="w-5 h-5 object-contain" alt={team.acronym} />
          ) : (
            <div className="w-5 h-5 bg-dark-600 rounded flex items-center justify-center text-[10px] font-bold text-gray-300">
              {team ? team.acronym.substring(0, 2) : '?'}
            </div>
          )}
          <span className={`text-sm ${isWinner ? 'text-white font-bold' : isCompleted ? 'text-gray-400' : 'text-gray-300'}`}>{acronym || 'TBD'}</span>
        </div>
        <span className={`text-xs font-bold ${isWinner ? 'text-green-400' : isCompleted ? 'text-red-400' : 'text-gray-500'}`}>
          {score !== undefined && score !== null ? score : isWinner ? 'W' : ''}
        </span>
      </div>
    );
  };

  return (
    <div className="absolute w-[200px] bg-dark-800 border border-dark-700 rounded-lg shadow-lg overflow-hidden" style={{ left: x, top: y }}>
      <div className="bg-dark-900 text-center py-1 border-b border-dark-700">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{title}</span>
      </div>
      <div className="flex flex-col">
        {drawTeamRow(match?.team1, team1, match?.winner === match?.team1, match?.team1Score)}
        {drawTeamRow(match?.team2, team2, match?.winner === match?.team2, match?.team2Score)}
      </div>
    </div>
  );
}

function Connection({ fromX, fromY, toX, toY }: { fromX: number, fromY: number, toX: number, toY: number }) {
  const isStraight = fromY === toY;
  const cX1 = isStraight ? fromX + 20 : fromX + (toX - fromX) / 2;
  const cX2 = isStraight ? toX - 20 : fromX + (toX - fromX) / 2;

  return (
    <path 
      d={`M ${fromX} ${fromY} C ${cX1} ${fromY}, ${cX2} ${toY}, ${toX} ${toY}`} 
      stroke="#4b5563" 
      strokeWidth="2" 
      fill="transparent" 
    />
  );
}

function PlayInBracket({ getMatchByPos, getTeam }: any) {
  // Width 200, Gap 60
  // Cols: 0, 260, 520
  const cols = [0, 260, 520];
  
  return (
    <>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Connections */}
        <Connection fromX={cols[0] + 200} fromY={50 + 35} toX={cols[1]} toY={100 + 35} />
        <Connection fromX={cols[0] + 200} fromY={150 + 35} toX={cols[1]} toY={100 + 35} />
        
        <Connection fromX={cols[0] + 200} fromY={280 + 35} toX={cols[1]} toY={280 + 35} />
        
        <Connection fromX={cols[1] + 200} fromY={100 + 35} toX={cols[2]} toY={175 + 35} />
        <Connection fromX={cols[1] + 200} fromY={280 + 35} toX={cols[2]} toY={175 + 35} />
      </svg>

      <MatchCard x={cols[0]} y={50} title="UR1 - M1" match={getMatchByPos('PI_UR1_1')} getTeam={getTeam} />
      <MatchCard x={cols[0]} y={150} title="UR1 - M2" match={getMatchByPos('PI_UR1_2')} getTeam={getTeam} />
      
      <MatchCard x={cols[1]} y={100} title="Upper Final" match={getMatchByPos('PI_UR2_1')} getTeam={getTeam} />
      
      <div className="absolute font-bold text-gray-500 uppercase tracking-widest text-sm" style={{ left: cols[0], top: 250 }}>Losers' Bracket</div>
      <MatchCard x={cols[0]} y={280} title="LR1" match={getMatchByPos('PI_LR1_1')} getTeam={getTeam} />
      <MatchCard x={cols[1]} y={280} title="LR2" match={getMatchByPos('PI_LR2_1')} getTeam={getTeam} />
      
      <MatchCard x={cols[2]} y={175} title="Qualification" match={getMatchByPos('PI_QUAL')} getTeam={getTeam} />
    </>
  );
}

function MainStageBracket({ getMatchByPos, getTeam }: any) {
  // Width 200, Gap 60
  // Cols: 0, 260, 520, 780, 1040
  const cols = [0, 260, 520, 780, 1040];
  
  return (
    <>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Upper Bracket Connections */}
        <Connection fromX={cols[0] + 200} fromY={0 + 35} toX={cols[1]} toY={50 + 35} />
        <Connection fromX={cols[0] + 200} fromY={100 + 35} toX={cols[1]} toY={50 + 35} />
        <Connection fromX={cols[0] + 200} fromY={200 + 35} toX={cols[1]} toY={250 + 35} />
        <Connection fromX={cols[0] + 200} fromY={300 + 35} toX={cols[1]} toY={250 + 35} />
        
        <Connection fromX={cols[1] + 200} fromY={50 + 35} toX={cols[3]} toY={150 + 35} />
        <Connection fromX={cols[1] + 200} fromY={250 + 35} toX={cols[3]} toY={150 + 35} />
        
        {/* Lower Bracket Connections */}
        <Connection fromX={cols[0] + 200} fromY={450 + 35} toX={cols[1]} toY={450 + 35} />
        <Connection fromX={cols[0] + 200} fromY={550 + 35} toX={cols[1]} toY={550 + 35} />
        
        <Connection fromX={cols[1] + 200} fromY={450 + 35} toX={cols[2]} toY={500 + 35} />
        <Connection fromX={cols[1] + 200} fromY={550 + 35} toX={cols[2]} toY={500 + 35} />
        
        <Connection fromX={cols[2] + 200} fromY={500 + 35} toX={cols[3]} toY={500 + 35} />
        
        {/* Finals Connection */}
        <Connection fromX={cols[3] + 200} fromY={150 + 35} toX={cols[4]} toY={325 + 35} />
        <Connection fromX={cols[3] + 200} fromY={500 + 35} toX={cols[4]} toY={325 + 35} />
      </svg>

      {/* Upper Bracket */}
      <MatchCard x={cols[0]} y={0} title="R1 - M1" match={getMatchByPos('MS_UR1_1')} getTeam={getTeam} />
      <MatchCard x={cols[0]} y={100} title="R1 - M2" match={getMatchByPos('MS_UR1_2')} getTeam={getTeam} />
      <MatchCard x={cols[0]} y={200} title="R1 - M3" match={getMatchByPos('MS_UR1_3')} getTeam={getTeam} />
      <MatchCard x={cols[0]} y={300} title="R1 - M4" match={getMatchByPos('MS_UR1_4')} getTeam={getTeam} />
      
      <MatchCard x={cols[1]} y={50} title="R2 - M1" match={getMatchByPos('MS_UR2_1')} getTeam={getTeam} />
      <MatchCard x={cols[1]} y={250} title="R2 - M2" match={getMatchByPos('MS_UR2_2')} getTeam={getTeam} />
      
      <MatchCard x={cols[3]} y={150} title="Upper Final" match={getMatchByPos('MS_UR4_1')} getTeam={getTeam} />
      
      {/* Lower Bracket */}
      <div className="absolute font-bold text-gray-500 uppercase tracking-widest text-sm" style={{ left: cols[0], top: 410 }}>Losers' Bracket</div>
      <MatchCard x={cols[0]} y={450} title="LR1 - M1" match={getMatchByPos('MS_LR1_1')} getTeam={getTeam} />
      <MatchCard x={cols[0]} y={550} title="LR1 - M2" match={getMatchByPos('MS_LR1_2')} getTeam={getTeam} />
      
      <MatchCard x={cols[1]} y={450} title="LR2 - M1" match={getMatchByPos('MS_LR2_1')} getTeam={getTeam} />
      <MatchCard x={cols[1]} y={550} title="LR2 - M2" match={getMatchByPos('MS_LR2_2')} getTeam={getTeam} />
      
      <MatchCard x={cols[2]} y={500} title="LR3" match={getMatchByPos('MS_LR3_1')} getTeam={getTeam} />
      
      <MatchCard x={cols[3]} y={500} title="Lower Final" match={getMatchByPos('MS_LR4_1')} getTeam={getTeam} />
      
      {/* Grand Final */}
      <MatchCard x={cols[4]} y={325} title="Grand Final" match={getMatchByPos('MS_FINAL')} getTeam={getTeam} />
    </>
  );
}
