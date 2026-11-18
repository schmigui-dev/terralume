// Downloads Earth textures into public/textures.
// Source: three.js examples (r170), originally Solar System Scope (CC BY 4.0), based on NASA imagery.
import { access, mkdir, writeFile } from 'node:fs/promises'

const BASE = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/textures/planets'
const FILES = ['earth_day_4096.jpg', 'earth_night_4096.jpg', 'earth_bump_roughness_clouds_4096.jpg']
const OUT = new URL('../public/textures/', import.meta.url)

await mkdir(OUT, { recursive: true })
for (const file of FILES) {
  const target = new URL(file, OUT)
  try {
    await access(target)
    console.log(`skip ${file}`)
    continue
  } catch {}
  const res = await fetch(`${BASE}/${file}`)
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`)
  await writeFile(target, Buffer.from(await res.arrayBuffer()))
  console.log(`saved ${file}`)
}
