# Troubleshooting Socket.IO Connection Issues in Health-Tracker-App

This guide provides steps to resolve the `xhr poll error` with `net::ERR_CERT_COMMON_NAME_INVALID` in the Health-Tracker-App project. The issue occurs because the self-signed SSL certificate used by the server (`https://127.0.0.1:5000`) does not match the hostname `127.0.0.1`, causing the browser to reject the connection. Follow these steps to generate a new SSL certificate, ensure the server uses HTTPS, and verify the connection between the client and server.

## Prerequisites

- Ensure you have OpenSSL installed on your system to generate SSL certificates.
  - On Windows, download OpenSSL from [Win64 OpenSSL](https://slproweb.com/products/Win32OpenSSL.html) or use Git Bash, which includes OpenSSL.
- The project structure should include:
  - `Health-Tracker-App/server/`: Node.js server (`server.js`).
  - `Health-Tracker-App/client/`: React client app (`SocketContext.js`).
  - `Health-Tracker-App/certs/`: Directory for SSL certificates.

## Step 1: Generate a New Self-Signed SSL Certificate

The current certificate (`selfsigned.crt` and `selfsigned.key`) does not include `127.0.0.1` in the Common Name (CN) or Subject Alternative Name (SAN), causing the `ERR_CERT_COMMON_NAME_INVALID` error. Generate a new certificate that matches the hostname `127.0.0.1`.

1. **Navigate to the `certs` Directory**:
   Open a terminal and run:

   ```text
   cd C:\Users\USER\Desktop\SE\HealthTrack\Health-Tracker-App\certs
   ```

   If the `certs` directory doesn’t exist, create it:

   ```text
   mkdir certs
   cd certs
   ```

2. **Generate the New Certificate**:
   Use OpenSSL to create a new self-signed certificate and key:

   ```text
   openssl req -x509 -newkey rsa:4096 -keyout selfsigned.key -out selfsigned.crt -days 365 -nodes -subj "/CN=127.0.0.1" -addext "subjectAltName=IP:127.0.0.1"
   ```

   - **Explanation**:
     - `-x509`: Generates a self-signed certificate.
     - `-newkey rsa:4096`: Creates a 4096-bit RSA key.
     - `-keyout selfsigned.key`: Outputs the private key.
     - `-out selfsigned.crt`: Outputs the certificate.
     - `-days 365`: Sets validity to 365 days.
     - `-nodes`: Skips passphrase for the key.
     - `-subj "/CN=127.0.0.1"`: Sets the Common Name to `127.0.0.1`.
     - `-addext "subjectAltName=IP:127.0.0.1"`: Adds `127.0.0.1` as a Subject Alternative Name (SAN), required by modern browsers.

   This will create (or overwrite) `selfsigned.key` and `selfsigned.crt` in the `certs` directory. If you want to keep the old certificates, rename them first (e.g., `selfsigned_old.key` and `selfsigned_old.crt`).

3. **Verify the Certificate**:
   Confirm that the certificate includes `127.0.0.1` in the SAN field:

   ```text
   openssl x509 -in selfsigned.crt -text -noout
   ```

   Look for the following in the output:

   ```text
   Subject: CN = 127.0.0.1
   ...
   X509v3 Subject Alternative Name:
       IP Address:127.0.0.1
   ```

## Step 2: Ensure the Server Uses HTTPS

The server (`server.js`) is already configured to use HTTPS with the certificates in the `certs` directory. Restart the server to load the new certificates.

1. **Navigate to the `server` Directory**:

   ```text
   cd C:\Users\USER\Desktop\SE\HealthTrack\Health-Tracker-App\server
   ```

2. **Restart the Server**:
   Start the server to use the new certificates:

   ```text
   npm start
   ```

   Or, if using `nodemon`:

   ```text
   nodemon server.js
   ```

3. **Verify Server Logs**:
   Confirm the server starts successfully and logs:

   ```text
   Server running on port 5000
   Socket.IO server available at https://127.0.0.1:5000
   ```

   If the server fails to start (e.g., due to missing certificates), ensure `selfsigned.key` and `selfsigned.crt` exist in the `certs` directory.

## Step 3: Trust the New SSL Certificate

Since the certificate is self-signed, the browser won’t trust it by default. You need to manually trust it or add it to your system’s trusted store.

1. **Manually Trust in Browser**:

   - Open your browser (e.g., Chrome, Firefox) and visit `https://127.0.0.1:5000`.
   - You’ll see a warning: “Your connection is not private” (NET::ERR_CERT_AUTHORITY_INVALID).
   - Click “Advanced” and then “Proceed to 127.0.0.1 (unsafe)” to trust the certificate.
   - This allows the browser to make HTTPS requests to the server, including Socket.IO polling requests.

2. **Add to Trusted Store (Recommended for Development)**:
   - On Windows:
     1. Double-click `C:\Users\USER\Desktop\SE\HealthTrack\Health-Tracker-App\certs\selfsigned.crt`.
     2. Click “Install Certificate.”
     3. Select “Local Machine,” then “Trusted Root Certification Authorities,” and complete the import.
     4. Restart your browser.
   - This ensures the certificate is trusted for all requests, and you won’t see warnings when accessing `https://127.0.0.1:5000`.

## Step 4: Restart the Client

The client is running at `http://127.0.0.1:3000` (React dev server). Restart it to ensure it attempts a fresh connection to the server.

1. **Navigate to the `client` Directory**:

   ```text
   cd C:\Users\USER\Desktop\SE\HealthTrack\Health-Tracker-App\client
   ```

2. **Restart the Client**:

   ```text
   npm start
   ```

3. **Access the Client**:
   Open your browser and visit `http://127.0.0.1:3000`. Open the Developer Tools (F12) and check the Console for Socket.IO logs.

## Step 5: Check for Errors and Verify the Connection

Verify that the Socket.IO client can connect to the server without certificate errors.

1. **Check Client Logs**:

   - In the browser console (`http://127.0.0.1:3000`):
     - **Success**:

       ```text
       Connecting to server at: https://127.0.0.1:5000
       Connecting with token
       Socket.IO connected
       ```

     - **Failure**:

       ```text
       Connection error: xhr poll error
       Failed to connect to server: Certificate error or server unreachable...
       ```

2. **Check Server Logs**:

   - In the server terminal:
     - **Success**:

       ```text
       A user connected: <socket-id>
       User <user-id> joined room
       ```

     - **Failure**:
       No connection logs, indicating the client couldn’t connect.

3. **Debugging Errors**:
   - If the connection fails, check the browser’s Network tab (F12 > Network) for failed requests to `https://127.0.0.1:5000/socket.io/`.
     - Look for errors like `ERR_CERT_COMMON_NAME_INVALID` or CORS issues.
   - Double-check that the certificate includes `127.0.0.1` in the SAN field (Step 1).
   - Ensure the certificate is trusted (Step 3).
   - Test by visiting `https://127.0.0.1:5000`. You should see “Now using https..” without a certificate warning.

## Step 6: Alternative Setup (Serve Client from Server)

To avoid CORS issues, you can serve the client build directly from the server, so both client and server share the same origin (`https://127.0.0.1:5000`).

1. **Build the Client**:

   ```text
   cd C:\Users\USER\Desktop\SE\HealthTrack\Health-Tracker-App\client
   npm run build
   ```

   This creates a `build` folder in `client/build/`.

2. **Access the Client via the Server**:
   - Ensure the server is running (Step 2).
   - Open your browser and visit `https://127.0.0.1:5000`.
   - The server will serve the client build, and the client will connect to the server at the same origin, avoiding CORS issues.
   - Ensure the certificate is trusted (Step 3) to avoid warnings.

## Step 7: Recommendations for Production

- **Use a Trusted Certificate**:

  - Obtain a certificate from a Certificate Authority (e.g., Let’s Encrypt) to avoid certificate errors in production.
  - Use a proper domain (e.g., `yourdomain.com`) instead of `127.0.0.1` or `localhost`.

- **Set Up a Reverse Proxy**:

  - Use Nginx or another reverse proxy to handle HTTPS with a trusted certificate.
  - Example Nginx configuration:

    ```text
    server {
        listen 443 ssl;
        server_name yourdomain.com;
        ssl_certificate /path/to/cert.pem;
        ssl_certificate_key /path/to/key.pem;
        location / {
            proxy_pass http://127.0.0.1:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```

- **Update Environment Variables**:
  - In `client/.env`, set the production server URL:

    ```text
    REACT_APP_API_URL=https://yourdomain.com
    ```

  - In `server.js`, update CORS for production:

    ```javascript
    app.use(cors({ origin: ["https://yourdomain.com"] }));
    ```

## Additional Debugging Tips

- **Use `localhost` Instead of `127.0.0.1`**:
  If you prefer using `localhost`, regenerate the certificate with `localhost` as the CN and SAN:

  ```cmd
  openssl req -x509 -newkey rsa:4096 -keyout selfsigned.key -out selfsigned.crt -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost"
  ```

  Update `server.js` and `client/.env` to use `https://localhost:5000`, then restart both server and client.

- **Force WebSocket Transport**:
  If polling issues persist, force Socket.IO to use WebSocket only by updating `SocketContext.js`:

  ```javascript
  const newSocket = io(serverUrl, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket"], // Skip polling
  });
  ```

  Restart the client after making this change.

- **Check Network Tab**:
  Use the browser’s Network tab to inspect failed `/socket.io/` requests for detailed errors (e.g., certificate issues, CORS, server not running).

By following these steps, you should resolve the `xhr poll error` and establish a successful Socket.IO connection between the client and server.
