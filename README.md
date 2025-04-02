# Health-Tracker-App

## Setting Up Frontend

```bash
npx create-react-app Health-Tracker-App
cd Health-Tracker-App

mkdir client
cd client

npm install react-router-dom axios chart.js react-chartjs-2 tailwindcss firebase

```

## Setting Up Backend

```bash
mkdir server
cd server

npm init -y
npm install express cors helmet morgan dotenv mongoose jsonwebtoken bcryptjs firebase-admin
```

## Running the Project

```md
- Client: npm start
- Tailwind: npx @tailwindcss/cli -i ./public/assets/css/index.css -o ./public/assets/css/output.css --watch
- Server: node server
- Killing the Processes: taskkill -F -IM node.exe (unsure on whether it's safe or not)
```
