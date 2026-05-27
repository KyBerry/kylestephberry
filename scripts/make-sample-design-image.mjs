// One-shot helper to generate the placeholder design image used by Plan 2.
// Run manually: node scripts/make-sample-design-image.mjs
import sharp from 'sharp'

const outputPath = 'public/designs/sample.png'

await sharp({
  create: {
    width: 1280,
    height: 800,
    channels: 3,
    // sage-tinted muted background, matches the site accent
    background: { r: 70, g: 95, b: 76 },
  },
})
  .png({ compressionLevel: 9 })
  .toFile(outputPath)

console.log(`wrote ${outputPath}`)
