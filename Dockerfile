# =========================================================================
# SupplyChainIQ - Production Full-Stack Container
# Bundles React Client (Vite), Node.js Express Server, and Python FastAPI ML
# =========================================================================
FROM python:3.12-slim-bookworm

WORKDIR /app

# 1. Install Node.js 20 & build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Install Python dependencies
COPY python_service/requirements.txt python_service/
RUN pip install --no-cache-dir -r python_service/requirements.txt

# 3. Copy package definitions and install Node dependencies
COPY package.json ./
COPY server/package*.json server/
COPY client/package*.json client/

RUN cd server && npm install --omit=dev
RUN cd client && npm install

# 4. Copy source code
COPY . .

# 5. Build React production bundle
RUN cd client && npm run build

# 6. Ensure startup script is executable
RUN chmod +x start.sh

# 7. Environment & Port configuration
ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000 8000

CMD ["./start.sh"]
