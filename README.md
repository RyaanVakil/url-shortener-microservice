# URL Shortener Microservice

[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/)

A full-stack **URL shortener application** built with a **microservice architecture**.
It includes a frontend UI, a backend API for creating links, and a background service for tracking analytics.
All services are containerized with **Docker** and deployed to the **cloud**.

👉 **Live Demo URL** → *[https://url-frontend-service-777746021236.asia-south1.run.app/]*

---

## 🚀 About The Project

This project demonstrates a **real-world, scalable application design**.
Instead of a monolithic app, it is broken down into independent **microservices** that communicate asynchronously via a **message queue**.
This makes the system more **performant, scalable, and resilient**.

### Architecture Components
- **Frontend Service** → Simple web UI built with HTML, CSS, and vanilla JavaScript.
- **Backend Service** → Node.js/Express API that creates short links, saves them, and manages redirects.
- **Analytics Logic** → Background consumer that listens for click events and updates analytics asynchronously.
- **Database** → PostgreSQL for storing URL mappings and click counts.
- **Message Queue** → RabbitMQ (for local development) / Google Cloud Pub/Sub (for production).

---

## ✨ Features
- 🔗 **Shorten Long URLs** → Convert any valid URL into a short, unique link.
- 🚀 **Redirects** → Automatically redirect users from short links to original URLs.
- 📊 **Click Tracking** → Asynchronous click counting for performance.
- 📡 **Analytics API** → View click counts for any short link.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Database**: PostgreSQL
- **Messaging**: RabbitMQ (Local) / Google Cloud Pub/Sub (Production)
- **Containerization**: Docker, Docker Compose
- **Deployment**: Google Cloud Run, Cloud SQL, Artifact Registry

---

## 🖥 Running Locally

You will need **Docker** and **Docker Compose** installed on your machine.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/RyaanVakil/url-shortener-microservice.git](https://github.com/RyaanVakil/url-shortener-microservice.git)
    cd url-shortener-microservice
    ```

2.  **Start the services:**
    ```bash
    docker-compose up -d --build
    ```
3.  **Access the application:**
    - **Frontend UI** → `http://localhost:8080`
    - **Backend API** → `http://localhost:3000`

---

## 📡 API Endpoints

| Method | Endpoint                | Description                            |
| :----- | :---------------------- | :------------------------------------- |
| `POST` | `/shorten`              | Creates a new short URL.               |
| `GET`  | `/:shortCode`           | Redirects to the original URL.         |
| `GET`  | `/analytics/:shortCode` | Shows the click count for a short URL. |