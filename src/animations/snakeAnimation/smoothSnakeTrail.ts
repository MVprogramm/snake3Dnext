import { MAX_EATING_BODY_SEGMENTS } from './bodyAnimations/snakeEatingLift'

type Point = { x: number; y: number; z?: number }
export type TrailPose = { x: number; y: number; z: number; yaw: number; pitch: number }
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0))
const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * t })
const EPSILON = 1e-6
const CORNER_RADIUS = .4
const HEAD_TRAIL_OFFSET = .15

const BODY_WAVE_AMPLITUDE = .12
const BODY_WAVE_LENGTH = 4

// Offset across the local path, never vertically. Phase follows distance travelled,
// so speed controls the wave rate naturally and a paused snake keeps its pose.
export function applyBodyWave(poses: TrailPose[], travelled: number): TrailPose[] {
  const fadeIn = Math.min(1, travelled / .5)
  const waved = poses.map((pose, index) => {
    if (index === 0) return { ...pose }
    const amplitude = BODY_WAVE_AMPLITUDE * Math.min(1, index / 2) * fadeIn
    const phase = 2 * Math.PI * (travelled / BODY_WAVE_LENGTH - index / BODY_WAVE_LENGTH)
    const offset = Math.sin(phase) * amplitude
    return { ...pose, x: pose.x - Math.cos(pose.yaw) * offset, y: pose.y - Math.sin(pose.yaw) * offset }
  })
  // Follow the bent centerline rather than rotating independently in place.
  for (let i = 1; i < waved.length; i++) {
    const front = waved[i - 1], back = waved[Math.min(waved.length - 1, i + 1)]
    const dx = front.x - back.x, dy = front.y - back.y
    if (Math.hypot(dx, dy) > EPSILON) waved[i].yaw = Math.atan2(-dx, dy)
  }
  return waved
}

// A quadratic fillet stays within the two adjacent half-cell spans.
export function roundTrail(points: Point[]): Point[] {
  if (points.length < 3) return points.map(p => ({ ...p }))
  const result = [{ ...points[0] }]
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1]
    const incoming = distance(a, b), outgoing = distance(b, c)
    if (incoming < EPSILON || outgoing < EPSILON) continue
    const ax = b.x - a.x, ay = b.y - a.y, az = (b.z ?? 0) - (a.z ?? 0)
    const bx = c.x - b.x, by = c.y - b.y, bz = (c.z ?? 0) - (b.z ?? 0)
    const cross = Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx)
    if (Math.abs(cross) < EPSILON) { result.push({ ...b }); continue }
    const trim = Math.min(CORNER_RADIUS, incoming / 2, outgoing / 2)
    const entry = lerp(b, a, trim / incoming), exit = lerp(b, c, trim / outgoing)
    result.push(entry)
    for (let j = 1; j <= 12; j++) {
      const t = j / 12
      result.push(lerp(lerp(entry, b, t), lerp(b, exit, t), t))
    }
  }
  result.push({ ...points[points.length - 1] })
  return result
}

function sample(points: Point[], lengths: number[], at: number): Point {
  const clamped = Math.max(0, Math.min(lengths[lengths.length - 1], at))
  for (let i = 1; i < points.length; i++) {
    if (lengths[i] >= clamped) {
      const span = lengths[i] - lengths[i - 1]
      return lerp(points[i - 1], points[i], span > EPSILON ? (clamped - lengths[i - 1]) / span : 0)
    }
  }
  return { ...points[points.length - 1] }
}

// Local to the mounted renderer: never writes engine positions or animation state.
export class SmoothSnakeTrail {
  private points: Point[] = []
  private poses: TrailPose[] = []
  private travelled = 0
  private waveDistance = 0

  update(source: number[][], count: number, reset = false): TrailPose[] {
    if (!source.length || count < 1) return []
    const head = { x: source[0][0], y: source[0][1], z: source[0][2] }
    const last = this.points[this.points.length - 1]
    if (reset || !last || distance(last, head) > 2 || count < this.poses.length) {
      // Seed history from the existing body so start/restart and growth have a full trail.
      this.points = source.slice(0, Math.max(count + 2, 3)).map(p => ({ x: p[0], y: p[1], z: p[2] })).reverse()
      this.poses = []
      this.travelled = 0
      this.waveDistance = 0
    } else {
      const moved = distance(last, head)
      this.travelled += moved
      this.waveDistance += Math.hypot(head.x - last.x, head.y - last.y)
      if (moved > EPSILON) {
        const before = this.points[this.points.length - 2]
        if (before) {
          const ax = last.x - before.x, ay = last.y - before.y
          const bx = head.x - last.x, by = head.y - last.y
          const az = (last.z ?? 0) - (before.z ?? 0), bz = head.z - (last.z ?? 0)
          const cross = Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx)
          if (cross < EPSILON && ax * bx + ay * by + az * bz > 0) this.points.pop()
        }
        this.points.push(head)
      }
    }
    // Retain enough history for every potential segment plus a small growth margin.
    let retained = 0
    for (let i = this.points.length - 1; i > 0; i--) {
      retained += distance(this.points[i], this.points[i - 1])
      if (retained > source.length + 4) { this.points.splice(0, i - 1); break }
    }
    const rounded = roundTrail(this.points)
    if (rounded.length < 2) return []
    const lengths = [0]
    for (let i = 1; i < rounded.length; i++) lengths.push(lengths[i - 1] + distance(rounded[i - 1], rounded[i]))
    const end = lengths[lengths.length - 1]
    const offset = Math.min(HEAD_TRAIL_OFFSET, this.travelled * .25)
    const groundFrom = Math.min(count - 1, MAX_EATING_BODY_SEGMENTS + 1)
    this.poses = Array.from({ length: count }, (_, index) => {
      const at = end - offset - index
      const position = sample(rounded, lengths, at)
      const behind = sample(rounded, lengths, at - .12), ahead = sample(rounded, lengths, at + .12)
      const dx = ahead.x - behind.x, dy = ahead.y - behind.y
      const yaw = Math.hypot(dx, dy) > EPSILON ? Math.atan2(-dx, dy) : (this.poses[index]?.yaw ?? 0)
      // Rapidly taper the eating bend through at most four body segments.
      // Short snakes still reach the floor at their tail.
      const t = groundFrom > 0 ? Math.min(1, index / groundFrom) : 1
      const groundedWeight = (1 - t) ** 3
      return { ...position, z: Math.max(0, position.z ?? 0) * groundedWeight, yaw, pitch: 0 }
    })
    const heights = this.poses.map(pose => pose.z)
    for (let i = 0; i < this.poses.length - 1; i++) {
      if (i >= groundFrom) {
        this.poses[i].z = 0
        this.poses[i].pitch = 0
        continue
      }
      const front = this.poses[Math.max(0, i - 1)]
      const back = this.poses[i + 1]
      const rise = heights[Math.max(0, i - 1)] - heights[i + 1]
      const pitch = Math.max(-.85, Math.min(.85, Math.atan2(rise, Math.hypot(front.x - back.x, front.y - back.y))))
      this.poses[i].pitch = pitch
      // A tilted rigid segment must not sink its rear/front edge into the surface.
      this.poses[i].z = Math.max(this.poses[i].z, .65 * Math.abs(Math.sin(pitch)))
    }
    // Tail stays flat on the field, even for the very first apple.
    this.poses[this.poses.length - 1].z = 0
    this.poses[this.poses.length - 1].pitch = 0
    this.poses = applyBodyWave(this.poses, this.waveDistance)
    return this.poses
  }
}
