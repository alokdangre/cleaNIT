// src/scripts/cleanlinessEvaluator.js
import { execFile } from "child_process";
import path from "path";

export const evaluateCleanliness = (imageUrl) => {
     return new Promise((resolve, reject) => {
          // Example: call a Python script with the Cloudinary image URL
          const scriptPath = path.resolve("src/scripts/analyze_cleanliness.py");
          execFile("python3", [scriptPath, imageUrl], (error, stdout, stderr) => {
               if (error) {
                    console.error("Script error:", stderr);
                    return reject(error);
               }
               const score = parseFloat(stdout.trim());
               resolve(isNaN(score) ? null : score);
          });
     });
};
