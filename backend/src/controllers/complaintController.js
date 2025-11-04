import { Complaint } from "../models/complaintModel.js";
import { EmployeeProfile } from "../models/employeeProfileModel.js";
import { uploader, deleter } from "../services/cloudinaryService.js";

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
               url : up.url,
               imagePublicId : up.public_id
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
          const {cleanedImg} = req.files;

          if (!complaintId || !description) {
               return res.status(400).json({ message: "Complaint ID and description are required." });
          }


          const employee = await EmployeeProfile.findOne({ user: userId });
          if (!employee) {
               return res.status(404).json({ message: "Employee profile not found." });
          }


          const complaint = await Complaint.findById(complaintId);
          if (!complaint) {
               return res.status(404).json({ message: "Complaint not found." });
          }

          const {folderName, fileName} = complaint;


          if (String(complaint.assignedTo) !== String(employee._id)) {
               return res.status(403).json({ message: "You are not assigned to this complaint." });
          }

          const up = await uploader(cleanedImg, folderName, fileName);
          complaint.cleanedImgUrl = up.url;
          complaint.cleanedImgPublicId = url.public_id;
          complaint.status = "completed";
          complaint.resolvedAt = new Date();
          await complaint.save();


          employee.workDone.push({
               description,
               completedAt: new Date(),
          });
          await employee.save();

          res.status(200).json({
               message: "Work submitted successfully.",
               complaintId: complaint._id,
               resolvedAt: complaint.resolvedAt,
          });
     } catch (error) {
          res.status(500).json({
               message: "Error submitting work.",
               error: error.message,
          });
     }
};