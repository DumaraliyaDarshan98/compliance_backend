import * as multer from 'multer';

export const profileConfig = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './uploads/profile'); // Folder to save files
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${file.originalname}`); // Unique filename based on timestamp
  },
});

// You can also export limits if needed
export const multerLimits = {
  fileSize: 5 * 1024 * 1024, // 5MB size limit
};
