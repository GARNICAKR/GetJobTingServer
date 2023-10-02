const mongoose = require('mongoose');
const {Schema}=mongoose;
const AplicantsSchema=new Schema({
    idJobs: { type: Schema.ObjectId, ref: "Jobs" },
    titleJobs:{type:String,required:false},
    idsEmployee: { type: Array, required: true },
});
module.exports=mongoose.model('aplicants',AplicantsSchema);