# BigQuery Release Hub 🚀

A modern, high-performance, and visually stunning developer dashboard that aggregates, parses, and filters real-time BigQuery release notes from the official Google Cloud feeds. 

Built using **Python Flask** on the backend and **vanilla HTML5, CSS3, and JavaScript** on the frontend, featuring glassmorphism design layouts, real-time search, category filters, and a dark/light theme toggle.

---

## 🎨 Preview & Aesthetics

The interface is styled with a premium glassmorphic theme designed to look and feel state-of-the-art:
- **Responsive Layout**: Adapts gracefully across Mobile, Tablet, and Desktop resolutions.
- **Micro-animations**: Dynamic counter animations on metrics, loading skeleton shimmer states, and smooth rotation animations for refresh cycles.
- **Theme Support**: Seamless transition between dark and light themes (saved to `localStorage`).

---

## 🏗️ Technical Architecture

```
                      [ Google Cloud Atom Feed XML ]
                                    │
                                    ▼ (1. Fetch & Parse)
                             [ Flask app.py ]
                                    │
                                    ▼ (2. 5-min Memory Cache)
                           [ API: /api/releases ]
                                    │
                                    ▼ (3. JSON Fetch)
                           [ Frontend app.js ]
                                    │
                                    ▼ (4. Client-side XML DOMParser)
                      [ Group & categorize updates ]
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
  [ Metrics Cards ]          [ Search Engine ]          [ Filter Chips ]
```

### Key Technical Features

1. **Intelligent RSS Content Parser**: Individual feed entries are processed with a client-side `DOMParser` to group HTML content blocks under their corresponding headings (such as *Feature*, *Announcement*, *Issue*, *Deprecation*, or *Change*).
2. **Interactive Search & Multi-Filters**:
   - **Search Bar**: Real-time keyword filter across update titles, categories, and content descriptions.
   - **Category Chips**: Instant category filter. Selecting a category (e.g. *Features*) displays only matching cards and hides non-matching updates within active cards.
3. **Server-Side Cache**: Feed data is cached in Flask memory for **5 minutes** to prevent network limits. Click the **Refresh** button to force bypass the cache and fetch fresh data.
4. **Copy-to-Clipboard**: Copy shareable deep links to specific GCP release notes directly from each card.

---

## 📂 Project Structure

```
agy-cli-projects/
├── app.py                  # Flask Web Server & Feed fetcher
├── requirements.txt        # Python backend dependencies
├── .gitignore              # Ignored files (venv, OS, caches)
├── README.md               # Project documentation
├── templates/
│   └── index.html          # Web dashboard layout template
└── static/
    ├── css/
    │   └── style.css       # Core layout styling & visual tokens
    └── js/
        └── app.js          # Controller handling fetching, parsing, & search
```

---

## ⚡ Getting Started

### Prerequisites
- Python 3.8 or higher installed.

### Installation & Run

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/cvtreharne-cvt/cvtreharne-cvt-event-talks-app.git
   cd cvtreharne-cvt-event-talks-app
   ```

2. **Set up a Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Server**:
   ```bash
   python app.py
   ```

5. **Access the Hub**:
   Open your browser to **[http://127.0.0.1:5001](http://127.0.0.1:5001)**.

---

## 📄 License
This repository is open source and available under the [MIT License](LICENSE).

*Disclaimer: This project is an independent tool and is not officially affiliated with Google LLC or Google Cloud Platform.*
