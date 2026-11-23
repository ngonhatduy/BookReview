export interface Book {
  id: string
  title: string
  cover_url: string | null
  genres: string[]
  rating: number
  finished_at: string | null
  shopee_url: string | null
  created_at: string
}

export interface BookInput {
  title: string
  cover_url: string | null
  genres: string[]
  rating: number
  finished_at: string | null
  shopee_url: string | null
}

export type UserRole = 'admin' | 'viewer'

export interface UserProfile {
  id: string
  email: string | null
  display_name: string | null
  role: UserRole
  created_at: string
}

export type SortOption = 'newest' | 'rating_desc' | 'title_asc'
