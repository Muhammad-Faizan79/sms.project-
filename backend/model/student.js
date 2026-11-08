import mongoose from "mongoose";

const studentschema =new mongoose.Schema({
    name:{ type:String, required:true, trim:true},
    email:{ type:String, required:true, unique:true, lowercase:true, trim:true},
    phone:{ type:String, trim:true},
    role:{
        type:String,
        default:"student",
        immutable:true
    },
    password:{ type:String, required:true, select:false},
    className:{type:String, required:true, trim:true},
    group:{type:String, required:true, trim:true,
        default:"A"
    },
    rollNo:{
        type:String, required:true, unique:true, trim:true, uppercase:true
    }
},{
    timestamps:true,
    toJSON: {
        transform(_document, record) {
            delete record.password;
            return record;
        }
    }
})

const students = mongoose.model( "students" ,studentschema);


export default students