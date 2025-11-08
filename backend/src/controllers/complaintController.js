import { Complaint } from "../models/complaintModel.js";
import { EmployeeProfile } from "../models/employeeProfileModel.js";
import { uploader } from "../services/cloudinaryService.js";
import path from "path";
import { spawn } from "child_process";
import { getPythonPath } from "../utils/pythonPath.js";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const submitComplaint = async (req, res) => {
  console.log("Incoming fields:", req.body);
  console.log("Files received:", Object.keys(req.files || {}));

  const { area, rollNo, description, urgency = "low" } = req.body;
  const proofImg = Array.isArray(req.files.proofImg)
    ? req.files.proofImg[0]
    : req.files.proofImg;

  if (!area) return res.status(400).json({ message: "Area field is required." });
  if (!proofImg) return res.status(400).json({ message: "Proof image is required." });
  if (!rollNo) return res.status(400).json({ message: "Roll Number field is required." });

  try {
    console.log("Uploading to Cloudinary...");
    const up = await uploader(proofImg, area, rollNo + Date.now());
    console.log("Upload success:", up.secure_url);

    const complaint = await Complaint.create({
      area,
      studentId: rollNo,
      urgency,
      description,
      url: up.url,
      imagePublicId: up.public_id,
    });

    return res.status(201).json({
      message: "Complaint submitted successfully",
      id: complaint._id,
      complaint,
    });
  } catch (error) {
    console.error("Error in submitComplaint:", error);
    return res
      .status(500)
      .json({ message: "Error submitting complaint", error: error.message });
  }
};

export const assignComplaintToEmployee = async (req, res) => {
     try {

          const userId = req.user.id;

          const employee = await EmployeeProfile.findOne({ user: userId });

          if (!employee) {
               return res.status(404).json({ message: "Employee profile not found." });
          }


          const complaint = await Complaint.findOne({
               area: employee.areaAssigned,
               status: "pending",
          }).sort({ createdAt: 1 });
          if (!complaint) {
               return res.status(200).json({ message: "No pending complaints for your area." });
          }


          complaint.status = "assigned";
          complaint.assignedTo = employee._id;
          await complaint.save();


          employee.workDone.push({
               description: `Assigned complaint ${complaint._id} on ${new Date().toLocaleString()}`,
          });
          await employee.save();

          res.status(200).json({
               message: "Complaint assigned successfully.",
               complaint,
          });
     } catch (error) {
          res.status(500).json({
               message: "Error assigning complaint.",
               error: error.message,
          });
     }
};

export const submitWork = async (req, res) => {
     try {
          console.log("Raw headers:", req.headers["content-type"]);
          console.log("req.files:", req.files);
          console.log("req.body:", req.body);
          const userId = req.user.id;
          const { complaintId, description } = req.body;
          const { cleanedImg } = req.files;

          if (!complaintId || !description) {
               return res.status(400).json({ message: "Complaint ID and description are required." });
          }

          const employee = await EmployeeProfile.findOne({ user: userId });
          if (!employee) return res.status(404).json({ message: "Employee profile not found." });

          const complaint = await Complaint.findById(complaintId);
          if (!complaint) return res.status(404).json({ message: "Complaint not found." });

          if (String(complaint.assignedTo) !== String(employee._id)) {
               return res.status(403).json({ message: "You are not assigned to this complaint." });
          }

          const { folderName, fileName } = complaint;

          // Upload cleaned image to Cloudinary
          const up = await uploader(cleanedImg, folderName, fileName);
          complaint.cleanedImgUrl = up.url;
          complaint.cleanedImgPublicId = up.public_id;

          // --- Python process execution ---
          const pythonPath = getPythonPath();
          const scriptPath = path.join(__dirname, "../../scripts/robloxflowAnalysis.py");
          console.log("Resolved Python script path:", scriptPath);

          const imageUrl = up.url;

          const process = spawn(pythonPath, [scriptPath, imageUrl]);

          let output = "";

          process.stdout.on("data", (data) => {
               output += data.toString();
          });

          process.stderr.on("data", (data) => {
               console.error("Python error:", data.toString());
          });

          process.on("close", async (code) => {
               if (code !== 0) {
                    console.error(`Python exited with code ${code}`);
                    return res.status(500).json({ message: "Image analysis failed." });
               }
               console.log("Python raw output:", output);

               // Extract "Final Cleanliness% (after penalty) = 27.09%"
               const match = output.match(/Final Cleanliness%.*?=\s*([\d.]+)/i);
               const cleanlinessScore = match ? parseFloat(match[1]) : NaN;

               if (isNaN(cleanlinessScore)) {
                    console.error("Could not parse cleanliness score from Python output:", output);
                    return res.status(500).json({
                         message: "Invalid cleanliness score returned by analysis script.",
                         rawOutput: output,
                    });
               }

               complaint.status = "completed";
               complaint.resolvedAt = new Date();
               complaint.cleanlinessScore = cleanlinessScore;
               await complaint.save();

               employee.workDone.push({
                    description,
                    completedAt: new Date(),
                    cleanlinessScore,
               });
               await employee.save();

               return res.status(200).json({
                    message: "Work submitted successfully.",
                    complaintId: complaint._id,
                    cleanlinessScore,
                    resolvedAt: complaint.resolvedAt,
               });
          });
     } catch (error) {
          console.error(error);
          res.status(500).json({
               message: "Error submitting work.",
               error: error.message,
          });
     }
};