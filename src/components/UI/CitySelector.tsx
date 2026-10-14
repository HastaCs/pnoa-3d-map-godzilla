import { useState, useMemo } from 'react'
import { Search, MapPin, ChevronDown, X, Box } from 'lucide-react'
import type { City } from '../../types'

interface CitySelectorProps {
  cities: City[]
  selectedCity: City | null
  onSelect: (city: City) => void
  loading: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CitySelector({
  cities,
  selectedCity,
  onSelect,
  loading,
  isOpen: isOpenProp,
  onOpenChange,
}: CitySelectorProps) {
  const [isOpenInternal, setIsOpenInternal] = useState(false)
  const isOpen = isOpenProp ?? isOpenInternal
  const setIsOpen = (open: boolean) => {
    if (isOpenProp === undefined) setIsOpenInternal(open)
    onOpenChange?.(open)
  }
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return cities.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.region.toLowerCase().includes(term)
    )
  }, [cities, search])

  const grouped = useMemo(() => {
    const groups: Record<string, City[]> = {}
    for (const city of filtered) {
      if (!groups[city.region]) groups[city.region] = []
      groups[city.region].push(city)
    }
    return groups
  }, [filtered])

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 border border-iron-filings rounded-md">
        <div className="w-3 h-3 border border-drift-ash border-t-lime-surveyor rounded-full animate-spin" />
        <span className="font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-drift-ash">
          Cargando
        </span>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-[18px] py-[14px] bg-lime-surveyor text-obsidian-loam rounded-md min-w-[240px] hover:bg-marsh-olive"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-obsidian-loam shrink-0" />
        <span className="flex-1 text-left font-jetbrains-mono text-caption uppercase tracking-[0.15em] truncate">
          {selectedCity ? selectedCity.name : 'Selecciona ciudad'}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-80 max-w-[min(20rem,calc(100vw-2rem))] max-h-[70vh] bg-obsidian-loam border border-iron-filings rounded-md z-50 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-iron-filings">
              <div className="relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-drift-ash" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ciudad"
                  className="w-full pl-6 pr-8 pb-2 bg-transparent border-0 border-b border-iron-filings font-jetbrains-mono text-[14px] text-bone-vellum placeholder:text-drift-ash focus:outline-none focus:border-lime-surveyor"
                  autoFocus
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-drift-ash hover:text-bone-vellum"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2">
              {filtered.length === 0 ? (
                <div className="p-4 font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-drift-ash">
                  Sin resultados
                </div>
              ) : (
                Object.entries(grouped).map(([region, regionCities]) => (
                  <div key={region} className="mb-3">
                    <div className="px-2 py-1.5 font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-drift-ash">
                      {region}
                    </div>
                    {regionCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => {
                          onSelect(city)
                          setIsOpen(false)
                          setSearch('')
                        }}
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left ${
                          selectedCity?.id === city.id
                            ? 'text-lime-surveyor'
                            : 'text-bone-vellum hover:bg-bone-vellum/5'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-drift-ash shrink-0" />
                        <span className="flex-1 truncate font-jetbrains-mono text-[14px]">
                          {city.name}
                        </span>
                        {city.tilesetUrl && (
                          <Box className="w-3.5 h-3.5 text-lime-surveyor shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
