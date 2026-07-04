# GridLens AI – Traffic Violation Detection System

GridLens AI is a full-stack computer vision web application that detects traffic objects from uploaded road images and generates traffic violation review records.  
It uses a React frontend, FastAPI backend, YOLOv8 object detection, OpenCV image processing, and SQLite database storage.

---

## Live Project Links

**Frontend Website:**  
https://gridlens-vision-hub.vercel.app

**Backend API:**  
https://himan123-gridlens-ai-backend.hf.space

**Backend API Docs:**  
https://himan123-gridlens-ai-backend.hf.space/docs

**Violation Records Endpoint:**  
https://himan123-gridlens-ai-backend.hf.space/records

---

## Project Overview

The user uploads a traffic image through the frontend website.  
The image is sent to the backend API, where YOLOv8 performs object detection.  
Based on the detected objects, the backend applies rule-based violation logic and returns an annotated image with detection and violation details.

The system can currently support review workflows such as:

- Triple riding detection
- Helmet violation workflow
- Stop-line violation workflow
- Red-light violation workflow
- Illegal parking workflow
- Number plate OCR workflow
- Violation record storage using SQLite

---

## Tech Stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Vercel

### Backend

- Python
- FastAPI
- Uvicorn
- YOLOv8
- Ultralytics
- OpenCV
- Pillow
- SQLite
- Hugging Face Spaces

---

## System Architecture

```text
User
↓
Vercel Frontend
↓
Image Upload Request
↓
Hugging Face FastAPI Backend
↓
YOLOv8 Object Detection
↓
Violation Logic + Image Annotation
↓
SQLite Record Storage
↓
Response Sent Back to Frontend
↓
User Sees Detection Result and Violation Report
