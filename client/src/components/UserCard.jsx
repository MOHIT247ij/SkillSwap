import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, SkillChips, Stars } from './UI';

// Card showing a user with match info + Swap button
export default function UserCard({ user, match, onSwap }) {
  const { online } = useAuth();
  const perfect = match?.mutual;
  const isOnline = online.includes(String(user._id));

  return (
    <div className={`relative h-full rounded-2xl p-[1.5px] transition-all duration-200 hover:-translate-y-1 ${perfect ? 'bg-gradient-to-br from-brand-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30' : 'hover:shadow-xl'}`}>
      <div className={`card h-full p-5 flex flex-col gap-3 ${perfect ? 'border-transparent' : ''}`}>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={50} online={isOnline} />
          <div className="min-w-0 flex-1">
            <Link to={`/users/${user._id}`} className="font-bold text-slate-900 hover:text-brand-600 truncate block">{user.name}</Link>
            <div className="text-xs text-slate-500 truncate">🎓 {user.college || '—'}{user.city ? ` · ${user.city}` : ''}</div>
            <Stars value={user.rating} count={user.ratingCount} />
          </div>
          {match?.score > 0 && (
            <div className="text-right shrink-0">
              {perfect
                ? <div className="chip bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white shadow">🔥 Perfect</div>
                : <div className="chip bg-brand-50 text-brand-700">Match</div>}
              <div className="text-xs text-slate-500 mt-1 font-semibold">{match.score} pts</div>
            </div>
          )}
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Teaches</div>
          <SkillChips skills={user.skillsOffered} type="teach" highlight={match?.theyTeach || []} verified={user.verifiedSkills || []} />
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Wants to learn</div>
          <SkillChips skills={user.skillsWanted} type="learn" highlight={match?.iTeach || []} />
        </div>
        {onSwap && (
          <div className="flex gap-2 mt-auto pt-2">
            <Link to={`/users/${user._id}`} className="btn-outline flex-1">View</Link>
            <button className="btn-primary flex-1" onClick={() => onSwap(user)}>⇄ Swap</button>
          </div>
        )}
      </div>
    </div>
  );
}
