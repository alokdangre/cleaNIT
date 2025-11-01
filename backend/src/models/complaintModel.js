import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
     {
          area: {
               type: String,
               required: true,
               trim: true,
          },

          studentId: {
               type: String,
               required: true,
               trim: true,
          },

          status: {
               type: String,
               enum: ['pending', 'assigned', 'inProgress', 'completed'],
               default: 'pending',
          },

          urgency: {
               type: String,
               enum: ['low', 'medium', 'high'],
               default: 'low',
          },

          description: {
               type: String,
               trim: true,
               default: '',
          },

          assignedTo: {
               type: mongoose.Schema.Types.ObjectId,
               ref: 'EmployeeProfile',
               default: null,
          },

          resolvedAt: {
               type: Date,
               default: null,
          },
     },
     {
          timestamps: true,
     }
);

export const Complaint = mongoose.model('Complaint', complaintSchema);
