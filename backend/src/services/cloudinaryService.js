import { v2 as cloudinary } from "cloudinary";

export const uploader = async (file, folder, quality) => {
  const options = { folder, resource_type: "auto" };
  if(quality) options.quality = quality;
  
  try {
    const uploaded = await cloudinary.uploader.upload(file.tempFilePath, options);
    return uploaded;
  } catch (error) {
    throw error;
  }
};

export const deleter = async (public_id) => {
  try {
      await cloudinary.uploader.destroy(public_id);
      console.log("Img removed from Cloudinary.");
  } catch (error) {
      throw error;
  }
};