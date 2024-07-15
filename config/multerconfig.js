const multer = require('multer')
const crypto = require('crypto')
const path = require('path')
const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
            cb(null, './public/image/upload');
    },
    filename: (req, file, cb)=>{
        crypto.randomBytes(12, (err, buff)=>{
            const fn = buff.toString('hex') + path.extname(file.originalname);
            cb(null, fn);
        })
    }
})

const upload = multer({ storage: storage })
module.exports = upload;