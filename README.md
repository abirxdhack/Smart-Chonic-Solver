# Smart-Chonic-Solver

<p align="center">
  <img src="https://img.shields.io/badge/Live-Demo-22c55e?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  <img src="https://img.shields.io/badge/Repo-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repo" />
  <img src="https://img.shields.io/badge/Age-17%20Years-0e75b6?style=for-the-badge" alt="Age" />
</p>

<p align="center">
  <a href="https://Smart-Chonic-Solver.abirxdhack.github.io" target="_blank">Live Demo</a> •
  <a href="https://github.com/abirxdhack/Smart-Chonic-Solver" target="_blank">GitHub Repo</a>
</p>

---

## Overview

**Smart-Chonic-Solver** is a powerful, interactive graph visualizer and math solver built specifically for **HSC students** in Bangladesh. It helps students understand, visualize, and solve problems related to conic sections — including **Parabola**, **Ellipse**, and **Hyperbola** — through clean, step-by-step solutions and beautiful graph rendering.

Whether you are preparing for your HSC exam or just want to master conic section geometry visually, this tool gives you instant graphs, formulas, and detailed explanations in a student-friendly interface.

---

## Features

- **Advanced Conic Section Solver** — Solve Parabola, Ellipse, and Hyperbola problems with full steps.
- **Clean Graph Visualizer** — High-quality white graph-paper style rendering with distinct colors for every element.
- **Step-by-Step Explanations** — Easy-to-understand rules and explanations in Bangla.
- **Formula Charts** — Quick access to all important formulas for each conic type.
- **Shareable Graphs** — Generate unique share links for every solved graph.
- **Light / Dark / System Theme** — Switch between themes instantly with a beautiful toggle.
- **Download Graphs** — Export generated graphs as PNG images instantly.
- **Fully Responsive** — Works perfectly on mobile, tablet, and desktop.

---

## Tech Stack

- **TanStack Start** — Full-stack React framework
- **React 19** — Modern UI library
- **TypeScript** — Type-safe development
- **Tailwind CSS v4** — Utility-first styling
- **Supabase** — Backend and data storage
- **Vite** — Fast build tool

---

## Quick Start

### Run Locally

```bash
# Clone the repository
git clone https://github.com/abirxdhack/Smart-Chonic-Solver.git

# Enter the project folder
cd Smart-Chonic-Solver

# Install dependencies
bun install

# Start the development server
bun run dev
```

Open your browser and visit `http://localhost:8080`.

---

## Deployment

### Deploy on GitHub Pages

1. Push your code to the `main` branch of `github.com/abirxdhack/Smart-Chonic-Solver`.
2. Go to **Settings → Pages** in your GitHub repository.
3. Select **GitHub Actions** as the source.
4. Use the `.github/workflows/deploy.yml` workflow included in this repo.
5. Your site will be live at `https://Smart-Chonic-Solver.abirxdhack.github.io`.

### Deploy on a VPS

```bash
# On your VPS
git clone https://github.com/abirxdhack/Smart-Chonic-Solver.git
cd Smart-Chonic-Solver
bun install
bun run build

# Serve the dist folder
bunx serve dist -l 8080
```

### Run 24/7 on a VPS

Use **PM2** to keep the app running forever:

```bash
# Install PM2 globally
npm install -g pm2

# Start the app with PM2
pm2 start --name smart-chonic "bunx serve dist -l 8080"

# Save PM2 config so it restarts after reboot
pm2 save
pm2 startup
```

Alternatively, use **systemd**:

```bash
sudo nano /etc/systemd/system/smart-chonic.service
```

Add the following content:

```ini
[Unit]
Description=Smart-Chonic-Solver
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/Smart-Chonic-Solver
ExecStart=/usr/local/bin/bunx serve dist -l 8080
Restart=always

[Install]
WantedBy=multi-user.target
```

Then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable smart-chonic
sudo systemctl start smart-chonic
```

---

## Developer

<p align="center">
  <strong>Abir Arafat Chawdhury</strong>
</p>

<p align="center">
  <a href="https://github.com/abirxdhack" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-abirxdhack-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
</p>

- **Student:** HSC 2027 Examinee
- **Institution:** Govt. Yeasin College, Faridpur Sadar, Faridpur
- **Birthdate:** 17 April 2009 (Friday)
- **Current Age:** 17 Years

---

## Live / Demo

Visit the live application here:

[**Smart-Chonic-Solver.abirxdhack.github.io**](https://Smart-Chonic-Solver.abirxdhack.github.io)

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with dedication for every HSC student who dreams to master math.
</p>
