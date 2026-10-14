import './index.css'
import { useState } from 'react'
import { MapContainer } from './components/Map/MapContainer'
import { Header } from './components/Layout/Header'
import { MonumentPanel } from './components/UI/MonumentPanel'
import { SplashScreen } from './components/UI/SplashScreen'
import { useCities } from './hooks/useCities'
import { useMonuments } from './hooks/useMonuments'
import type { City, Monument } from './types'

function App() {
  const { cities, loading: citiesLoading, error: citiesError } = useCities()
  const citiesWith3D = cities.filter((city) => city.tilesetUrl)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [selectedMonument, setSelectedMonument] = useState<Monument | null>(null)
  const [citySelectorOpen, setCitySelectorOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const { monuments, loading: monumentsLoading, hiddenCount } = useMonuments(selectedCity)

  const handleCitySelect = (city: City) => {
    setSelectedCity(city)
    setSelectedMonument(null)
    setPanelOpen(true)
  }

  const handleMonumentSelect = (monument: Monument | null) => {
    setSelectedMonument(monument)
    if (monument) setPanelOpen(true)
  }

  if (citiesError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-obsidian-loam text-bone-vellum p-8">
        <div className="max-w-md">
          <p className="font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-lime-surveyor mb-3">
            Error de conexión
          </p>
          <h1 className="text-subheading text-bone-vellum mb-2">No se pudieron cargar las ciudades</h1>
          <p className="text-body text-drift-ash">{citiesError}</p>
          <p className="font-jetbrains-mono text-caption text-drift-ash mt-6">
            Comprueba tu conexión y que el servicio del PNOA esté disponible.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-obsidian-loam">
      <Header
        cities={citiesWith3D}
        selectedCity={selectedCity}
        onCitySelect={handleCitySelect}
        citiesLoading={citiesLoading}
        selectorOpen={citySelectorOpen}
        onSelectorOpenChange={setCitySelectorOpen}
      />

      <MapContainer
        selectedCity={selectedCity}
        monuments={monuments}
        selectedMonument={selectedMonument}
        onMonumentSelect={handleMonumentSelect}
      />

      {showSplash && <SplashScreen onStart={() => setShowSplash(false)} />}

      {selectedCity && panelOpen && (
        <MonumentPanel
          monuments={monuments}
          loading={monumentsLoading}
          selectedMonument={selectedMonument}
          onSelect={handleMonumentSelect}
          onClose={() => {
            setPanelOpen(false)
            setSelectedMonument(null)
          }}
          className="top-4 z-100"
          hiddenCount={hiddenCount}
        />
      )}
    </div>
  )
}

export default App
