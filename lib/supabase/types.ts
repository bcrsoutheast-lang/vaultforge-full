export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          role: string | null
          city: string | null
          state: string | null
          bio: string | null
          deals_closed: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: string | null
          city?: string | null
          state?: string | null
          bio?: string | null
          deals_closed?: number | null
        }
        Update: {
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: string | null
          city?: string | null
          state?: string | null
          bio?: string | null
          deals_closed?: number | null
        }
      }
      deals: {
        Row: {
          id: string
          user_id: string
          address: string
          city: string
          state: string
          arv: string
          profit: string
          created_at: string
        }
        Insert: {
          user_id: string
          address: string
          city: string
          state: string
          arv: string
          profit: string
        }
        Update: {
          address?: string
          city?: string
          state?: string
          arv?: string
          profit?: string
        }
      }
      pain_intake: {
        Row: {
          id: string
          user_id: string
          address: string
          phone: string
          motivation: string
          timeline: string
          drop_dead_price: string
          arv: string
          mortgage_balance: string | null
          occupancy: string | null
          condition: string
          notes: string | null
          pain_score: number
          priority: string
          user_status: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          address: string
          phone: string
          motivation: string
          timeline: string
          drop_dead_price: string
          arv: string
          mortgage_balance?: string | null
          occupancy?: string | null
          condition: string
          notes?: string | null
          pain_score: number
          priority: string
          user_status?: string | null
        }
        Update: {
          address?: string
          phone?: string
          motivation?: string
          timeline?: string
          drop_dead_price?: string
          arv?: string
          mortgage_balance?: string | null
          occupancy?: string | null
          condition?: string
          notes?: string | null
          pain_score?: number
          priority?: string
          user_status?: string | null
        }
      }
    }
  }
}
