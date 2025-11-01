import { deleter, uploader } from "../services/cloudinaryService.js";

export const uploadHandler  = async (req, res) => {
  let img = req.files?.img;
  const {folder} = req.body;

  console.log(img);
  console.log(folder);

  console.log("hello");
  
  try {
    if (img) {
        console.log("Image received");
        console.log("Folder : ", folder);
        const up = await uploader(img, folder);
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
