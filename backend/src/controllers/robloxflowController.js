import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const analyzeImage = (req, res) => {
     const { imageUrl } = req.body; // Cloudinary URL from frontend

     if (!imageUrl) {
          return res.status(400).json({ error: "Image URL is required" });
     }

     // Path to your Python script
     const scriptPath = path.join(__dirname, "../scripts/roboflow_analysis.py");

     // Run Python script and pass image URL
     const command = `python ${scriptPath} "${imageUrl}"`;

     exec(command, (error, stdout, stderr) => {
          if (error) {
               console.error("Error:", error.message);
               return res.status(500).json({ error: "Python script error" });
          }
          if (stderr) console.error("stderr:", stderr);
          console.log("stdout:", stdout);

          // You can parse output if Python prints JSON
          res.status(200).json({ output: stdout });
     });
};
