# Ollama Local Model Manager Dashboard

A production-ready Next.js dashboard for managing local Ollama models. View installed and running models, monitor resource usage (disk, VRAM, RAM), pull new models, create custom models from Modelfiles, and delete models.

## Features

- 📊 **Model Overview**: View all installed models with disk usage
- 🚀 **Running Models**: Monitor loaded models with VRAM/RAM usage and expiration times
- 📥 **Pull Models**: Download models from Ollama registry
- 🛠️ **Create Models**: Create custom models from base models or Modelfiles
- 🗑️ **Delete Models**: Remove models with confirmation and disk space preview
- 🔍 **Model Details**: Inspect model parameters, system prompts, templates, and Modelfiles
- 🌍 **i18n Support**: Full English and Arabic (RTL) localization
- 📱 **Mobile-First**: Responsive design for all devices
- ⚡ **Real-time Updates**: Auto-refresh using SWR

## Prerequisites

- Node.js 18+ and npm/yarn
- Ollama running locally at `http://localhost:11434`
- Ollama API accessible at `http://localhost:11434/api`

## Installation

1. **Clone or navigate to the project directory:**

```bash
cd ollama-dashboard
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

Create `.env.local` (already included with defaults):

```env
NEXT_PUBLIC_OLLAMA_API_URL=http://localhost:11434/api
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

4. **Run the development server:**

```bash
npm run dev
```

5. **Open your browser:**

Navigate to `http://localhost:3000/en` (English) or `http://localhost:3000/ar` (Arabic)

## Project Structure

```
ollama-dashboard/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Localized routes
│   │   ├── page.tsx       # Home/dashboard page
│   │   ├── pull/          # Pull model page
│   │   └── create/        # Create model page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── ModelsTable.tsx   # Installed models table
│   ├── RunningModelsTable.tsx
│   ├── ModelDetailsDialog.tsx
│   ├── DeleteModelDialog.tsx
│   ├── Navigation.tsx
│   └── I18nProvider.tsx
├── pages/api/            # API routes (Next.js Pages Router)
│   ├── models.ts         # GET /api/models
│   ├── running.ts       # GET /api/running
│   ├── show.ts           # POST /api/show
│   ├── pull.ts           # POST /api/pull
│   ├── create.ts         # POST /api/create
│   ├── delete.ts         # DELETE /api/delete
│   └── create-from-modelfile.ts
├── hooks/                # Custom React hooks
│   └── useModels.ts      # SWR hooks for model data
├── lib/                  # Utilities
│   ├── utils.ts          # Helper functions
│   └── modelfile-parser.ts # Modelfile parser
├── network/              # API client
│   └── axios.ts          # Axios instance
├── types/                # TypeScript types
│   └── ollama.ts         # Ollama API types
└── public/locales/       # i18n translations
    ├── en/common.json
    └── ar/common.json
```

## API Endpoints

The dashboard uses Next.js API routes that proxy requests to Ollama:

- `GET /api/models` - List installed models
- `GET /api/running` - List running/loaded models
- `POST /api/show` - Get model details
- `POST /api/pull` - Pull/download a model
- `POST /api/create` - Create a model from fields
- `POST /api/create-from-modelfile` - Create a model from Modelfile
- `DELETE /api/delete` - Delete a model

## Usage

### Viewing Models

The home page shows:
- **Installed Models**: All models on disk with size and status
- **Running Models**: Currently loaded models with VRAM/RAM usage and expiration

### Pulling a Model

1. Navigate to "Pull Model" in the navigation
2. Enter the model name (e.g., `deepseek-r1:8b`)
3. Click "Pull Model"
4. Wait for the download to complete

### Creating a Model

#### From Fields

1. Navigate to "Create Model"
2. Select "From Fields" tab
3. Fill in:
   - Base Model (optional, e.g., `deepseek-r1:8b`)
   - Model Name (required)
   - System Prompt (optional)
   - Template (optional)
   - Parameters (optional, format: `key: value`)
4. Click "Create Model"

#### From Modelfile

1. Navigate to "Create Model"
2. Select "From Modelfile" tab
3. Enter Model Name (required if not in Modelfile)
4. Paste your Modelfile content:

```
FROM deepseek-r1:8b
SYSTEM You are a helpful assistant.
PARAMETER temperature 0.7
PARAMETER num_ctx 8192
```

5. Click "Create Model"

### Viewing Model Details

Click the eye icon (👁️) next to any model to view:
- Parameters
- System prompt
- Template
- Modelfile
- License (if available)

### Deleting a Model

1. Click the trash icon (🗑️) next to a model
2. Confirm the deletion
3. The model and its disk space will be freed

## Modelfile Support

The dashboard supports parsing Modelfiles with these directives:

- `FROM <base>` - Base model
- `MODEL <name>` - Model name
- `SYSTEM <prompt>` - System prompt (supports multi-line with `"""`)
- `TEMPLATE <template>` - Template (supports multi-line with `"""`)
- `PARAMETER <key> <value>` - Parameters
- `MESSAGE <role> "<content>"` - Messages
- `LICENSE <license>` - License

## Deployment

### Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_OLLAMA_API_URL` (your Ollama API URL)
4. Deploy

**Note**: For local Ollama instances, you'll need to expose the API or use a tunnel service.

### Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_OLLAMA_API_URL` | Ollama API base URL | `http://localhost:11434/api` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Default locale | `en` |

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling with RTL support
- **shadcn/ui** - UI components
- **SWR** - Data fetching and caching
- **Axios** - HTTP client
- **Zod** - Schema validation
- **Framer Motion** - Animations
- **Lucide React** - Icons

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Troubleshooting

### Ollama API not accessible

- Ensure Ollama is running: `ollama serve`
- Check the API URL in `.env.local`
- Verify firewall settings

### Models not showing

- Check browser console for errors
- Verify Ollama API is responding: `curl http://localhost:11434/api/tags`
- Check network tab for failed requests

### RTL layout issues

- Ensure locale is set to `ar` in the URL
- Check that `tailwindcss-rtl` is installed
- Verify HTML `dir` attribute is set correctly

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
