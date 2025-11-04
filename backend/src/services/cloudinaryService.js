import { v2 as cloudinary } from "cloudinary";

export const uploader = async (file, folder, file_name, quality) => {
  const options = { folder, resource_type: "auto", public_id : file_name};
  if(quality) options.quality = quality;
  
  try {
    const uploaded = await cloudinary.uploader.upload(file.tempFilePath, options);
    return uploaded;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleter = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "image",
      type: "upload",
      invalidate: true, 
      timeout: 60000,
    });
    console.log("Cloudinary deletion response:", result);
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw error;
  }
};