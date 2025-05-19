
# SIT737 10.1p - Advanced Calculator Microservice Dockerized and Deployed

A cloud-native calculator microservice built using Node.js, Express, and MongoDB, deployable to Kubernetes.

---

## 🧠 Features

- REST API for arithmetic operations: `+`, `-`, `×`, `÷`, `^`, `√`, `%`
- MongoDB integration for logging past calculations
- Containerized with Docker
- Kubernetes YAMLs for:
  - App deployment
  - MongoDB StatefulSet with PVC
  - Secret-based MongoDB authentication
- Observable via Stackdriver / Prometheus annotations

---

## 🛠 Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Containerization**: Docker
- **Orchestration**: Kubernetes (GKE-compatible)
- **Monitoring**: Prometheus (via annotations), Stackdriver Logs

---

## 🚀 Deployment

### 1. Docker Build

```bash
docker build -t <your-image-name> .
```

### 2. Kubernetes Setup

```bash
kubectl apply -f mongodb-secret.yaml
kubectl apply -f mongo-pvc.yaml
kubectl apply -f mongo-deployment.yaml
kubectl apply -f mongo-service.yaml

kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

---

## 🔐 MongoDB Access

MongoDB credentials are loaded from Kubernetes secrets:

```yaml
env:
  - name: MONGO_USER
    valueFrom:
      secretKeyRef:
        name: mongodb-secret
        key: mongo-user
  - name: MONGO_PASSWORD
    valueFrom:
      secretKeyRef:
        name: mongodb-secret
        key: mongo-password
```

---

## 📈 Observability

Ensure Prometheus is scraping metrics by using annotations:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3000"
```

---

## 🧪 Sample API Usage

```bash
curl -X GET "http://<host>:<port>/add?a=10&b=5"
```

---

## 📂 Project Structure

```
.
├── calculator-microservice-advanced.js   # Main API logic
├── Dockerfile                            # App container
├── deployment.yaml                       # App deployment
├── mongo-*.yaml                          # DB deployment & secret
├── service.yaml                          # Service for load balancing
├── install-logging-agent.sh              # Optional Stackdriver install
```

---

## 📝 Author

- Project for SIT737 - Deakin University (2025)

