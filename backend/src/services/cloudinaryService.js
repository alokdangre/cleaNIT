import { v2 as cloudinary } from "cloudinary";

export const uploader = async (file, folder, file_name, quality) => {
  if (Array.isArray(file)) file = file[0]; // ✅ handle express-fileupload array case

  const options = { folder, resource_type: "auto", public_id: file_name };
  if (quality) options.quality = quality;

  try {
    let fileContent;

    if (file?.tempFilePath) {
      fileContent = file.tempFilePath;
    } else if (file?.path && typeof file.path === "string") {
      fileContent = file.path;
    } else if (file?.data) {
      fileContent = `data:${file.mimetype || "application/octet-stream"};base64,${file.data.toString("base64")}`;
    } else if (file?.buffer) {
      fileContent = `data:${file.mimetype || "application/octet-stream"};base64,${file.buffer.toString("base64")}`;
    }

    if (!fileContent) {
      throw new Error("Invalid file object: missing data/buffer/path/tempFilePath");
    }

    const uploaded = await cloudinary.uploader.upload(fileContent, options);
    return uploaded;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
