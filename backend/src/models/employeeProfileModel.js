import mongoose from 'mongoose';

const employeeProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    areaAssigned: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    workDone: {
      type: [
        {
          description: {
            type: String,
            trim: true,
          },
          completedAt: {
            type: Date,
          },
          cleanlinessScore: {
            type: Number,
            min: 0,
            max: 100,
            default: null, // will be filled after script analysis
          },
          complaintId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Complaint',
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const EmployeeProfile = mongoose.model('EmployeeProfile', employeeProfileSchema);
