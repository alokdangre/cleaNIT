import { v2 as cloudinary } from "cloudinary";

export const uploader = async (file, folder, file_name, quality) => {
  const options = { folder, resource_type: "auto", public_id: file_name };
  if (quality) options.quality = quality;

  try {
    const fileContent =
      file?.data ||
      file?.buffer ||
      file?.path;

    if (!fileContent) {
      throw new Error("Invalid file object: missing data/buffer/path");
    }

    const uploaded = await cloudinary.uploader.upload(fileContent, options);
    return uploaded;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
