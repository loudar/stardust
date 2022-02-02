const express = require('express')
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

async function startup(){
    let fileArray = await getFiles(__dirname + "/sounds");
    fileArray = fileArray.map(file => file.substr((__dirname + "/sounds/").length));

    app.use("/sounds", express.static('sounds/*'));
    app.use(express.static('.'));

    app.get("/sounds", (req, res) => {
        res.send(JSON.stringify(fileArray));
    });

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    });
}

startup();


