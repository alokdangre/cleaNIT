import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

export default () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });
    console.log("✅ Cloudinary connected successfully");
  } catch (err) {
    console.error("❌ Cloudinary connection failed:", err);
  }
};

