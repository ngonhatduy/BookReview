import type { Component } from 'vue'
import {
  BookOpen,
  Brain,
  Coffee,
  Feather,
  Fingerprint,
  Heart,
  Puzzle,
  Search,
  Sparkles,
  Sun,
  Tag,
  Utensils,
  Wand2,
} from 'lucide-vue-next'

export interface GenreMeta {
  name: string
  icon: Component
  badgeClass: string
  iconClass: string
}

export const PRESET_GENRES: GenreMeta[] = [
  {
    name: 'Healing',
    icon: Sparkles,
    badgeClass: 'bg-[#3d3528] text-[#dfd1b5] border-[#594b36]',
    iconClass: 'text-[#e2b866]',
  },
  {
    name: 'Fiction',
    icon: BookOpen,
    badgeClass: 'bg-[#362e2a] text-[#d5c6ba] border-[#4e423b]',
    iconClass: 'text-[#c9a98d]',
  },
  {
    name: 'Detective',
    icon: Search,
    badgeClass: 'bg-[#2f3338] text-[#c5d0db] border-[#444b53]',
    iconClass: 'text-[#9ab4cc]',
  },
  {
    name: 'Puzzle',
    icon: Puzzle,
    badgeClass: 'bg-[#383229] text-[#dcd0b6] border-[#524839]',
    iconClass: 'text-[#d9ba7b]',
  },
  {
    name: 'Fantasy',
    icon: Wand2,
    badgeClass: 'bg-[#382d39] text-[#dbc5de] border-[#514054]',
    iconClass: 'text-[#caa1cf]',
  },
  {
    name: 'Psychology',
    icon: Brain,
    badgeClass: 'bg-[#362e36] text-[#d8c4d3] border-[#4f424e]',
    iconClass: 'text-[#c79fbe]',
  },
  {
    name: 'Crime',
    icon: Fingerprint,
    badgeClass: 'bg-[#3b2b2b] text-[#dfc0c0] border-[#563e3e]',
    iconClass: 'text-[#d48b8b]',
  },
  {
    name: 'Slice of Life',
    icon: Coffee,
    badgeClass: 'bg-[#2e362f] text-[#c4d4c6] border-[#424f44]',
    iconClass: 'text-[#97ba9b]',
  },
  {
    name: 'Food',
    icon: Utensils,
    badgeClass: 'bg-[#3c3027] text-[#e3c7b0] border-[#574537]',
    iconClass: 'text-[#df9f70]',
  },
  {
    name: 'Romance',
    icon: Heart,
    badgeClass: 'bg-[#3b2c31] text-[#e2c2cc] border-[#553e46]',
    iconClass: 'text-[#da8ea6]',
  },
  {
    name: 'Memoir',
    icon: Feather,
    badgeClass: 'bg-[#34312a] text-[#d6cebc] border-[#4c473d]',
    iconClass: 'text-[#bfb395]',
  },
  {
    name: 'Self-Help',
    icon: Sun,
    badgeClass: 'bg-[#3a3426] text-[#e2d4b0] border-[#544b35]',
    iconClass: 'text-[#dfc070]',
  },
]

const GENRE_MAP = new Map<string, GenreMeta>(
  PRESET_GENRES.map((genre) => [genre.name.toLowerCase(), genre]),
)

const DEFAULT_GENRE_META: GenreMeta = {
  name: 'Other',
  icon: Tag,
  badgeClass: 'bg-[#362e29] text-[#cbbdb0] border-[#4b4039]',
  iconClass: 'text-[#a89889]',
}

export function getGenreMeta(name: string): GenreMeta {
  const matched = GENRE_MAP.get(name.trim().toLowerCase())
  if (matched) return matched
  return {
    ...DEFAULT_GENRE_META,
    name,
  }
}
