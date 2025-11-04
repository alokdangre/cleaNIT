import { Complaint } from "../models/complaintModel.js";
import { EmployeeProfile } from "../models/employeeProfileModel.js";
import { uploader, deleter } from "../services/cloudinaryService.js";
import path from "path";
import { exec, spawn } from "child_process";
import { getPythonPath } from "../utils/pythonPath.js";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const submitComplaint = async (req, res) => {
     const { area, rollNo, description } = req.body;
     const { proofImg } = req.files;
     const folderName = area;
     const fileName = rollNo + Date.now();

     const urgency = req.body.urgency || 'low';
     if (!area) {
          return res.status(400).json({ message: "Area field is required." });
     }

     if (!proofImg) {
          return res.status(400).json({ message: "Proof image is required." });
     }

     if (!rollNo) {
          return res.status(400).json({ message: "Roll Number field is required." });
     }

     try {
          const up = await uploader(proofImg, folderName, fileName);

          const complaint = await Complaint.create({
               area: area,
               studentId: rollNo,
               urgency: urgency,
               description: description,
               url: up.url,
               imagePublicId: up.public_id
          });

          res.status(201).json({
               id: complaint._id,
               complaint,
          });
     } catch (error) {
          res.status(500).json({ message: "Error submitting complaint", error: error.message });
     }
}

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
    const scriptPath = path.join(__dirname, "../scripts/roboflow_analysis.py");
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

      const cleanlinessScore = parseFloat(output.trim());

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