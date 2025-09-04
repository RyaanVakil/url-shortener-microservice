URL Shortener Microservice
A full-stack URL shortener application built with a microservice architecture. This project includes a frontend UI, a backend API for creating links, and a separate background service for tracking analytics, all containerized with Docker and deployed to the cloud.

[[Live Demo Link Here](https://url-frontend-service-777746021236.asia-south1.run.app/)] 

About The Project
This project demonstrates a real-world, scalable application design. Instead of a single monolithic application, it is broken down into independent services that communicate asynchronously using a message queue. This approach improves performance, scalability, and resilience.

The application consists of several key components:

Frontend Service: A simple web interface built with HTML, CSS, and vanilla JavaScript that allows users to shorten URLs.

Backend Service: A Node.js/Express API that handles creating short links, saving them to the database, and managing redirects.

Analytics Logic: A background consumer that listens for "click" events from a message queue and updates the analytics in the database without slowing down user redirects.

Database: A PostgreSQL database for persistent storage of URL mappings and click counts.

Message Queue: RabbitMQ (for local development) or Google Cloud Pub/Sub (for production) to handle asynchronous communication between services.

Features
Shorten Long URLs: Convert any valid URL into a short, unique link.

Redirects: Automatically redirect users from the short link to the original URL.

Click Tracking: Asynchronously counts the number of times each link is clicked.

Analytics Endpoint: A simple API endpoint to view the click count for any short link.

Tech Stack
Backend: Node.js, Express.js

Frontend: HTML, CSS, Vanilla JavaScript

Database: PostgreSQL

Messaging: RabbitMQ (Local) / Google Cloud Pub/Sub (Production)

Containerization: Docker, Docker Compose

Deployment: Google Cloud Run, Cloud SQL, Artifact Registry

Running Locally
To run this project on your local machine, you will need to have Docker and Docker Compose installed.

Clone the repository:
git clone https://github.com/RyaanVakil/url-shortener-microservice.git
cd your-repository-name

Start the services:
docker-compose up -d --build
Access the application:

Frontend UI: http://localhost:8080

Backend API: http://localhost:3000

API Endpoints
Method	     Endpoint	           Description
POST	/shorten	            Creates a new short URL.
GET	    /:shortCode	            Redirects to the original URL.
GET	    /analytics/:shortCode	Shows the click count for a short URL.
