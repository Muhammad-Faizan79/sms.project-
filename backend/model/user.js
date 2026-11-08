import mongoose from "mongoose";

const userschma =new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    email:{
        type:String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password:{
        type:String,
        required: true,
        select: false
    },
    role:{
        type:String,
        enum: ["admin"],
        default: "admin",
        unique: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform(_document, record) {
            delete record.password;
            return record;
        }
    }
})

const User= mongoose.model("user",userschma)
export default User