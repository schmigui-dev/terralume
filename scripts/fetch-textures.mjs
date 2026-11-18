// Downloads the 4K Earth textures into public/textures and derives the 2K set (used in low quality).
// Source: three.js examples (r170), originally Solar System Scope (CC BY 4.0), based on NASA imagery.
// The 2K set is committed; regenerating it needs macOS `sips`.
import { execFileSync } from 'node:child_process'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const BASE = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/textures/planets'
const NAMES = ['earth_day', 'earth_night', 'earth_bump_roughness_clouds']
const OUT = new URL('../public/textures/', import.meta.url)

const exists = (u) =>
  access(u).then(
    () => true,
    () => false,
  )

await mkdir(OUT, { recursive: true })
for (const name of NAMES) {
  const big = new URL(`${name}_4096.jpg`, OUT)
  if (await exists(big)) console.log(`skip ${name}_4096.jpg`)
  else {
    const res = await fetch(`${BASE}/${name}_4096.jpg`)
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`)
    await writeFile(big, Buffer.from(await res.arrayBuffer()))
    console.log(`saved ${name}_4096.jpg`)
  }

  const small = new URL(`${name}_2048.jpg`, OUT)
  if (await exists(small)) {
    console.log(`skip ${name}_2048.jpg`)
    continue
  }
  try {
    execFileSync(
      'sips',
      ['-s', 'format', 'jpeg', '-s', 'formatOptions', '70', '-Z', '2048', fileURLToPath(big), '--out', fileURLToPath(small)],
      {
        stdio: 'ignore',
      },
    )
    console.log(`derived ${name}_2048.jpg`)
  } catch {
    console.warn(`could not derive ${name}_2048.jpg (needs macOS sips); resize ${name}_4096.jpg to 2048x1024 manually`)
  }
}
