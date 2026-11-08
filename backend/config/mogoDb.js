import mongoose from "mongoose";
import {setServers} from "node:dns/promises"
setServers(["8.8.8.8","1.1.1.1"])
const conect = async () => {
    if (!process.env.mongodbURI) throw new Error("mongodbURI is missing from the backend .env file");
    await mongoose.connect(process.env.mongodbURI);
    console.log("MongoDB connected");
};

export default conect;