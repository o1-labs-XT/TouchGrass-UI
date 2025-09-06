# TouchGrass UI

Social photo challenge game on the Mina blockchain where users submit outdoor photos with zero-knowledge proofs for authenticity.

## Features

- Progressive Web App (PWA) - installable on mobile devices
- Native camera capture interface optimized for mobile
- Real-time photo preview and submission
- Zero-knowledge proof generation for photo authenticity
- Signature-based verification using Mina keypairs
- Non-blocking operations using Web Workers
- Real-time proof generation status

## Prerequisites

- Node.js 18.14.0+
- npm or yarn
- Modern browser with Web Worker support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/o1-labs-XT/TouchGrass-UI.git
cd touchgrass/ui
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

Environment variables:
```env
NEXT_PUBLIC_BACKEND_URL=https://api.your-backend.com
NEXT_PUBLIC_MINA_NETWORK=devnet
```

## Development

Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build

Build for production:
```bash
npm run build
```

## Production

Start production server:
```bash
npm start
```

## Deployment

### Deploy to Vercel

```bash
vercel --prod
```

Or connect GitHub repository for automatic deployments.

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

[Apache-2.0](LICENSE)