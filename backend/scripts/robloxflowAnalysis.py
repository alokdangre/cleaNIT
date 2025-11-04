import os
import sys
import json
import tempfile
import urllib
from inference_sdk import InferenceHTTPClient

# ----------------- Default config -----------------
DEFAULT_API_KEY = os.getenv("ROBOFLOW_API_KEY", "gR2Ws6Qwgh1MYaLxYKJM")
DEFAULT_API_URL = os.getenv("ROBOFLOW_API_URL", "https://serverless.roboflow.com")
DEFAULT_WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "cleanit")
DEFAULT_WORKFLOW_ID = os.getenv("ROBOFLOW_WORKFLOW_ID", "detect-count-and-visualize-3")
# ---------------------------------------------------

def download_if_url(image_path):
    if image_path.startswith("http://") or image_path.startswith("https://"):
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        urllib.request.urlretrieve(image_path, tmp.name)
        return tmp.name
    return image_path

def normalize_response(res):
    if isinstance(res, list) and len(res) > 0:
        return res[0]
    return res

def extract_predictions(normalized):
    preds = []
    if not normalized:
        return preds
    if "predictions" in normalized:
        p = normalized["predictions"]
        if isinstance(p, dict) and "image" in p and "predictions" in p["image"]:
            preds = p["image"]["predictions"] or []
        elif isinstance(p, list):
            preds = p
    elif isinstance(normalized, list):
        preds = normalized
    return preds or []

def compute_total_area(preds, img_w, img_h):
    total = 0.0
    count = 0
    for p in preds:
        w = p.get("width") or p.get("w")
        h = p.get("height") or p.get("h")
        if w is not None and h is not None:
            wf = float(w)
            hf = float(h)
            if wf <= 1.001 and hf <= 1.001:
                wf *= img_w
                hf *= img_h
            total += max(0.0, wf) * max(0.0, hf)
            count += 1
    return total, count

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python roboflow_analysis.py <image_path_or_url>"}))
        sys.exit(1)

    image_path = sys.argv[1]
    local_path = download_if_url(image_path)

    # Create client
    client = InferenceHTTPClient(api_url=DEFAULT_API_URL, api_key=DEFAULT_API_KEY)

    try:
        resp = client.run_workflow(
            workspace_name=DEFAULT_WORKSPACE,
            workflow_id=DEFAULT_WORKFLOW_ID,
            images={"image": local_path},
            use_cache=True
        )
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    normalized = normalize_response(resp)
    preds = extract_predictions(normalized)

    # Get image dimensions (fallback using OpenCV)
    try:
        import cv2
        img = cv2.imread(local_path)
        h, w, _ = img.shape
    except Exception:
        w, h = 1000, 1000

    total_area, count = compute_total_area(preds, w, h)
    image_area = float(w * h) if (w * h) > 0 else 1.0
    area_percent = (total_area / image_area) * 100.0
    cleanliness = max(0.0, min(100.0, 100.0 - area_percent))

    result = {
        "cleanliness": round(cleanliness, 2),
        "detections": count,
        "predictions": preds[:5]  # send top 5 predictions only
    }

    print(json.dumps(result))  # <- clean JSON output

if __name__ == "__main__":
    main()
