import type { ParticleState, StateGenerator } from '../types'
import { genNebula } from './nebula'
import { genConstellation } from './constellation'
import { genFlow } from './flow'
import { genLogo } from './logo'
import { genTrails } from './trails'
import { genCity } from './city'
import { genBuilding } from './building'
import { genHome } from './home'
import { genDevice } from './device'

export const STATE_FNS: Record<ParticleState, StateGenerator> = {
  nebula: genNebula,
  constellation: genConstellation,
  flow: genFlow,
  logo: genLogo,
  trails: genTrails,
  city: genCity,
  building: genBuilding,
  home: genHome,
  device: genDevice,
}
