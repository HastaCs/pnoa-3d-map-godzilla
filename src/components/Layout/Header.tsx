import { CitySelector } from '../UI/CitySelector'
import type { City } from '../../types'

interface HeaderProps {
  cities: City[]
  selectedCity: City | null
  onCitySelect: (city: City) => void
  citiesLoading: boolean
  selectorOpen?: boolean
  onSelectorOpenChange?: (open: boolean) => void
}

export function Header({
  cities,
  selectedCity,
  onCitySelect,
  citiesLoading,
  selectorOpen,
  onSelectorOpenChange,
}: HeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-5 px-5 py-5 bg-gradient-to-b from-obsidian-loam/70 to-transparent pointer-events-none">
      <div className="pointer-events-auto flex items-baseline gap-3 min-w-0">
        <span className="text-[14px] font-medium tracking-[-0.03em] text-bone-vellum">
          PNOA
        </span>
        <span className="hidden sm:inline font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-drift-ash">
          Ciudades 3D
        </span>
      </div>

      <div className="pointer-events-auto">
        <CitySelector
          cities={cities}
          selectedCity={selectedCity}
          onSelect={onCitySelect}
          loading={citiesLoading}
          isOpen={selectorOpen}
          onOpenChange={onSelectorOpenChange}
        />
      </div>
    </header>
  )
}
