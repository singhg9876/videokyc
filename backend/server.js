const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { log } = require('console');
const { connectToDatabase, sql } = require('./database'); // Import database connection
let file_name;
const app = express();
const PORT = 5000;
app.use(cors());
app.use('/videos', express.static(path.join(__dirname, 'uploads')));

const uploadDirectory = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    console.log(req.body)
    console.log(req.query)

    const { name = 'unknown', phone = 'unknown', } = req.body; // Default values to avoid undefined errors
    const sanitizedName = name.replace(/\s+/g, '_'); // Replace spaces with underscores
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]; // Format timestamp
    file_name = `${sanitizedName}_${phone}_${timestamp}.mp4`; // Construct filename
    console.log(`Constructed filename: ${file_name}`);
    cb(null, file_name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10 MB
});

// Route to handle video upload
app.post('/upload', upload.single('video'), async(req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: "No file uploaded" });
  }
  
  const newFileName = req.file.path.replace(file_name, req.body.name.replace(/\s+/g, '-') + '_' + req.body.idNumber + '.mp4')
  fs.rename(req.file.path, newFileName, (err) => {
    if (err) {
      console.error('Error renaming file:', err);
      return;
    }
    console.log('File renamed successfully');
  });

  // making entry in database 
  const pool = await connectToDatabase(); // Connect to the database
  if (!pool) {
    return res.status(500).send({ message: "Database connection failed" });
  }
  pool.query(`insert into VideoData values ("${req.body.email}","${req.body.name}","${req.body.phone}", "${req.body.customerId}","${req.body.idType}", "${req.body.idNumber}", "https://api.sgservices.in/videos/${path.basename(newFileName)}")`, (err, res, fields) => {
    if (err) {
      return console.log(err);
    }
    return console.log(res);
  })

  res.status(200).send({ message: "Video uploaded successfully!", file: req.file.path });
});

app.get('/', (req, res) => {
  res.status(200).send({ message: "Server is running!", timestamp: new Date().toISOString() });
});

app.listen(PORT, async (req, res) => {
  // const pool = await connectToDatabase(); // Connect to the database
  // if (!pool) {
  //   return res.status(500).send({ message: "Database connection failed" });
  // }
  // pool.query('select * from VideoData', (err, res, fields) => {
  //   if (err) {
  //     return console.log(err);
  //   }
  //   return console.log(res);
  // })
  console.log(`Server is running on http://localhost:${PORT}`);
});