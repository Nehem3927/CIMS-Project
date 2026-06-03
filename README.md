# Cybersecurity Incident Management System (CIMS)

A full-stack web application to manage security incidents, track response actions, link assets and IOCs, and monitor performance metrics.

## Features

* Login with JWT authentication
* Create, view, update, and close incidents
* Upload evidence files (images, PDFs)
* Link assets and IOCs to incidents
* Manage playbooks, threat feeds, and IOCs
* Dashboard with key metrics (open incidents, resolution time, incidents by priority)
* Search, filter, and pagination on incident list
* Audit logs for compliance
* Responsive design (works on desktop, tablet, mobile)

## Tech Stack

* **Backend:** Django, Django REST Framework, JWT, MySQL
* **Frontend:** React, Vite, Axios, React Router, Chart.js
* **Database:** MySQL

## Quick Start

### Prerequisites

* Python 3.10 – 3.12
* Node.js 18+
* MySQL server (running locally)

### Installation

1. **Clone the repository**

   ```bash
   git clone (https://github.com/Nehem3927/CIMS-Project.git)
   cd CIMS-project
   ```

2. **Create MySQL database**

   ```bash
   mysql -u root -p
   CREATE DATABASE cyber_incident_db;
   EXIT;
   ```

3. **Set up backend**

   ```bash
   cd cims_backend
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

   Update `cims_project/settings.py` with your MySQL password:

   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.mysql',
           'NAME': 'cyber_incident_db',
           'USER': 'root',
           'PASSWORD': 'your_password_here',
           'HOST': 'localhost',
           'PORT': '3306',
       }
   }
   ```

   Run migrations and create a superuser:

   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

4. **Set up frontend**

   ```bash
   cd ../cims-frontend
   npm install
   ```

5. **Run the application**

   * **Terminal 1 (backend):**

     ```bash
     cd cims_backend
     python manage.py runserver
     ```

   * **Terminal 2 (frontend):**

     ```bash
     cd cims-frontend
     npm run dev
     ```

6. **Open your browser** at `http://localhost:5173` and log in with the superuser credentials.

