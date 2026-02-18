# Comet Search

A Perplexity-style AI search interface built with React, TypeScript, and Tailwind CSS.

![Comet Search Screenshot](./screenshot.png)

## Features

- 🔍 **AI-Powered Search** - Natural language queries with intelligent responses
- 📚 **Cited Sources** - Every answer includes verifiable sources
- 💫 **Streaming Text** - Real-time response generation effect
- 🌓 **Dark/Light Mode** - Automatic theme switching with persistence
- 📜 **Search History** - Local storage of recent searches
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Fast & Lightweight** - Built with Vite for optimal performance

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/comet-search.git
cd comet-search

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### Build for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## Project Structure

```
comet-search/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles + Tailwind
├── index.html           # HTML template
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Customization

### Adding Real AI Integration

The current implementation uses mock responses. To integrate with a real AI API:

1. Create a `.env` file:
```env
VITE_API_KEY=your_api_key_here
VITE_API_URL=https://api.example.com/v1/chat
```

2. Update the `handleSearch` function in `App.tsx` to call your API

3. Implement proper error handling and loading states

### Theming

Colors are defined in `src/index.css` using CSS variables. Modify the `:root` and `.dark` selectors to customize the theme.

## License

MIT License - feel free to use this for personal or commercial projects.

## Acknowledgments

- Design inspired by [Perplexity AI](https://perplexity.ai)
- Icons by [Lucide](https://lucide.dev)