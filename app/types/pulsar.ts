export interface PulsarDomainStat {
  domain: string
  scrobbles: number
  seconds: number
}

export interface PulsarStats {
  total_scrobbles: number
  total_seconds: number
  domains?: PulsarDomainStat[]
}

export interface PulsarSession {
  id: string
  domain: string
  title: string
  subtitle?: string | null
  caption?: string | null
  artwork_url?: string | null
  duration_seconds?: number | null
  position_seconds?: number | null
  status?: string
  started_at?: string
}

export interface PulsarCatalogItem {
  id: string
  urn?: string
  domain: string
  title: string
  subtitle?: string | null
  caption?: string | null
  artwork_url?: string | null
  duration_seconds?: number | null
}

export interface PulsarCollectionItem {
  id: string
  collection_id: string
  catalog_id?: string | null
  position: number
  note?: string | null
  rating?: number | null
  status?: string | null
  progress?: number | null
  volume_progress?: number | null
  catalog_item?: PulsarCatalogItem | null
}

export interface PulsarShelf {
  id: string
  account_id: string
  domain: string
  kind: string
  name: string
  description?: string | null
  is_public: boolean
  artwork_url?: string | null
  items?: PulsarCollectionItem[]
}

export interface PulsarScrobble {
  id: string
  domain: string
  title: string
  subtitle?: string | null
  caption?: string | null
  artwork_url?: string | null
  duration_seconds?: number | null
  scrobbled_at: string
  catalog_id?: string | null
}

export interface PulsarRewindTopItem {
  title: string
  subtitle?: string | null
  domain?: string
  artwork_url?: string | null
  count: number
}

export interface PulsarRewind {
  year: number
  total_scrobbles: number
  total_seconds: number
  domains?: PulsarDomainStat[]
  top_items?: PulsarRewindTopItem[]
}
