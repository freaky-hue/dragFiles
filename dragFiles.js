"use strict";

module.exports.dragFiles = function (parent) {
    const obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;


    const path = require('path');
    const fs = require('fs');
    const utils = require('util')
    const cp = require('child_process');
    const os = require('os')


    const exec = utils.promisify(cp.exec);
    obj.dirFiles = path.join(__dirname, "../../../meshcentral-files", "domain");


    obj.mainFunc = async function (dir) {
        const info = await new Promise((resolve, reject) => {
            obj.meshServer.db.GetAll((err, info) => {
                resolve(info);

            })
        });


        const agents = info.filter(td => td.type == "node" && td.meshid == String(dir).replace("-", "//"));

        for (const agent of agents) {
            await obj.checkMeshFilesEx(agent._id, dir);

        }
    }


    obj.checkMeshFilesEx = async function (agent_id, dir) {
        const agentid = agent_id.split("//")[1];
        const com = await exec(`node node_modules/meshcentral/meshctrl runcommand --id ${agentid} --run "powershell ls C:/" --reply`);

        const stdout = com.stdout;

        const stdoutSep = obj.parsePowerShellOutput(stdout);



        const exD = stdoutSep.some(ex => ex.type == "directory" && ex.name == "meshfiles");

        if (!exD) {
            await obj.makeFoldMeshFiles(agentid);

        }

        console.log("meshfiles lctd");

        await obj.checkMeshFilesFiles(agentid, dir);



    }

    obj.checkMeshFilesFiles = async function (agentid, dir) {
        try {

            const com = await exec(`node node_modules/meshcentral/meshctrl runcommand --id ${agentid} --run "powershell ls C:/meshfiles" --reply `);
            const res = obj.parsePowerShellOutput(com.stdout);

            try {
                const nPath = path.join(obj.dirFiles, dir)

                try {

                    const files = fs.readdirSync(nPath);



                    for (const file of files) {
                        const filePath = path.join(nPath, file)
                        const fileStats = fs.statSync(filePath);




                        const exFile = res.some(fe => fe.name == file && fe.size == fileStats.size);


                        if (!exFile) {
                            await obj.uploadFile(agentid, filePath);

                        }
                    }

                } catch {
                    console.log("VAZIO");

                }





            } catch (err) {
                console.log(err);

            }

        } catch (err) {
            console.log(err);

        }

    }

    obj.uploadFile = async function (agentid, filePath) {

        const com = await exec(`node node_modules/meshcentral/meshctrl upload --id ${agentid} --file ${filePath} --target C:/meshfiles`)
        com.stdout;
    }

    obj.makeFoldMeshFiles = async function (agentid) {
        const com = await exec(`node node_modules/meshcentral/meshctrl runcommand --id ${agentid} --run "powershell mkdir C:/meshfiles" `);
        await new Promise(r => setTimeout(r, 1000));
        com.stdout;
    }


    obj.hook_agentCoreIsStable = async function (nodeObj) { }

    obj.server_startup = async function () {
        let delay = null
        await obj.hook_agentCoreIsStable();

        try {

            fs.watch(obj.dirFiles, (ev, dirr) => {


                if (delay) {
                    clearTimeout(delay)
                }

                delay = setTimeout(() => {
                    obj.mainFunc(dirr);
                }, 100)



            })
        } catch (error) {
            console.log(error);

        }



    }



    obj.parsePowerShellOutput = function (output) {
        return output
            .split("\n")
            .map(line => line.trim())
            .filter(line =>
                line &&
                !line.startsWith("Mode") &&
                !line.startsWith("----") &&
                !line.startsWith("Directory") &&
                !line.startsWith("Microsoft Windows") &&
                !line.startsWith("(c)") &&
                !line.includes(">") &&
                !line.includes("exit")
            )
            .map(line => {
                const parts = line.split(/\s+/);
                const typeChar = parts[0]?.[0] ?? "f";
                return {
                    type: typeChar === "d" ? "directory" : "file",
                    date: parts[1],
                    time: parts[2],
                    size: typeChar === "d" ? null : parseInt(parts[3], 10),
                    name: parts.slice(typeChar === "d" ? 3 : 4).join(" ")
                };
            });
    }


    return obj;
}