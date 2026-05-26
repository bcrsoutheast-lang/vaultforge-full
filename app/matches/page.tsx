import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

// VaultForge Matches - Server Component
// PURPOSE: Shows real pain_matches from Supabase. No demo mode for active users.
// DEPENDS ON: member_profiles, pain_matches, pain_projects tables you just rebuilt
// AUTH: Uses vf_auth_user_id cookie like /dashboard and /projects

export default async function MatchesPage() {
  const cookieStore = cookies();
  const authUserId = cookieStore.get('vf_auth_user_id')?.value;
  const email = cookieStore.get('vf_email')?.value;

  // 1. Boot unauth users to login
  if (!authUserId && !email) redirect('/login');

  const supabase = createClient();

  // 2. Get current user + check if active/admin
  const { data: profile } = await supabase
    .from('member_profiles')
    .select('id, active, role, auth_user_id, email')
    .or(`auth_user_id.eq.${authUserId},email.eq.${email}`)
    .single();

  if (!profile) redirect('/profile'); // force profile creation

  // 3. Preview users see preview. Active/admin see real data.
  const isPreview = !profile.active && profile.role !== 'admin';
  if (isPreview) return <PreviewMode />;

  // 4. Query real matches. Joins pain_projects so we get deal details.
  const { data: matches } = await supabase
    .from('pain_matches')
    .select(`
      id,
      score,
      created_at,
      pain_projects (
        id,
        state,
        property_type,
        details_json
      )
    `)
    .eq('matched_user_id', profile.auth_user_id)
    .order('score', { ascending: false });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {profile.role === 'admin' ? 'All Matches' : 'Your Deal Matches'}
        </h1>
        <span className="text-sm text-gray-500">
          {matches?.length || 0} active matches
        </span>
      </div>

      {!matches || matches.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} isAdmin={profile.role === 'admin'} />
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-component: Renders 1 match card
// DATA: Expects match.pain_projects.details_json to have bedrooms, noi, acres, etc
function MatchCard({ match, isAdmin }: any) {
  const project = match.pain_projects;
  const details = project?.details_json || {};
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold text-lg">
            {project.state} {project.property_type}
          </div>
          <div className="text-sm text-gray-600">
            Match Score: {match.score || 85}
          </div>
        </div>
        {isAdmin && (
          <button className="text-xs text-red-500 hover:underline">
            Archive
          </button>
        )}
      </div>
      
      {/* Show key details from details_json */}
      <div className="text-sm space-y-1 mt-3">
        {details.bedrooms && <div>Beds: {details.bedrooms} | Baths: {details.bathrooms}</div>}
        {details.noi && <div>NOI: ${details.noi.toLocaleString()}</div>}
        {details.acres && <div>Acres: {details.acres}</div>}
        {details.strategy && <div>Strategy: {details.strategy}</div>}
        {details.arv && <div>ARV: ${details.arv.toLocaleString()}</div>}
      </div>
      
      <div className="mt-4 flex gap-2">
        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded">
          View Deal
        </button>
        <button className="px-3 py-1 border text-sm rounded">
          Contact
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 border-2 border-dashed rounded-lg">
      <h3 className="text-lg font-medium mb-2">No matches yet</h3>
      <p className="text-gray-600 mb-4">Submit a Pain Project to get routed deals.</p>
      <a href="/pain" className="px-4 py-2 bg-blue-600 text-white rounded">
        Create Pain Project
      </a>
    </div>
  );
}

function PreviewMode() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Matches - Preview Mode</h1>
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
        Upgrade to $49 to unlock real investor matches in GA, TN, FL.
      </div>
    </div>
  );
}
