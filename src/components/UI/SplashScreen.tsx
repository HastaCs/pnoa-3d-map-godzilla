import { useEffect } from 'react'
import { Box } from 'lucide-react'

interface SplashScreenProps {
  onStart: () => void
}

const STEPS = [
  {
    title: 'Elige una ciudad',
    text: 'Abre el selector, arriba a la derecha. Las marcadas con el cubo tienen modelo 3D.',
  },
  {
    title: 'Explora sus lugares',
    text: 'Se despliega el inventario de monumentos y edificios singulares de la ciudad.',
  },
  {
    title: 'Vuela hasta un lugar',
    text: 'Selecciona un lugar para volar hasta él y orbitar sobre el modelo 3D.',
  },
  {
    title: 'Cambia de ciudad',
    text: 'Cierra el inventario para volver a elegir otra ciudad.',
  },
]

export function SplashScreen({ onStart }: SplashScreenProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStart()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onStart])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Introducción a PNOA Ciudades 3D"
      className="absolute inset-0 z-[200] flex items-center justify-center p-5 overflow-y-auto bg-gradient-to-b from-obsidian-loam/85 via-obsidian-loam/70 to-obsidian-loam/90"
    >
      <div className="w-full max-w-xl">
        <span className="inline-block font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-obsidian-loam bg-lime-surveyor px-[7px] py-[5px] rounded-md">
          PNOA · Inventario 3D
        </span>

        <h1 className="mt-7 text-[36px] leading-[0.95] tracking-[-0.03em] text-bone-vellum sm:text-heading sm:leading-[1.06] lg:text-display lg:leading-[0.9]">
          Ciudades en tres dimensiones.
        </h1>

        <p className="mt-7 text-[16px] leading-[1.62] tracking-[-0.03em] text-bone-vellum/90 sm:text-body">
          Ortofoto de máxima actualidad del IGN/CNIG sobre los modelos 3D del PNOA de los núcleos
          urbanos de España. Los monumentos y edificios singulares provienen de Wikidata y Wikipedia.
        </p>

        <p className="mt-4 flex items-center gap-2 font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-drift-ash">
          <Box className="w-3.5 h-3.5 text-lime-surveyor shrink-0" />
          Cobertura 3D: Andalucía · Extremadura · Región de Murcia
        </p>

        <div className="mt-10">
          <p className="font-jetbrains-mono text-caption uppercase tracking-[0.15em] text-lime-surveyor mb-4">
            Cómo navegar
          </p>
          <ol className="space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex items-start gap-4">
                <span className="font-jetbrains-mono text-caption text-lime-surveyor border border-iron-filings rounded-md px-[7px] py-[5px] shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="pt-0.5">
                  <p className="text-[15px] leading-snug tracking-[-0.03em] text-bone-vellum">
                    {step.title}
                  </p>
                  <p className="text-[14px] leading-[1.62] text-drift-ash">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <button
          autoFocus
          onClick={onStart}
          className="mt-10 inline-flex items-center justify-center bg-lime-surveyor text-obsidian-loam font-jetbrains-mono text-[14px] uppercase tracking-[0.15em] px-[18px] py-[14px] rounded-md hover:bg-marsh-olive focus:outline-none focus:ring-2 focus:ring-lime-surveyor/50"
        >
          Comenzar a explorar
        </button>
      </div>
    </div>
  )
}
