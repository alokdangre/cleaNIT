const mongoose = require('mongoose');

const bycrpyt = require('bcryptjs');

const EmployeeSchema = new mongoose.Schema(
     {
          phoneNumber: {type: String, required: true, unique: true},
          name: {type:String, required:true},
          password: {type: String, required: true},
          empId: {type: String, required: true, unique: true},
          areaAssigned:{type: String, required: true},
     },
     {timestamps:true} 
);

//Hash Password before saving
EmployeeSchema.pre('save', async function (next){
     if(!this.isModified("password")){
          return next();
     }
     this.password = await bcrypt.hash(this.password, 10);
     next();
});

//Compare passwords
EmployeeSchema.methods.comparePassword = async function (candidatePassword) {
     return await bcrypt.compare(candidatePassword, this.password);
}

module.exports = mongoose.model("Employee", EmployeeSchema);