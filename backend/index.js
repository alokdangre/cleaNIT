import express from "express";
import fileUpload from "express-fileupload";
import cloudinaryConnect from "./config/cloudinaryConfig.js";
import { deleteHandler, uploadHandler } from "./controllers/cloudinaryController.js";
cloudinaryConnect();

const app = express();
const PORT = 4000;

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./tmp/",
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  })
);

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello from server!");
});

app.post("/cloudinary/upload", uploadHandler);
app.post("/cloudinary/delete", deleteHandler);

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
