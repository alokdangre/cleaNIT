import { deleter, uploader } from "../services/cloudinaryService.js";

export const uploadHandler  = async (req, res) => {
  let img = req.files?.img;
  const {folder, name} = req.body;
  
  try {
    if (img) {
      console.log(img, folder, name);
        console.log("Image received");
        const up = await uploader(img, folder, name);
        console.log("Img upload successful:", up);
    }

    return res.status(200).json({
        message : "Img upload successful",
        success : true
    })

  } catch (error) {
    console.error("Img upload failed:", error);
    return res.status(500).json({
        message : "Img upload failed",
        success : false
    })
  }
};

export const deleteHandler = async(req, res) => {
  const {public_id} = req.body;
  try {
    if (public_id) {
      console.log(public_id);
        await deleter(public_id);
        console.log("Img deletion successful");
    }

    return res.status(200).json({
        message : "Img deletion successful",
        success : true
    })

  } catch (error) {
    console.error("Img deletion failed:", error);
    return res.status(500).json({
        message : "Img deletion failed",
        success : false
    })
  }
}
