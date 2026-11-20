import Snake from './Snake'
import Apple from './Apple'
import Obstacles from './Obstacles'
import ApplePathHighlight from './ApplePathHighlight'
import AppleDistanceRings from './AppleDistanceRings'

// ArenaViewport owns the fixed camera, field and environment.
export function Scene() {
  return <><Snake /><Apple /><Obstacles /><ApplePathHighlight /><AppleDistanceRings /></>
}
