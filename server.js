const express = require('express')
const colors = require('colors/safe');
const app = express()
const port = 3000

const { promisify } = require('util');
const { resolve } = require('path');
const fs = require('fs');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function getFiles(dir) {
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = resolve(dir, subdir);
        return (await stat(res)).isDirectory() ? getFiles(res) : res;
    }));
    return files.reduce((a, f) => a.concat(f), []);
}

async function getFilesOfType(dir, filetype) {
    let fileArray = await getFiles(__dirname + "/" + dir);
    fileArray = fileArray.map(file => file.substr((__dirname + "/" + dir + "/").length));
    let files = [];
    for(file of fileArray) {
        if (file.substr(-filetype.length, filetype.length) === filetype) {
            files.push(file);
        }
    }
    return files;
}

async function startup(){
    console.log("Fetching audio files...");
    let audioFiles = await getFilesOfType("sounds", "mp3");
    console.log("Fetching model files...");
    let modelFiles = await getFilesOfType("models", "obj");

    app.use("/sounds", express.static('sounds/*'));
    app.use("/models", express.static('models/*'));
    app.use(express.static('.'));

    app.get("/sounds", (req, res) => {
        res.send(JSON.stringify(audioFiles));
        console.log("Sent a list of "+audioFiles.length+" audio files.");
    });
    app.get("/models", (req, res) => {
        res.send(JSON.stringify(modelFiles));
        console.log("Sent a list of "+modelFiles.length+" model files.");
    });

    app.listen(port, () => {
        let text = "Listening on port ";
        console.log(text + colors.yellow(port.toString()));
    });
}

startup();