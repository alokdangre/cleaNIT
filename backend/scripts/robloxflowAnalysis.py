import os
import sys
import argparse
import base64
import cv2
import numpy as np
import requests
from inference_sdk import InferenceHTTPClient


# ----------------- Default config (change as needed) -----------------
DEFAULT_API_KEY = os.getenv("ROBOFLOW_API_KEY", "gR2Ws6Qwgh1MYaLxYKJM")
DEFAULT_API_URL = "https://serverless.roboflow.com"
DEFAULT_WORKSPACE = "cleanit"
DEFAULT_MODELS = [
    "detect-count-and-visualize-3",   # model A
    "detect-count-and-visualize-4",   # model B (replace with actual)
    "detect-count-and-visualize-5"    # model C (replace with actual)
]
# --------------------------------------------------------------------

def normalize_response(res):
    if isinstance(res, list) and len(res) > 0:
        return res[0]
    return res


def extract_predictions(normalized):
    if not normalized:
        return []
    preds = []
    if "predictions" in normalized:
        p = normalized["predictions"]
        if isinstance(p, dict) and "image" in p and isinstance(p["image"], dict) and "predictions" in p["image"]:
            preds = p["image"]["predictions"] or []
        elif isinstance(p, dict) and "predictions" in p:
            preds = p["predictions"] or []
        elif isinstance(p, list):
            preds = p
    elif isinstance(normalized, list):
        preds = normalized
    return preds or []


def get_image_wh_from_response(normalized):
    try:
        p = normalized.get("predictions")
        if isinstance(p, dict) and "image" in p and isinstance(p["image"], dict):
            w = p["image"].get("width")
            h = p["image"].get("height")
            if w and h:
                return int(w), int(h)
    except Exception:
        pass
    return None


def compute_total_area_from_preds(preds, img_w, img_h):
    total = 0.0
    count = 0
    for p in preds:
        w = p.get("width") or p.get("w")
        h = p.get("height") or p.get("h")

        if w is not None and h is not None:
            try:
                wf = float(w)
                hf = float(h)
                if wf <= 1.001 and hf <= 1.001:
                    wf *= img_w
                    hf *= img_h
                total += max(0.0, wf) * max(0.0, hf)
                count += 1
                continue
            except Exception:
                pass

        x1 = p.get("x1") or p.get("left")
        y1 = p.get("y1") or p.get("top")
        x2 = p.get("x2") or p.get("right")
        y2 = p.get("y2") or p.get("bottom")
        if x1 is not None and y1 is not None and x2 is not None and y2 is not None:
            try:
                wbox = float(x2) - float(x1)
                hbox = float(y2) - float(y1)
                total += max(0.0, wbox) * max(0.0, hbox)
                count += 1
                continue
            except Exception:
                pass
    return total, count


def save_output_image(normalized, outpath):
    out = normalized.get("output_image")
    if not out:
        return False
    val = None
    if isinstance(out, dict):
        val = out.get("value") or out.get("data") or out.get("base64")
    elif isinstance(out, str):
        val = out
    if not val:
        return False
    try:
        b = base64.b64decode(val)
        with open(outpath, "wb") as f:
            f.write(b)
        return True
    except Exception:
        return False


def load_image_from_path_or_url(image_arg):
    """Load image from either local file path or URL."""
    if image_arg.startswith("http://") or image_arg.startswith("https://"):
        try:
            resp = requests.get(image_arg, timeout=10)
            resp.raise_for_status()
            img_array = np.asarray(bytearray(resp.content), dtype=np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            if img is None:
                print("Error: failed to decode image from URL")
                sys.exit(1)
            return img
        except Exception as e:
            print(f"Error: unable to fetch image from URL -> {e}")
            sys.exit(1)
    else:
        if not os.path.exists(image_arg):
            print(f"Error: image not found -> {image_arg}")
            sys.exit(1)
        img = cv2.imread(image_arg)
        if img is None:
            print("Error: failed to read image with OpenCV:", image_arg)
            sys.exit(1)
        return img


def main():
    p = argparse.ArgumentParser(description="Ensemble trash-area% metric using 3 Roboflow workflows")
    p.add_argument("image", help="path or URL of image (e.g., road4.jpg or https://...)")
    p.add_argument("--models", default=",".join(DEFAULT_MODELS))
    p.add_argument("--workspace", default=DEFAULT_WORKSPACE)
    p.add_argument("--api-key", default=DEFAULT_API_KEY)
    p.add_argument("--api-url", default=DEFAULT_API_URL)
    p.add_argument("--save-annotated", action="store_true")
    p.add_argument("--confidence", default=None)
    args = p.parse_args()

    image_arg = args.image
    img = load_image_from_path_or_url(image_arg)
    img_h, img_w = img.shape[:2]

    model_ids = [m.strip() for m in args.models.split(",") if m.strip()]
    if len(model_ids) < 1:
        print("Error: at least one model id required")
        sys.exit(1)
    if len(model_ids) != 3:
        print("Warning: expected 3 models but got", len(model_ids))

    client = InferenceHTTPClient(api_url=args.api_url, api_key=args.api_key)
    per_model_results = []

    for idx, mid in enumerate(model_ids, start=1):
        print(f"\n--- Running model {idx}/{len(model_ids)} : {mid} ---")
        try:
            resp = client.run_workflow(
                workspace_name=args.workspace,
                workflow_id=mid,
                images={"image": image_arg},
                use_cache=True,
            )
        except Exception as e:
            print("Error calling workflow:", e)
            per_model_results.append({
                "model": mid, "error": str(e),
                "detections": 0, "total_area_px": 0.0,
                "area_percent": 0.0, "cleanliness_percent": 100.0
            })
            continue

        normalized = normalize_response(resp)
        preds = extract_predictions(normalized)
        wh = get_image_wh_from_response(normalized)
        mw, mh = wh if wh else (img_w, img_h)

        total_area_px, count = compute_total_area_from_preds(preds, mw, mh)
        area_percent = (total_area_px / (float(mw) * float(mh) + 1e-9)) * 100.0 if (mw*mh) > 0 else 0.0
        cleanliness = max(0.0, min(100.0, 100.0 - area_percent))

        annotated_saved = False
        if args.save_annotated:
            outname = f"annotated_model_{idx}.jpg"
            try:
                annotated_saved = save_output_image(normalized, outname)
                if annotated_saved:
                    print(f"Saved annotated output -> {outname}")
            except Exception as e:
                print("Warning: failed to save annotated image:", e)

        print(f"Detections: {count}")
        print(f"Total trash area (px): {total_area_px:.1f}")
        print(f"Image dims used: {mw}x{mh} -> area%: {area_percent:.4f}% ; cleanliness%: {cleanliness:.2f}%")

        per_model_results.append({
            "model": mid, "detections": int(count),
            "total_area_px": float(total_area_px),
            "area_percent": float(area_percent),
            "cleanliness_percent": float(cleanliness),
            "annotated_saved": annotated_saved
        })

    valid_models = [r for r in per_model_results if r.get("detections", 0) > 0]
    any_detected = len(valid_models) > 0

    if not any_detected:
        print("\nNo model detected any trash. Ensemble metrics: trash% = 0.0 ; cleanliness% = 100.0")
        sys.exit(0)

    avg_trash_percent = sum(r["area_percent"] for r in valid_models) / len(valid_models)
    avg_cleanliness_percent = max(0.0, min(100.0, 100.0 - avg_trash_percent))

    PENALTY_PCT = 40.0
    downgraded_cleanliness = max(0.0, avg_cleanliness_percent - PENALTY_PCT)
    downgraded_trash_percent = min(100.0, 100.0 - downgraded_cleanliness)

    print("\n=== Ensemble Summary (models with >=1 detection only) ===")
    for r in valid_models:
        print(f" - {r['model']}: detections={r['detections']}, area%={r['area_percent']:.4f}, cleanliness%={r['cleanliness_percent']:.2f}")

    print(f"\nFinal Cleanliness% (after penalty) = {downgraded_cleanliness:.2f}%")
    print(f"Final Trash% (after penalty) = {downgraded_trash_percent:.4f}%")


if __name__ == "__main__":
    main()