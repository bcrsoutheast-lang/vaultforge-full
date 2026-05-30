// Delete this line:
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Keep this:
import { supabase } from '@/lib/supabase'

// Then anywhere you had:
const { data: { user } } = await supabase.auth.getUser()
// That still works. No change needed.
