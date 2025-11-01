const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema(
     {
          area:{type: String, required: true},
          studentId: {type: String, required: true, unique: true},
          status:{
               type:String, 
               enum:['pending', 'inProgress', 'completed'],
          },
          urgency:{
               type:String,
               enum:['low', 'medium', 'high'],
          },
     },
     {timestamps:true} 
);

module.exports = mongoose.model("Complaint", ComplaintSchema);