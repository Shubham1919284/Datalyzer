<div align="center">
  <br />
  <!-- <img src="public/logo.png" alt="Datalyzer Logo" width="100" /> -->
  <h1>Datalyzer</h1>
  <h3>Instant Data Insights. Zero Config Required.</h3>
  <p>
    Turn raw CSV, Excel, and JSON files into stunning, interactive dashboards in seconds.
    <br />
    <br />
    <a href="https://shubham1919284.github.io/Datalyzer/">View Demo</a>
    ·
    <a href="https://github.com/Shubham1919284/Datalyzer/issues">Report Bug</a>
    ·
    <a href="https://github.com/Shubham1919284/Datalyzer/pulls">Request Feature</a>
  </p>
</div>

--- 

<div align="center">

![Landing Page](docs/landing-page.png)
_Upload any dataset and get instant insights - no login required._

</div>

## 🚀 Overview

**Datalyzer** is a powerful client-side data analysis engine built with Next.js 15. It eliminates the friction of traditional BI tools by processing data locally in your browser. Whether you have messy CSVs or complex JSON exports, Datalyzer automatically detects patterns, generates KPIs, and builds a comprehensive dashboard tailored to your data.

### Why Datalyzer?
- **🔒 Privacy First**: Your data never leaves your device. All processing happens client-side.
- **⚡ Instant**: No sign-ups, no database connections. Just drag and drop.
- **🎨 Beautiful**: Professional-grade visualizations animations and a responsive design.

## ✨ Key Features

### 📊 Smart Dashboard Generation
- **Auto-KPIs**: Automatically identifies key metrics (Sum, Average, Count) based on column data types.
- **Interactive Charts**:
  - Time Series (Area & Line) for temporal data.
  - Categorical Analysis (Bar & Column charts).
  - Distribution insights (Pie & Donut charts).
  - Correlation Heatmaps to find relationships.
- **Drill Down**: Click any chart segment to filter the entire dashboard instantly.

### 🛠️ Advanced Tools
- **Data Cleaner**: Handles missing values, date parsing, and type inference automatically.
- **Format Support**: Seamlessly parses `.csv`, `.xlsx`, and `.json`.
- **Export**: Download your cleaned data or save charts as images.

### 🤖 AI Analysis (Coming Soon)
- Leveraging LLMs to provide semantic understanding of your data (e.g., "Show me sales trends for Q3").

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Directory)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: React Context + Hooks
- **Data Processing**: PapaParse, XLSX, Lodash

## 📸 Screenshots

| Dashboard View | Interactive Filtering |
|:---:|:---:|
| ![Dashboard](docs/dashboard.png) | ![Filtering](docs/filtering.png) |
| _Auto-generated charts based on your data_ | _Click-to-filter capabilities_ |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repo**
   ```sh
   git clone https://github.com/Shubham1919284/Datalyzer.git
   ```
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Run the development server**
   ```sh
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```
datalyzer/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── charts/       # Recharts wrappers
│   │   └── ui/           # Shared UI elements
│   ├── lib/              # Utilities & classifiers
│   │   ├── classifier.ts # Heuristic engine
│   │   └── parser.ts     # File parsing logic
│   └── styles/           # Global styles
├── public/               # Static assets
└── [Configuration Files]
```

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  Made with ❤️ by Shubham
</div>
