import { Complaint } from "../models/complaintModel.js";
import { EmployeeProfile } from "../models/employeeProfileModel.js";
import { StudentProfile } from "../models/studentProfileModel.js";
import { uploader } from "../services/cloudinaryService.js";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { getPythonPath } from "../utils/pythonPath.js";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const submitComplaint = async (req, res) => {
  console.log("Incoming fields:", req.body);
  console.log("Files received:", Object.keys(req.files || {}));

  const { area, description, urgency = "low" } = req.body;
  const proofImg = Array.isArray(req.files?.proofImg)
    ? req.files.proofImg[0]
    : req.files?.proofImg;

  if (!area) return res.status(400).json({ message: "Area field is required." });
  if (!proofImg) return res.status(400).json({ message: "Proof image is required." });

  try {
    const student = await StudentProfile.findOne({ user: req.user.id }).populate("user", "username");
    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const rollNumber = student.rollNumber;
    const studentUsername = student.user?.username || "";

    console.log("Uploading to Cloudinary...");
    const up = await uploader(proofImg, area, `${rollNumber || "student"}-${Date.now()}`);
    console.log("Upload success:", up.secure_url);

    const complaint = await Complaint.create({
      area,
      studentId: rollNumber,
      urgency,
      description,
      url: up.url,
      imagePublicId: up.public_id,
    });

    return res.status(201).json({
      message: "Complaint submitted successfully",
      id: complaint._id,
      complaint,
      student: {
        rollNumber,
        name: student.name,
        username: studentUsername,
      },
    });
  } catch (error) {
    console.error("Error in submitComplaint:", error);
    return res
      .status(500)
      .json({ message: "Error submitting complaint", error: error.message });
  }
};

export const listPublicComplaints = async (_req, res) => {
  try {
    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const rollNumbers = [...new Set(complaints.map((c) => c.studentId).filter(Boolean))];

    const profiles = await StudentProfile.find({ rollNumber: { $in: rollNumbers } })
      .populate("user", "username")
      .lean();

    const profileMap = new Map(
      profiles.map((profile) => [profile.rollNumber, profile])
    );

    const shaped = complaints.map((complaint) => {
      const profile = profileMap.get(complaint.studentId);
      return {
        id: complaint._id,
        area: complaint.area,
        description: complaint.description,
        status: complaint.status,
        createdAt: complaint.createdAt,
        url: complaint.url,
        cleanedImgUrl: complaint.cleanedImgUrl,
        cleanlinessScore: complaint.cleanlinessScore,
        student: profile
          ? {
              rollNumber: profile.rollNumber,
              name: profile.name,
              username: profile.user?.username || "",
            }
          : {
              rollNumber: complaint.studentId || "",
              name: "",
              username: "",
            },
      };
    });

    return res.status(200).json({ complaints: shaped, count: shaped.length });
  } catch (error) {
    console.error("Error fetching public complaints:", error);
    return res.status(500).json({ message: "Failed to load complaints", error: error.message });
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

export const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await StudentProfile.findOne({ user: userId });
    console.log(student);
    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const complaints = await Complaint.find({ studentId: student.rollNumber })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      message: `Complaints reported by ${student.name || student.rollNumber}`,
      complaints,
      student: {
        id: student._id,
        rollNumber: student.rollNumber,
        name: student.name,
        email: student.email,
        username: student.user?.username || "",
      },
    });
  } catch (error) {
    console.error("Error fetching student dashboard:", error);
    return res.status(500).json({
      message: "Failed to load student complaints",
      error: error.message,
    });
  }
};

export const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const employee = await EmployeeProfile.findOne({ user: userId });

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found." });
    }

    const [areaComplaints, assignedComplaints] = await Promise.all([
      Complaint.find({
        area: employee.areaAssigned,
        status: { $in: ["pending", "assigned", "completed"] },
      })
        .sort({ createdAt: -1 })
        .lean(),
      Complaint.find({ assignedTo: employee._id })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const combinedMap = new Map();
    [...areaComplaints, ...assignedComplaints].forEach((complaint) => {
      combinedMap.set(String(complaint._id), complaint);
    });

    const complaints = Array.from(combinedMap.values());

    return res.status(200).json({
      message: `Complaints for ${employee.areaAssigned}`,
      complaints,
      assignedComplaints,
    });
  } catch (error) {
    console.error("Error fetching employee dashboard:", error);
    return res.status(500).json({
      message: "Failed to load complaints",
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
          const { cleanedImg } = req.files || {};

          if (!complaintId || !description) {
               return res.status(400).json({ message: "Complaint ID and description are required." });
          }

          if (!cleanedImg) {
               return res.status(400).json({ message: "AFTER image (cleanedImg) is required." });
          }

          const employee = await EmployeeProfile.findOne({ user: userId });
          if (!employee) return res.status(404).json({ message: "Employee profile not found." });

          const complaint = await Complaint.findById(complaintId);
          if (!complaint) return res.status(404).json({ message: "Complaint not found." });

          if (String(complaint.assignedTo) !== String(employee._id)) {
               return res.status(403).json({ message: "You are not assigned to this complaint." });
          }

          const folderName = complaint.area || "complaints";
          const fileName = complaint.fileName || `${complaint._id}-after-${Date.now()}`;

          // Upload cleaned image to Cloudinary
          const up = await uploader(cleanedImg, folderName, fileName);
          complaint.cleanedImgUrl = up.url;
          complaint.cleanedImgPublicId = up.public_id;

          // --- Python process execution ---
          const pythonPath = getPythonPath();
          const scriptPath = path.join(__dirname, "../../scripts/robloxflowAnalysis.py");
          console.log("Resolved Python script path:", scriptPath);

          if (!fs.existsSync(pythonPath)) {
               console.error(`Python executable not found at ${pythonPath}`);
               return res.status(503).json({
                    message: "AI analysis unavailable: Python interpreter not found. Please set up the backend virtual environment.",
               });
          }

          if (!fs.existsSync(scriptPath)) {
               console.error(`Python analysis script missing at ${scriptPath}`);
               return res.status(500).json({
                    message: "AI analysis script is missing. Contact the administrator.",
               });
          }

          const imageUrl = up.url;

          const analysisProcess = spawn(pythonPath, [scriptPath, imageUrl]);

          let output = "";
          let responded = false;

          const sendError = (status, body) => {
               if (!responded) {
                    responded = true;
                    res.status(status).json(body);
               }
          };

          const sendSuccess = (body) => {
               if (!responded) {
                    responded = true;
                    res.status(200).json(body);
               }
          };

          analysisProcess.stdout.on("data", (data) => {
               output += data.toString();
          });

          analysisProcess.stderr.on("data", (data) => {
               console.error("Python error:", data.toString());
          });

          analysisProcess.on("error", (err) => {
               console.error("Failed to start Python process:", err);
               sendError(500, {
                    message: "Image analysis could not start. Ensure Python is installed and accessible.",
                    error: err.message,
               });
          });

         analysisProcess.on("close", async (code) => {
               if (responded) return;

               if (code !== 0) {
                    console.error(`Python exited with code ${code}`);
                    return sendError(500, { message: "Image analysis failed." });
               }

               console.log("Python raw output:", output);

               const match = output.match(/Final Cleanliness%.*?=\s*([\d.]+)/i);
               const cleanlinessScore = match ? parseFloat(match[1]) : NaN;

               if (Number.isNaN(cleanlinessScore)) {
                    console.error("Could not parse cleanliness score from Python output:", output);
                    return sendError(500, {
                         message: "Invalid cleanliness score returned by analysis script.",
                         rawOutput: output,
                    });
               }

               try {
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

                    sendSuccess({
                         message: "Work submitted successfully.",
                         complaintId: complaint._id,
                         cleanlinessScore,
                         resolvedAt: complaint.resolvedAt,
                    });
               } catch (err) {
                    console.error("Error saving work submission:", err);
                    sendError(500, {
                         message: "Error saving work submission.",
                         error: err.message,
                    });
               }
          });
     } catch (error) {
          console.error(error);
          res.status(500).json({
               message: "Error submitting work.",
               error: error.message,
          });
     }
};