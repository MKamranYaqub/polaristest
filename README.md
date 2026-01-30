# Project Polaris - Specialist Mortgage Calculator Platform

A full-stack specialist mortgage calculation platform for UK Buy-to-Let (BTL) and Bridging loans, built with React + Vite frontend, Express backend, and Supabase database.

## 🌐 Live Deployment

| Environment | URL |
|-------------|-----|
| **Frontend** | https://polaristest-theta.vercel.app |
| **Backend API** | https://polaristest.onrender.com |
| **Database** | Supabase PostgreSQL |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- Supabase account ([create one here](https://supabase.com))

### Installation

1. **Clone and install dependencies:**
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

2. **Configure environment variables:**
   
   **Frontend** (`frontend/.env`):
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=http://localhost:3001
   ```
   
   **Backend** (`backend/.env`):
   ```env
   PORT=3001
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-jwt-secret-min-32-chars
   FRONTEND_URL=http://localhost:3000
   
   # Email (for password reset & support)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   ```

3. **Start development servers:**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

---

## 📁 Project Structure

```
polaristest/
├── frontend/                    # React 18.2 + Vite 5.0
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/           # Admin management components
│   │   │   ├── calculators/     # BTL & Bridging calculators
│   │   │   ├── dashboard/       # Dashboard widgets
│   │   │   ├── layout/          # AppShell, navigation
│   │   │   ├── modals/          # Modal dialogs
│   │   │   ├── pdf/             # PDF generation (Quote & DIP)
│   │   │   ├── shared/          # Reusable components
│   │   │   ├── tables/          # Data tables
│   │   │   └── ui/              # UI primitives
│   │   ├── contexts/            # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   ├── ToastContext.jsx
│   │   │   └── ...
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # Route page components
│   │   ├── utils/               # Calculation engines & utilities
│   │   │   ├── btlCalculationEngine.js
│   │   │   ├── bridgeFusionCalculationEngine.js
│   │   │   └── rateFiltering.js
│   │   └── styles/              # SCSS + CSS design tokens
│   ├── public/
│   └── vite.config.js
│
├── backend/                     # Express 4.18 + Node.js 20+
│   ├── routes/
│   │   ├── admin.js             # Admin data endpoints
│   │   ├── apiKeys.js           # API key management
│   │   ├── auth.js              # Authentication (login, register, reset)
│   │   ├── dipPdf.js            # DIP PDF generation
│   │   ├── export.js            # Word document export
│   │   ├── postcodeLookup.js    # UK postcode lookup
│   │   ├── quotePdf.js          # Quote PDF generation
│   │   ├── quotes.js            # Quote CRUD operations
│   │   ├── rates.js             # Rate table endpoints
│   │   ├── reporting.js         # Power BI / Data team API
│   │   └── support.js           # Support ticket system
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── rateLimiter.js       # Rate limiting
│   │   └── validation.js        # Input validation
│   ├── config/
│   │   ├── supabase.js          # Supabase client
│   │   └── validateEnv.js       # Environment validation
│   ├── utils/
│   │   ├── emailService.js      # Nodemailer for emails
│   │   └── logger.js            # Winston logging
│   └── server.js                # Express app entry point
│
├── database/                    # PostgreSQL via Supabase
│   ├── schema/                  # Initial table schemas
│   ├── migrations/              # 53+ sequential migrations (001-053)
│   ├── seeds/                   # CSV seed data
│   └── utilities/               # DB verification scripts
│
└── docs/                        # 📚 Documentation
    ├── architecture/            # System design
    ├── features/                # Feature docs
    ├── guides/                  # How-to guides
    ├── CSS_STYLE_GUIDE.md       # Styling guidelines
    ├── DESIGN_TOKENS.md         # Token system
    └── ...
```

---

## ✨ Features

### 🧮 Calculators
- **BTL Calculator** - Buy-to-Let mortgage calculations
  - Max Gross/Net Loan calculations
  - Interest Coverage Ratio (ICR) at 125% and 145%
  - LTV calculations with tier-based rates
  - Product range filtering (Core vs Specialist)
  - Fee calculations and APRC
  - Multi-column rate comparison (0-2%, 2-3%, 3%+)
  
- **Bridging Calculator** - Short-term bridging loans
  - First and second charge calculations
  - Rolled, deferred, and serviced interest
  - Multi-property support
  - Term-based rate calculations

- **Fusion Products** - Hybrid BTL/Bridging products

### 👥 User Management
- Role-based access control (5 levels: Super Admin, Admin, Manager, User, Underwriter)
- JWT-based authentication
- Password reset via email
- User profiles and settings

### 📄 Quote Management
- Save and retrieve quotes
- Unique quote reference numbers (MFSQa...)
- DIP (Decision in Principle) issuance
- PDF export (Client Quote & DIP documents)
- Word document export

### ⚙️ Admin Features
- Rate table management (BTL & Bridging)
- Criteria management
- Global settings configuration (App Constants)
- Broker settings management
- API key management for external integrations
- Audit logging

### 🔗 Integrations
- **Power BI** - Reporting API for data teams
- **UK Postcode Lookup** - Address validation

---

## 🎨 Design System

The platform uses a hybrid design system combining:
- **Carbon Design System** - Primary component library
- **Salesforce Lightning Design System (SLDS)** - Utility classes
- **Custom Design Tokens** - Brand colors, spacing, typography

### Key Styling Rules
```scss
// ✅ ALWAYS use design tokens
.component {
  background-color: var(--token-layer-surface);
  color: var(--token-text-primary);
  padding: var(--token-spacing-medium);
}

// ❌ NEVER hardcode values
.bad {
  background-color: #262626;  // NO
  padding: 16px;              // NO
}
```

### Dark Mode
Full dark mode support with dual selectors:
```css
:root[data-carbon-theme="g100"],
.dark-mode {
  --token-layer-background: #161616;
}
```

📚 **See:** [docs/CSS_STYLE_GUIDE.md](docs/CSS_STYLE_GUIDE.md) for complete guidelines

---

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test                    # Run tests once
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# Backend tests
cd backend
npm test
npm run test:coverage
```

📚 **See:** [docs/guides/testing-guide.md](docs/guides/testing-guide.md) for detailed instructions

---

## 🔌 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/rates` | Fetch rate tables |

### Protected Endpoints (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/quotes` | List user quotes |
| POST | `/api/quotes` | Save new quote |
| GET | `/api/admin/*` | Admin endpoints |

### Reporting API (API Key required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reporting/quotes` | Quotes data for Power BI |
| GET | `/api/reporting/rates` | Rates data for Power BI |

---

## 📚 Documentation

All project documentation is in the [`docs/`](docs/) directory:

| Document | Description |
|----------|-------------|
| [CSS_STYLE_GUIDE.md](docs/CSS_STYLE_GUIDE.md) | Styling guidelines & tokens |
| [DESIGN_TOKENS.md](docs/DESIGN_TOKENS.md) | Token system reference |
| [REPORTING_API_SUMMARY.md](docs/REPORTING_API_SUMMARY.md) | Power BI integration |
| [ADMIN_API_KEY_GUIDE.md](docs/ADMIN_API_KEY_GUIDE.md) | API key management |

**Full index:** [docs/README.md](docs/README.md)

---

## 🛠️ Development

### Available Scripts

**Frontend:**
```bash
npm run dev           # Start dev server (port 3000)
npm run build         # Production build
npm run preview       # Preview production build
npm test              # Run Vitest tests
npm run lint          # ESLint check
```

**Backend:**
```bash
npm run dev           # Start with nodemon (port 3001)
npm start             # Production start
npm run seed:rates    # Seed rates data
npm test              # Run Vitest tests
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18.2, Vite 5.0, React Router 6 |
| **UI** | Carbon Design 1.96, SLDS utilities |
| **State** | React Context API |
| **Backend** | Node.js 20+, Express 4.18 |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | JWT, bcrypt, Supabase Auth |
| **PDF** | @react-pdf/renderer 4.3 |
| **Email** | Nodemailer (Gmail SMTP) |
| **Testing** | Vitest, @testing-library/react |
| **Hosting** | Vercel (FE), Render (BE) |

---

## 🔐 Security

- Row Level Security (RLS) enabled in Supabase
- Service role key never exposed to frontend
- Rate limiting on API endpoints (see [RATE_LIMITING.md](backend/RATE_LIMITING.md))
- JWT-based authentication
- Role-based access control
- API key authentication for external integrations

⚠️ **Never commit `.env` files to git**

---

## 🚀 Deployment

### Frontend (Vercel)
- Automatic deployments from `main` branch
- Environment variables set in Vercel dashboard:
  - `VITE_API_URL`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Backend (Render)
- Automatic deployments from `main` branch
- Environment variables set in Render dashboard:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET`
  - `FRONTEND_URL`
  - `CANVAS_CONSUMER_SECRET` (for Salesforce)
  - SMTP credentials (for email)

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Follow the [CSS Style Guide](docs/CSS_STYLE_GUIDE.md)
3. Add PropTypes to all components
4. Handle loading/error states
5. Write tests for new code
6. Submit a pull request

---

## 📄 License

Proprietary - MFS UK

---

## 📞 Support

For questions or issues:
- Check the [`docs/`](docs/) directory
- Review [copilot-instructions.md](.github/copilot-instructions.md) for coding guidelines
- Contact the development team
