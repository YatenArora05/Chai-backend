import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectDB= async ()=>{
    try{
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in .env file");
        }
       const conectionInstance=  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`MongoDb connected !! DB HOSt:${
        conectionInstance.connection.host}`);
    }catch(error){
        console.log("MONGODB connection error",error);
        process.exit(1)
    }
}
export default connectDB;