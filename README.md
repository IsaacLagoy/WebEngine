## Features

### 3D Rendering
- **WebGL 2.0** rendering engine with custom shaders
- **PBR (Physically Based Rendering)** materials with Cook-Torrance BRDF
- **Procedural terrain generation** using fractal noise
- **Dynamic lighting** with point lights and directional moonlight
- **Atmospheric skybox** with Preetham atmospheric scattering
- **Real-time fire animation** with flickering light

### Scene Elements
- **Procedurally generated terrain** with distance-based height variation
- **Campfire scene** with:
  - Tripod log formation
  - Rocks arranged around the fire
  - Animated fire light with color and intensity variation
- **Skybox** featuring:
  - Day/night cycle with smooth transitions
  - Atmospheric scattering for realistic sky colors
  - Moon rendering with soft edges
  - Star field generation

### Technical Highlights
- **Texture tiling** support for detailed terrain textures
- **Normal mapping** for surface detail
- **Fog rendering** for atmospheric depth
- **Post-processing** effects (quantization, vignette)
- **Instanced rendering** for efficient object rendering

## Tech Stack

- **Next.js 16** - React framework
- **WebGL 2.0** - 3D graphics rendering
- **TypeScript** - Type-safe development
- **gl-matrix** - Matrix and vector math
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd isaac-website
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
isaac-website/
├── app/
│   ├── components/
│   │   └── webGL/
│   │       ├── engine/          # WebGL engine core
│   │       │   ├── core/        # Core systems (shader, framebuffer, etc.)
│   │       │   ├── objects/     # 3D objects (mesh, material, scene, etc.)
│   │       │   └── math/        # Math utilities
│   │       └── WebGLCanvas.tsx  # Main WebGL component
│   └── page.tsx                 # Main page
├── public/
│   ├── shaders/                 # GLSL shader files
│   ├── models/                  # 3D model files (.obj)
│   ├── materials/               # Texture maps
│   └── scene/                   # Skybox textures
└── README.md
```

## Key Components

### WebGL Engine
- **Engine** - Main WebGL context and rendering loop
- **Scene** - Scene graph and rendering management
- **Mesh** - 3D geometry loading and rendering
- **Material** - PBR material system with texture support
- **Terrain** - Procedural terrain generation with noise
- **Skybox** - Atmospheric sky rendering
- **Camera** - First-person camera controls

### Shaders
- **default.vert/frag** - Main PBR shader with lighting
- **skybox.vert/frag** - Atmospheric scattering skybox
- **billboard.vert/frag** - Billboard rendering
- **quad.vert/frag** - Fullscreen quad for post-processing

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Customization

### Terrain Parameters
The terrain can be customized via the `TerrainParams` interface:
- `width`, `height` - Terrain dimensions
- `segmentsX`, `segmentsZ` - Mesh resolution
- `noiseScale` - Feature size
- `noiseAmplitude` - Height variation
- `noiseOctaves` - Detail level
- `originX`, `originZ` - Flat area center
- `flatRadius` - Flat area radius

### Lighting
- Fire light intensity and color can be adjusted in `WebGLCanvas.tsx`
- Moonlight color and direction are controlled by the skybox

### Materials
Materials support:
- Diffuse/albedo textures
- Normal maps
- Roughness maps
- Texture tiling
- PBR properties (roughness, metallic, emission)
