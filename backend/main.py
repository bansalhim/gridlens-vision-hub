from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime
from io import BytesIO
import base64
import os

import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO

app = FastAPI(title="GridLens AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "yolov8n.pt"
model = YOLO(MODEL_PATH)

SAVED_RECORDS = []


def encode_image_to_base64(image_rgb: np.ndarray) -> str:
    image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    success, buffer = cv2.imencode(".jpg", image_bgr)

    if not success:
        return ""

    return base64.b64encode(buffer).decode("utf-8")


def enhance_image_cv(image_rgb: np.ndarray) -> np.ndarray:
    image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)

    l, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_l = clahe.apply(l)

    enhanced_lab = cv2.merge((enhanced_l, a, b))
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    return cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)


def draw_box(image_rgb: np.ndarray, box, label: str, confidence: float):
    x1, y1, x2, y2 = [int(v) for v in box]

    cv2.rectangle(image_rgb, (x1, y1), (x2, y2), (0, 255, 255), 2)

    text = f"{label} {confidence:.2f}"
    cv2.rectangle(image_rgb, (x1, max(0, y1 - 25)), (x1 + 180, y1), (0, 255, 255), -1)
    cv2.putText(
        image_rgb,
        text,
        (x1 + 5, max(18, y1 - 7)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (0, 0, 0),
        2,
    )


def box_center(box):
    x1, y1, x2, y2 = box
    return ((x1 + x2) / 2, (y1 + y2) / 2)


def point_inside_box(point, box):
    x, y = point
    x1, y1, x2, y2 = box
    return x1 <= x <= x2 and y1 <= y <= y2


def expand_box(box, img_w, img_h, scale_x=2.5, scale_y=2.2):
    x1, y1, x2, y2 = box
    cx, cy = box_center(box)

    w = (x2 - x1) * scale_x
    h = (y2 - y1) * scale_y

    return [
        max(0, cx - w / 2),
        max(0, cy - h / 2),
        min(img_w, cx + w / 2),
        min(img_h, cy + h / 2),
    ]


def make_violation(
    violation_type: str,
    confidence: float,
    vehicle_id: str,
    number_plate: str,
    evidence: str,
):
    return {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "violation_type": violation_type,
        "confidence": round(float(confidence), 3),
        "vehicle_id": vehicle_id,
        "number_plate": number_plate,
        "evidence": evidence,
        "status": "Review Required",
    }


def run_yolo_detection(image_rgb: np.ndarray, confidence_threshold: float):
    results = model.predict(image_rgb, conf=confidence_threshold, verbose=False)
    result = results[0]

    detections = []
    names = result.names

    if result.boxes is not None:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            label = names.get(cls_id, str(cls_id))
            confidence = float(box.conf[0])
            xyxy = box.xyxy[0].cpu().numpy().tolist()

            detections.append(
                {
                    "label": label,
                    "confidence": confidence,
                    "box": [round(v, 2) for v in xyxy],
                    "id": f"{label}_{len(detections) + 1}",
                }
            )

    return detections


def run_simple_ocr(image_rgb: np.ndarray):
    try:
        import easyocr

        reader = easyocr.Reader(["en"], gpu=False)
        results = reader.readtext(image_rgb)

        candidates = []

        for _, text, conf in results:
            cleaned = "".join(ch for ch in text.upper() if ch.isalnum())

            if len(cleaned) >= 5:
                candidates.append(
                    {
                        "text": cleaned,
                        "confidence": float(conf),
                    }
                )

        candidates = sorted(candidates, key=lambda x: x["confidence"], reverse=True)
        return candidates[:5]

    except Exception:
        return []


def detect_violation_logic(
    image_rgb: np.ndarray,
    detections,
    number_plate: str,
    simulate_helmet: bool,
    simulate_stop_line: bool,
    simulate_red_light: bool,
    simulate_illegal_parking: bool,
):
    h, w = image_rgb.shape[:2]
    violations = []

    persons = [d for d in detections if d["label"] == "person"]
    motorcycles = [d for d in detections if d["label"] == "motorcycle"]

    for idx, motorcycle in enumerate(motorcycles, start=1):
        expanded = expand_box(motorcycle["box"], w, h)

        nearby_persons = []
        for person in persons:
            if point_inside_box(box_center(person["box"]), expanded):
                nearby_persons.append(person)

        if len(nearby_persons) >= 3:
            violations.append(
                make_violation(
                    violation_type="Triple Riding",
                    confidence=min(0.95, 0.60 + 0.08 * len(nearby_persons)),
                    vehicle_id=f"motorcycle_{idx}",
                    number_plate=number_plate,
                    evidence=f"{len(nearby_persons)} persons detected around motorcycle #{idx}",
                )
            )

    if simulate_helmet:
        violations.append(
            make_violation(
                violation_type="Helmet Non-Compliance",
                confidence=0.82,
                vehicle_id="two_wheeler_demo",
                number_plate=number_plate,
                evidence="Prototype workflow: helmet non-compliance evidence generated for review",
            )
        )

    if simulate_stop_line:
        violations.append(
            make_violation(
                violation_type="Stop-Line Violation",
                confidence=0.78,
                vehicle_id="vehicle_demo",
                number_plate=number_plate,
                evidence="Prototype workflow: vehicle detected beyond virtual stop-line region",
            )
        )

    if simulate_red_light:
        violations.append(
            make_violation(
                violation_type="Red-Light Violation",
                confidence=0.76,
                vehicle_id="vehicle_demo",
                number_plate=number_plate,
                evidence="Prototype workflow: red signal state with vehicle crossing ROI",
            )
        )

    if simulate_illegal_parking:
        violations.append(
            make_violation(
                violation_type="Possible Illegal Parking / Obstruction",
                confidence=0.55,
                vehicle_id="vehicle_demo",
                number_plate=number_plate,
                evidence="Prototype workflow: vehicle detected in obstruction region; needs time-based confirmation",
            )
        )

    return violations


@app.get("/")
def home():
    return {"message": "GridLens AI backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze_image(
    file: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    enhance_image: bool = Form(True),
    enable_ocr: bool = Form(False),
    simulate_helmet: bool = Form(False),
    simulate_stop_line: bool = Form(False),
    simulate_red_light: bool = Form(False),
    simulate_illegal_parking: bool = Form(False),
    confidence_threshold: float = Form(0.35),
):
    uploaded_file = file or image

    if uploaded_file is None:
        return {"error": "No image uploaded"}

    image_bytes = await uploaded_file.read()
    pil_image = Image.open(BytesIO(image_bytes)).convert("RGB")
    image_rgb = np.array(pil_image)

    if enhance_image:
        processed_image = enhance_image_cv(image_rgb)
    else:
        processed_image = image_rgb.copy()

    detections = run_yolo_detection(processed_image, confidence_threshold)

    annotated_image = processed_image.copy()

    for detection in detections:
        draw_box(
            annotated_image,
            detection["box"],
            detection["label"],
            detection["confidence"],
        )

    if simulate_stop_line or simulate_red_light:
        h, w = annotated_image.shape[:2]
        y_line = int(h * 0.72)

        cv2.line(
            annotated_image,
            (0, y_line),
            (w, y_line),
            (255, 0, 0),
            4,
        )

        cv2.putText(
            annotated_image,
            "VIRTUAL STOP LINE / RED LIGHT ROI",
            (25, max(35, y_line - 15)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 0, 0),
            2,
        )

    if simulate_helmet:
        cv2.putText(
            annotated_image,
            "HELMET VIOLATION WORKFLOW ENABLED",
            (25, 45),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (255, 0, 0),
            3,
        )

    ocr_candidates = run_simple_ocr(processed_image) if enable_ocr else []
    number_plate = ocr_candidates[0]["text"] if len(ocr_candidates) > 0 else "-"

    violations = detect_violation_logic(
        processed_image,
        detections,
        number_plate,
        simulate_helmet,
        simulate_stop_line,
        simulate_red_light,
        simulate_illegal_parking,
    )

    for violation in violations:
        new_record = {
            "id": len(SAVED_RECORDS) + 1,
            **violation,
        }
        SAVED_RECORDS.append(new_record)

    return {
        "message": "analysis_completed",
        "detections": detections,
        "violations": violations,
        "ocr_candidates": ocr_candidates,
        "annotated_image_base64": encode_image_to_base64(annotated_image),
    }


@app.get("/records")
def get_records():
    return SAVED_RECORDS