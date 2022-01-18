import fetch from "node-fetch";
import download from "image-downloader";
import fs from "fs";

process.on("unhandledRejection", (err) => {
    return console.log("UnhandledRejection: " + err.message.replace(/\n/g, " "));
});
process.on("unhandledException", (err) => {
    return console.log("UnhandledException: " + err.message.replace(/\n/g, " "));
});

var log;

var imagesPerLog = process.argv[2] != undefined ? parseInt(process.argv[2]) : 25;
var imageCount = 0;

getDirs("./images/", dirs => {

    if (dirs.length === 0) {
        log = 1;
        fs.mkdirSync("./images/log1");
    }else {
        for (var i=0; i<dirs.length; i++) {
            dirs[i] = parseInt(dirs[i].split("log")[1]);
        }

        dirs.sort(function(a, b) { return b-a });

        log = (dirs[0] + 1);
        fs.mkdirSync("./images/log" + log);
    }
    
    console.log("Dumping " + imagesPerLog + " images in images/log" + log + "...\n------------------------------------");

    getImages();

});

async function getImages() {

    if (imageCount >= imagesPerLog) {
        console.log("------------------------------------\nFolder images/log" + log + " successfully filled with " + imageCount + " images");
        return process.exit();
    };

    var id = generateId();

    var response = await fetch("https://prnt.sc/" + id);
    var body = await response.text();
    var url = body.slice(body.indexOf("screenshot-image\" src=\"") + 23, body.indexOf("alt=\"Lightshot screenshot") - 26);

    if (url.includes("<") || url.includes(">")) return getImages();
    if (url.startsWith("//")) url = "https:" + url;

    var downloaded = false;
    getDirs("./images/", dirs => {
        for (var i=0; i< dirs.lenght; i++) {
            fs.readdir("./images/log" + i, (files) => {
                for (file in files) {
                    if (file.split(".")[0] === id) downloaded = true;
                }
            });
        }

        if (downloaded) {
            console.log("Image with ID \"" + id + "\" already downloaded");
            return getImages();
        }

        download.image({ url: url, dest: "./images/log" + log, fileName: id }).then(({ filename }) => {
            console.log((imageCount + 1) + ": ID " + id + ", saved as", filename.split("\\")[2]);
            imageCount++;
        }).catch((err) => { console.log("Couldn't fetch image with ID \"" + id + "\": " + err.message.replace(/\n/g, " ")); return getImages(); });

        getImages();
    });
}

async function getDirs(rootDir, cb) { 
    fs.readdir(rootDir, function(err, files) {
        var dirs = [];
        if (files.length === 0) return cb([]);
        for (var index = 0; index < files.length; ++index) { 
            var file = files[index];
            if (file[0] !== '.') { 
                var filePath = rootDir + '/' + file; 
                fs.stat(filePath, function(err, stat) {
                    if (stat.isDirectory()) { 
                        dirs.push(this.file); 
                    } 
                    if (files.length === (this.index + 1)) { 
                        return cb(dirs); 
                    }
                }.bind({index: index, file: file})); 
            }
        }
    });
}

function generateId() {
    var length = 6;
    var chars = "abcdefghijklmnopqrstuvwxyz1234567890";
    var result = "";

    for (var i=0; i<length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }

    return result;
}