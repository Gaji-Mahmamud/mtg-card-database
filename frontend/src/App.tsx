import { useState, useEffect } from 'react'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// Types
interface CardFace {
  name?: string
  mana_cost?: string
  type_line?: string
  oracle_text?: string
  power?: string
  toughness?: string
  image_uris?: {
    small?: string
    normal?: string
    large?: string
  }
}

interface Card {
  id: string
  name: string
  mana_cost?: string
  type_line: string
  oracle_text?: string
  power?: string
  toughness?: string
  colors: string[]
  rarity: string
  set_name: string
  image_uris?: {
    small?: string
    normal?: string
    large?: string
  }
  scryfall_uri?: string
  prices?: {
    usd?: string
    usd_foil?: string
    eur?: string
    eur_foil?: string
  }
  has_multiple_faces?: boolean
  card_faces?: {
    front: CardFace
    back: CardFace | null
  } | null
}

interface CardPrinting {
  id: string
  name: string
  set_name: string
  set_code: string
  collector_number: string
  released_at: string
  rarity: string
  artist?: string
  flavor_text?: string
  image_uris?: {
    small?: string
    normal?: string
    large?: string
  }
  back_image_uris?: {
    small?: string
    normal?: string
    large?: string
  } | null
  prices?: {
    usd?: string
    usd_foil?: string
    eur?: string
    eur_foil?: string
  }
  scryfall_uri?: string
}

interface PrintingsResponse {
  data: CardPrinting[]
  total_printings: number
  card_name: string
}

interface SearchResponse {
  data: Card[]
  total_cards: number
  has_more: boolean
  page: number
  next_page?: number
  message?: string
}

interface SearchFilters {
  colors: string[]
  types: string[]
  rarity: string
}

// API functions
const searchCards = async (
  query: string, 
  page: number = 1, 
  filters: SearchFilters = { colors: [], types: [], rarity: '' }
): Promise<SearchResponse> => {
  const params = new URLSearchParams({
    page: page.toString()
  })
  
  // Only add query if it exists
  if (query.trim()) {
    params.append('q', query)
  }
  
  if (filters.colors.length > 0) {
    params.append('colors', filters.colors.join(','))
  }
  if (filters.types.length > 0) {
    params.append('types', filters.types.join(','))
  }
  if (filters.rarity) {
    params.append('rarity', filters.rarity)
  }
  
  const response = await fetch(`${API_URL}/search/cards?${params}`)
  if (!response.ok) {
    throw new Error('Failed to search cards')
  }
  return response.json()
}

const getCardPrintings = async (cardName: string): Promise<PrintingsResponse> => {
  const response = await fetch(`${API_URL}/cards/${encodeURIComponent(cardName)}/printings`)
  if (!response.ok) {
    throw new Error('Failed to fetch card printings')
  }
  return response.json()
}

const getFilterOptions = async () => {
  const response = await fetch(`${API_URL}/search/filters`)
  if (!response.ok) {
    throw new Error('Failed to fetch filter options')
  }
  return response.json()
}

// Advanced Search Filters Component
function SearchFilters({ filters, onFiltersChange }: { 
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void 
}) {
  const { data: filterOptions } = useQuery({
    queryKey: ['filter-options'],
    queryFn: getFilterOptions,
  })

  if (!filterOptions) return null

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-4">
      <h3 className="text-white font-semibold">Advanced Filters</h3>
      
      {/* Colors */}
      <div>
        <label className="text-sm text-gray-300 block mb-2">Colors</label>
        <div className="flex flex-wrap gap-2">
          {filterOptions.colors.map((color: any) => (
            <button
              key={color.value}
              onClick={() => {
                const newColors = filters.colors.includes(color.value)
                  ? filters.colors.filter(c => c !== color.value)
                  : [...filters.colors, color.value]
                onFiltersChange({ ...filters, colors: newColors })
              }}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                filters.colors.includes(color.value)
                  ? 'bg-purple-600/80 border-purple-500 text-white'
                  : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
              }`}
            >
              {color.symbol} {color.label}
            </button>
          ))}
        </div>
      </div>

      {/* Types */}
      <div>
        <label className="text-sm text-gray-300 block mb-2">Card Types</label>
        <div className="flex flex-wrap gap-2">
          {filterOptions.types.map((type: string) => (
            <button
              key={type}
              onClick={() => {
                const newTypes = filters.types.includes(type)
                  ? filters.types.filter(t => t !== type)
                  : [...filters.types, type]
                onFiltersChange({ ...filters, types: newTypes })
              }}
              className={`px-3 py-1 text-xs rounded-full border transition-all capitalize ${
                filters.types.includes(type)
                  ? 'bg-blue-600/80 border-blue-500 text-white'
                  : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Rarity */}
      <div>
        <label className="text-sm text-gray-300 block mb-2">Rarity</label>
        <select
          value={filters.rarity}
          onChange={(e) => onFiltersChange({ ...filters, rarity: e.target.value })}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          <option value="">All Rarities</option>
          {filterOptions.rarities.map((rarity: any) => (
            <option key={rarity.value} value={rarity.value} className="bg-gray-800">
              {rarity.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => onFiltersChange({ colors: [], types: [], rarity: '' })}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        Clear all filters
      </button>
    </div>
  )
}

// Card Detail Modal
function CardModal({ 
  card, 
  isOpen, 
  onClose, 
  onViewArtworks 
}: { 
  card: Card | null
  isOpen: boolean
  onClose: () => void
  onViewArtworks: (cardName: string) => void
}) {
  const [showBackFace, setShowBackFace] = useState(false)
  
  if (!isOpen || !card) return null

  const hasBackFace = card.has_multiple_faces && card.card_faces?.back
  const currentFace = showBackFace && hasBackFace ? card.card_faces!.back! : card.card_faces?.front || card
  const currentImage = currentFace.image_uris?.normal || card.image_uris?.normal

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-gray-900/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ring-1 ring-white/5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-gray-800/50 backdrop-blur-sm rounded-full p-2 border border-white/10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          {currentImage && (
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="relative mb-3">
                <img 
                  src={currentImage}
                  alt={currentFace.name || card.name}
                  className="w-full md:w-64 rounded-lg shadow-lg"
                />
              </div>
              {hasBackFace && (
                <button
                  onClick={() => setShowBackFace(!showBackFace)}
                  className="bg-purple-600/80 hover:bg-purple-700/80 text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium shadow-lg"
                >
                  Flip Over
                </button>
              )}
            </div>
          )}

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {showBackFace && hasBackFace ? currentFace.name : card.name}
              </h2>
              <p className="text-purple-300 font-medium">{currentFace.type_line || card.type_line}</p>
              {hasBackFace && (
                <p className="text-sm text-gray-400 mt-1">Double-faced card</p>
              )}
            </div>

            {currentFace.mana_cost && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Mana Cost</h3>
                <p className="text-lg text-blue-300 font-mono">{currentFace.mana_cost}</p>
              </div>
            )}

            {currentFace.oracle_text && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Oracle Text</h3>
                <p className="text-gray-200 leading-relaxed">{currentFace.oracle_text}</p>
              </div>
            )}

            {currentFace.power && currentFace.toughness && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Power / Toughness</h3>
                <p className="text-xl text-red-300 font-bold">{currentFace.power} / {currentFace.toughness}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="text-gray-300 font-semibold">Rarity</h3>
                <p className="text-yellow-300 capitalize">{card.rarity}</p>
              </div>
              <div>
                <h3 className="text-gray-300 font-semibold">Set</h3>
                <p className="text-green-300">{card.set_name}</p>
              </div>
            </div>

            {card.prices && (card.prices.usd || card.prices.eur) && (
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">Market Prices</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {card.prices.usd && (
                    <div>
                      <p className="text-gray-400">USD (Normal)</p>
                      <p className="text-green-400 font-semibold">${card.prices.usd}</p>
                    </div>
                  )}
                  {card.prices.usd_foil && (
                    <div>
                      <p className="text-gray-400">USD (Foil)</p>
                      <p className="text-blue-400 font-semibold">${card.prices.usd_foil}</p>
                    </div>
                  )}
                  {card.prices.eur && (
                    <div>
                      <p className="text-gray-400">EUR (Normal)</p>
                      <p className="text-green-400 font-semibold">€{card.prices.eur}</p>
                    </div>
                  )}
                  {card.prices.eur_foil && (
                    <div>
                      <p className="text-gray-400">EUR (Foil)</p>
                      <p className="text-blue-400 font-semibold">€{card.prices.eur_foil}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 border-t border-white/10 pt-4">
              <button
                onClick={() => onViewArtworks(card.name.split(' // ')[0])}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all font-medium"
              >
                View All Artworks
              </button>
              
              {card.scryfall_uri && (
                <a
                  href={card.scryfall_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-purple-300 px-4 py-2 rounded-lg transition-all"
                >
                  Scryfall
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Printing Item Component for Gallery
function PrintingItem({ printing, onCardSelect }: { printing: CardPrinting, onCardSelect: (printing: CardPrinting) => void }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const hasBackFace = printing.name && printing.name.includes(' // ') && printing.back_image_uris
  
  const currentImage = isFlipped && hasBackFace 
    ? printing.back_image_uris?.normal 
    : printing.image_uris?.normal
  
  return (
    <div 
      onClick={() => onCardSelect(printing)}
      onMouseEnter={() => hasBackFace && setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group shadow-lg ring-1 ring-white/5"
    >
      {currentImage ? (
        <div className="relative">
          <img 
            src={currentImage}
            alt={`${printing.name} - ${printing.set_name}`}
            className="w-full rounded-lg mb-3 group-hover:scale-105 transition-transform"
          />
          {hasBackFace && (
            <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full opacity-80" title="Double-faced card" />
          )}
        </div>
      ) : (
        <div className="w-full h-80 bg-gray-800/50 rounded-lg mb-3 flex items-center justify-center">
          <span className="text-gray-400 text-sm">No Image</span>
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className="font-semibold text-white text-sm truncate">{printing.set_name}</h3>
        <div className="text-xs text-gray-300">
          <div>#{printing.collector_number}</div>
          <div className="text-yellow-400 capitalize">{printing.rarity}</div>
          {printing.artist && (
            <div className="text-purple-300">by {printing.artist}</div>
          )}
          {printing.released_at && (
            <div className="text-gray-400">{new Date(printing.released_at).getFullYear()}</div>
          )}
        </div>
        
        {printing.prices?.usd && (
          <div className="text-xs text-green-400 font-semibold">
            ${printing.prices.usd}
          </div>
        )}
      </div>
    </div>
  )
}

// Artwork Gallery Modal
function ArtworkGalleryModal({ 
  cardName, 
  isOpen, 
  onClose, 
  onCardSelect 
}: { 
  cardName: string | null
  isOpen: boolean
  onClose: () => void
  onCardSelect: (printing: CardPrinting) => void
}) {
  const { data: printings, isLoading, error } = useQuery({
    queryKey: ['card-printings', cardName],
    queryFn: () => getCardPrintings(cardName!),
    enabled: isOpen && !!cardName,
  })

  if (!isOpen || !cardName) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-gray-900/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ring-1 ring-white/5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{cardName}</h2>
            <p className="text-gray-400">All Artworks & Printings</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors bg-gray-800/50 backdrop-blur-sm rounded-full p-2 border border-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="ml-3 text-white">Loading artworks...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <div className="text-red-300 font-medium">Error Loading Artworks</div>
            <div className="text-red-400 text-sm mt-1">{error.message}</div>
          </div>
        )}

        {printings && printings.data.length > 0 && (
          <div>
            <div className="mb-4 text-gray-300">
              <span className="text-lg font-semibold text-white">{printings.total_printings}</span> printings found
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {printings.data.map((printing) => (
                <PrintingItem 
                  key={printing.id}
                  printing={printing}
                  onCardSelect={onCardSelect}
                />
              ))}
            </div>
          </div>
        )}

        {printings && printings.data.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No printings found for this card</div>
          </div>
        )}
      </div>
    </div>
  )
}

// View Toggle
function ViewToggle({ view, onViewChange }: { view: 'list' | 'gallery', onViewChange: (view: 'list' | 'gallery') => void }) {
  return (
    <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
      <button
        onClick={() => onViewChange('list')}
        className={`px-3 py-1 text-sm rounded transition-all ${
          view === 'list' 
            ? 'bg-purple-600/80 text-white' 
            : 'text-gray-300 hover:text-white'
        }`}
      >
        List
      </button>
      <button
        onClick={() => onViewChange('gallery')}
        className={`px-3 py-1 text-sm rounded transition-all ${
          view === 'gallery' 
            ? 'bg-purple-600/80 text-white' 
            : 'text-gray-300 hover:text-white'
        }`}
      >
        Gallery
      </button>
    </div>
  )
}

// Card components for different views
function CardListItem({ card, onClick }: { card: Card, onClick: () => void }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const hasBackFace = card.has_multiple_faces && card.card_faces?.back

  const currentFace = isFlipped && hasBackFace ? card.card_faces!.back! : card.card_faces?.front || card
  const currentImage = currentFace.image_uris?.small || card.image_uris?.small

  return (
    <div 
      onClick={onClick}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group shadow-lg ring-1 ring-white/5"
    >
      <div className="flex gap-4">
        {currentImage && (
          <div 
            className="relative w-16 h-22 flex-shrink-0"
            onMouseEnter={() => hasBackFace && setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
          >
            <img 
              src={currentImage}
              alt={currentFace.name || card.name}
              className="w-full h-full rounded-lg object-cover group-hover:scale-105 transition-transform"
            />
            {hasBackFace && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-purple-500 rounded-full opacity-70" title="Double-faced card" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-white truncate">
            {isFlipped && hasBackFace ? currentFace.name : card.name}
          </h3>
          <p className="text-purple-300 text-sm">{currentFace.type_line || card.type_line}</p>
          {currentFace.mana_cost && (
            <p className="text-xs text-blue-300 mt-1 font-mono">{currentFace.mana_cost}</p>
          )}
          {currentFace.oracle_text && (
            <p className="text-xs text-gray-300 mt-2 line-clamp-2 leading-relaxed">
              {currentFace.oracle_text}
            </p>
          )}
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-yellow-400 capitalize">{card.rarity}</span>
            <span className="text-green-400">{card.set_name}</span>
            {currentFace.power && currentFace.toughness && (
              <span className="text-red-400">{currentFace.power}/{currentFace.toughness}</span>
            )}
            {card.prices?.usd && (
              <span className="text-green-300">${card.prices.usd}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CardGalleryItem({ card, onClick }: { card: Card, onClick: () => void }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const hasBackFace = card.has_multiple_faces && card.card_faces?.back

  const currentFace = isFlipped && hasBackFace ? card.card_faces!.back! : card.card_faces?.front || card
  const currentImage = currentFace.image_uris?.normal || card.image_uris?.normal

  return (
    <div 
      onClick={onClick}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group shadow-lg ring-1 ring-white/5"
    >
      <div 
        className="relative"
        onMouseEnter={() => hasBackFace && setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
      >
        {currentImage ? (
          <img 
            src={currentImage}
            alt={currentFace.name || card.name}
            className="w-full rounded-lg mb-3 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-80 bg-gray-800/50 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}
        {hasBackFace && (
          <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full opacity-80" title="Double-faced card" />
        )}
      </div>
      <h3 className="font-semibold text-white text-sm truncate">
        {isFlipped && hasBackFace ? currentFace.name : card.name}
      </h3>
      <p className="text-purple-300 text-xs truncate">{currentFace.type_line || card.type_line}</p>
      <div className="flex justify-between items-center mt-2 text-xs">
        <span className="text-yellow-400 capitalize">{card.rarity}</span>
        {card.prices?.usd && (
          <span className="text-green-300">${card.prices.usd}</span>
        )}
      </div>
    </div>
  )
}

// Pagination Component
function Pagination({ 
  currentPage, 
  hasMore, 
  onPageChange, 
  isLoading 
}: { 
  currentPage: number
  hasMore: boolean
  onPageChange: (page: number) => void
  isLoading: boolean
}) {
  return (
    <div className="flex justify-center items-center gap-4 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || isLoading}
        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:bg-gray-600/50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
      >
        Previous
      </button>
      
      <span className="text-white font-medium">
        Page {currentPage}
      </span>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasMore || isLoading}
        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:bg-gray-600/50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
      >
        Next
      </button>
    </div>
  )
}

// Main Search Component
function CardSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [originalCard, setOriginalCard] = useState<Card | null>(null) // Add this line
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [artworkCardName, setArtworkCardName] = useState<string | null>(null)
  const [isArtworkModalOpen, setIsArtworkModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState<'list' | 'gallery'>('list')
  const [filters, setFilters] = useState<SearchFilters>({
    colors: [],
    types: [],
    rarity: ''
  })

  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['card-search', submittedQuery, currentPage, filters],
    queryFn: () => searchCards(submittedQuery, currentPage, filters),
    enabled: !!submittedQuery || filters.colors.length > 0 || filters.types.length > 0 || !!filters.rarity,
  })

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (searchQuery.trim() || filters.colors.length > 0 || filters.types.length > 0 || filters.rarity) {
      setSubmittedQuery(searchQuery.trim())
      setCurrentPage(1)
    }
  }

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    // Auto-search when filters change (even without text query)
    if (newFilters.colors.length > 0 || newFilters.types.length > 0 || newFilters.rarity) {
      setSubmittedQuery(searchQuery.trim())
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const openCardModal = (card: Card) => {
    setSelectedCard(card)
    setOriginalCard(card) // Store the original card data
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedCard(null)
  }

  const openArtworkModal = (cardName: string) => {
    setArtworkCardName(cardName)
    setIsArtworkModalOpen(true)
    setIsModalOpen(false) // Close card detail modal
    // Keep originalCard so we can restore the full data
  }

  const closeArtworkModal = () => {
    setIsArtworkModalOpen(false)
    setArtworkCardName(null)
  }

  const handlePrintingSelect = (printing: CardPrinting) => {
    if (!originalCard) return // Safety check
    
    // Merge original card data with printing-specific info
    const cardWithNewPrinting: Card = {
      ...originalCard, // Keep all the original card details (mana cost, oracle text, etc.)
      id: printing.id,
      set_name: printing.set_name,
      image_uris: printing.image_uris,
      prices: printing.prices,
      scryfall_uri: printing.scryfall_uri
      // Don't override rarity from printing as it could be promotional/special
    }
    
    setSelectedCard(cardWithNewPrinting)
    setIsArtworkModalOpen(false)
    setIsModalOpen(true)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          MTG Card Database
        </h1>
        <p className="text-gray-400 text-lg">Discover and explore Magic: The Gathering cards</p>
      </div>
      
      {/* Search Form */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6 shadow-xl ring-1 ring-white/5">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            placeholder="Search cards by name or use filters below... (e.g., Lightning Bolt, Jace)"
            className="flex-1 px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl transition-colors border border-white/10 ${
              showFilters ? 'bg-purple-600/80 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Filters
          </button>
          <button
            onClick={handleSearch}
            disabled={(!searchQuery.trim() && filters.colors.length === 0 && filters.types.length === 0 && !filters.rarity) || searchLoading}
            className="px-8 py-3 bg-purple-600/80 backdrop-blur-sm text-white rounded-xl hover:bg-purple-700/80 disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-colors shadow-lg border border-white/10"
          >
            {searchLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching...
              </div>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mb-6">
          <SearchFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>
      )}

      {/* Search Results */}
      {searchError && (
        <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl p-4 mb-6 ring-1 ring-red-500/10">
          <div className="text-red-300 font-medium">Search Error</div>
          <div className="text-red-400 text-sm mt-1">{searchError.message}</div>
        </div>
      )}

      {searchResults && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-300">
              <span className="text-xl font-semibold text-white">{searchResults.total_cards}</span> cards found
              {searchResults.message && (
                <span className="ml-2 text-gray-400">• {searchResults.message}</span>
              )}
            </div>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
          
          {view === 'list' ? (
            <div className="grid gap-4">
              {searchResults.data.map((card) => (
                <CardListItem 
                  key={card.id} 
                  card={card} 
                  onClick={() => openCardModal(card)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {searchResults.data.map((card) => (
                <CardGalleryItem 
                  key={card.id} 
                  card={card} 
                  onClick={() => openCardModal(card)}
                />
              ))}
            </div>
          )}
          
          <Pagination 
            currentPage={currentPage}
            hasMore={searchResults.has_more}
            onPageChange={handlePageChange}
            isLoading={searchLoading}
          />
        </div>
      )}

      {/* Card Detail Modal */}
      <CardModal 
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={closeModal}
        onViewArtworks={openArtworkModal}
      />

      {/* Artwork Gallery Modal */}
      <ArtworkGalleryModal 
        cardName={artworkCardName}
        isOpen={isArtworkModalOpen}
        onClose={closeArtworkModal}
        onCardSelect={handlePrintingSelect}
      />
    </div>
  )
}

// Backend status component
function BackendStatusToast() {
  const [isVisible, setIsVisible] = useState(true)
  const { data, isLoading, error } = useQuery({
    queryKey: ['backend-test'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/`)
      if (!response.ok) throw new Error('Failed to fetch backend data')
      return response.json()
    },
  })

  useEffect(() => {
    if (data || error) {
      const timer = setTimeout(() => setIsVisible(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [data, error])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-xl ring-1 ring-white/5">
        {isLoading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400"></div>
            <span className="text-gray-300 text-sm">Connecting...</span>
          </div>
        )}
        
        {error && (
          <div>
            <div className="text-red-300 font-medium text-sm">❌ Backend Error</div>
            <div className="text-red-400 text-xs mt-1">Check server status</div>
          </div>
        )}
        
        {data && (
          <div>
            <div className="text-green-300 font-medium text-sm">✅ Connected</div>
            <div className="text-green-400 text-xs mt-1">API v{data.version}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main App
const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <CardSearch />
        </div>
        <BackendStatusToast />
      </div>
    </QueryClientProvider>
  )
}

export default App