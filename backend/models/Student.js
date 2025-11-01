const mongoose = require('mongoose');

const bycrpyt = require('bcryptjs');

const StudentSchema = new mongoose.Schema(
     {
          rollNo: {type: String, required: true, unique: true},
          name: {type:String, required:true},
          password: {type: String, required: true},
          email: {type: String, required: true, unique: true},
     },
     {timestamps:true} 
);

//Hash Password before saving
StudentSchema.pre('save', async function (next){
     if(!this.isModified("password")){
          return next();
     }
     this.password = await bcrypt.hash(this.password, 10);
     next();
});

//Compare passwords
StudentSchema.methods.comparePassword = async function (candidatePassword) {
     return await bcrypt.compare(candidatePassword, this.password);
}

module.exports = mongoose.model("Student", StudentSchema);