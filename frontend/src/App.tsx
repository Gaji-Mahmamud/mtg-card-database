import { useState, useEffect } from 'react'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Types
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
}

interface SearchResponse {
  data: Card[]
  total_cards: number
  has_more: boolean
  page: number
  message?: string
}

// API functions
const searchCards = async (query: string, page: number = 1): Promise<SearchResponse> => {
  const response = await fetch(`http://127.0.0.1:8000/search/cards?q=${encodeURIComponent(query)}&page=${page}`)
  if (!response.ok) {
    throw new Error('Failed to search cards')
  }
  return response.json()
}

const testBackend = async () => {
  const response = await fetch('http://127.0.0.1:8000/')
  if (!response.ok) {
    throw new Error('Failed to fetch backend data')
  }
  return response.json()
}

// Card Detail Modal
function CardModal({ card, isOpen, onClose }: { card: Card | null, isOpen: boolean, onClose: () => void }) {
  if (!isOpen || !card) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ring-1 ring-white/5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-gray-800/50 backdrop-blur-sm rounded-full p-2 border border-white/10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Card Image */}
          {card.image_uris?.normal && (
            <div className="flex-shrink-0">
              <img 
                src={card.image_uris.normal} 
                alt={card.name}
                className="w-full md:w-64 rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Card Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{card.name}</h2>
              <p className="text-purple-300 font-medium">{card.type_line}</p>
            </div>

            {card.mana_cost && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Mana Cost</h3>
                <p className="text-lg text-blue-300 font-mono">{card.mana_cost}</p>
              </div>
            )}

            {card.oracle_text && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Oracle Text</h3>
                <p className="text-gray-200 leading-relaxed">{card.oracle_text}</p>
              </div>
            )}

            {card.power && card.toughness && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Power / Toughness</h3>
                <p className="text-xl text-red-300 font-bold">{card.power} / {card.toughness}</p>
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

            {/* Pricing */}
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

            {card.scryfall_uri && (
              <a
                href={card.scryfall_uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-purple-300 px-4 py-2 rounded-lg transition-all"
              >
                View on Scryfall
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Card component
function CardResult({ card, onClick }: { card: Card, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group shadow-lg ring-1 ring-white/5"
    >
      <div className="flex gap-4">
        {card.image_uris?.small && (
          <img 
            src={card.image_uris.small} 
            alt={card.name}
            className="w-16 h-22 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-white truncate">{card.name}</h3>
          <p className="text-purple-300 text-sm">{card.type_line}</p>
          {card.mana_cost && (
            <p className="text-xs text-blue-300 mt-1 font-mono">{card.mana_cost}</p>
          )}
          {card.oracle_text && (
            <p className="text-xs text-gray-300 mt-2 line-clamp-2 leading-relaxed">
              {card.oracle_text}
            </p>
          )}
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-yellow-400 capitalize">{card.rarity}</span>
            <span className="text-green-400">{card.set_name}</span>
            {card.power && card.toughness && (
              <span className="text-red-400">{card.power}/{card.toughness}</span>
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

// Search component
function CardSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['card-search', submittedQuery],
    queryFn: () => searchCards(submittedQuery),
    enabled: !!submittedQuery,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSubmittedQuery(searchQuery.trim())
    }
  }

  const openCardModal = (card: Card) => {
    setSelectedCard(card)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedCard(null)
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
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 shadow-xl ring-1 ring-white/5">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for Magic cards... (e.g., Lightning Bolt, Jace, Island)"
            className="flex-1 px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm"
          />
          <button
            type="submit"
            disabled={!searchQuery.trim() || searchLoading}
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
        </form>
      </div>

      {/* Search Results */}
      {searchError && (
        <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl p-4 mb-6 ring-1 ring-red-500/10">
          <div className="text-red-300 font-medium">Search Error</div>
          <div className="text-red-400 text-sm mt-1">{searchError.message}</div>
        </div>
      )}

      {searchResults && (
        <div>
          <div className="mb-6 text-gray-300">
            <span className="text-xl font-semibold text-white">{searchResults.total_cards}</span> cards found
            {searchResults.message && (
              <span className="ml-2 text-gray-400">• {searchResults.message}</span>
            )}
          </div>
          
          <div className="grid gap-4">
            {searchResults.data.map((card) => (
              <CardResult 
                key={card.id} 
                card={card} 
                onClick={() => openCardModal(card)}
              />
            ))}
          </div>
          
          {searchResults.has_more && (
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">More results available on next page</p>
            </div>
          )}
        </div>
      )}

      {/* Card Detail Modal */}
      <CardModal 
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  )
}

// Backend status toast
function BackendStatusToast() {
  const [isVisible, setIsVisible] = useState(true)
  const { data, isLoading, error } = useQuery({
    queryKey: ['backend-test'],
    queryFn: testBackend,
  })

  // Auto-hide after 4 seconds when loaded
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