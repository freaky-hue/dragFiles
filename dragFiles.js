"use strict";

module.exports.dragFiles = function (parent) {
    const obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;

    const path = require("path");
    const fs = require("fs");
    const utils = require("util");
    const cp = require("child_process");
    const os = require("os");

    const config = JSON.parse(
        fs.readFileSync(path.join(__dirname, "config", "config.json"))
    );

    const exec = utils.promisify(cp.exec);
    obj.dirFiles = path.join(__dirname, "../../../meshcentral-files", "domain");

    obj.mainFunc = async function (dir) {
        const info = await new Promise((resolve, reject) => {
            obj.meshServer.db.GetAll((err, info) => {
                resolve(info);
            
            });
        });

        const agents = info.filter(
            (td) => td.type == "node" && td.meshid == String(dir).replace("-", "//")
        );

        for (const agent of agents) {
            await obj.checkMeshFilesEx(agent._id, dir);
        }
    };

    obj.checkMeshFilesEx = async function (agent_id, dir) {
        const agentid = agent_id.split("//")[1];
        const com = await exec(
            `node node_modules/meshcentral/meshctrl runcommand --id "${agentid}" --run "powershell ls ${config.agent_root}" --reply --loginuser "${config.user}" --loginpass "${config.pass}" `
        );

        const stdout = com.stdout;

        const stdoutSep = obj.parsePowerShellOutput(stdout);

        const exD = stdoutSep.some(
            (ex) => ex.type === "directory" && ex.name === "meshfiles"
        );

        if (!exD) {
            await obj.makeFoldMeshFiles(agentid);
        }

        console.log("meshfiles lctd");

        await obj.checkMeshFilesFiles(agentid, dir);
    };

    obj.checkMeshFilesFiles = async function (agentid, dir) {
        try {
            const com = await exec(
                `node node_modules/meshcentral/meshctrl runcommand --id "${agentid}" --run "powershell ls ${config.host_upload_folder}" --reply --loginuser "${config.user}" --loginpass "${config.pass}" `
            );
            const res = obj.parsePowerShellOutput(com.stdout);

            try {
                const nPath = path.join(obj.dirFiles, dir);

                try {
                    const files = fs.readdirSync(nPath);

                    for (const file of files) {
                        const filePath = path.join(nPath, file);
                        const fileStats = fs.statSync(filePath);

                        const exFile = res.some(
                            (fe) => fe.name === file && fe.size === fileStats.size
                        );

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
    };

    obj.uploadFile = async function (agentid, filePath) {
        const com = await exec(
            `node node_modules/meshcentral/meshctrl upload --id "${agentid}" --file "${filePath}" --target "${config.host_upload_folder}" --loginuser "${config.user}" --loginpass "${config.pass}"`
        );
        com.stdout;
    };

    obj.makeFoldMeshFiles = async function (agentid) {
        const com = await exec(
            `node node_modules/meshcentral/meshctrl runcommand --id "${agentid}" --run "powershell mkdir ${config.host_upload_folder}" --loginuser "${config.user}" --loginpass "${config.pass}"`
        );
        await new Promise((r) => setTimeout(r, 1000));
        com.stdout;
    };

    let lastTask = Promise.resolve();

    obj.hook_agentCoreIsStable = function (nodeObj) {
        if (!nodeObj) return;

        lastTask = lastTask
            .then(async () => {
                await obj.checkAgentMeshFiles(nodeObj.nodeid, nodeObj.meshid);
            })
            .catch((err) => console.error(err));
    };

    obj.server_startup = async function () {
        let delay = null;

        try {
            fs.watch(obj.dirFiles, (ev, dirr) => {
                if (delay) {
                    clearTimeout(delay);
                }

                delay = setTimeout(() => {
                    obj.mainFunc(dirr);
                }, 100);
            });
        } catch (error) {
            console.log(error);
        }
    };

    obj.checkAgentMeshFiles = async function (agentid, groupid) {
        try {
            const com = await exec(
                `node node_modules/meshcentral/meshctrl runcommand --id "${agentid}" --run "powershell ls ${config.agent_root}" --reply --loginuser "${config.user}" --loginpass "${config.pass}" `
            );

            const info = obj.parsePowerShellOutput(com.stdout);

            const meshFExists = info.some(
                (ex) => ex.type === "directory" && ex.name === "meshfiles"
            );

            console.log(meshFExists);

            if (!meshFExists) {
                await new Promise((r) => setTimeout(r, 2000));

                await obj.makeAgentMeshFiles(agentid, groupid);
            }

            await obj.checkMeshFilesFiles(agentid, "mesh-" + groupid);
        } catch (err) {
            console.log(err);
        }
    };

    obj.makeAgentMeshFiles = async function (agentid, groupid) {
        try {
            if (fs.existsSync(path.join(obj.dirFiles, "mesh-" + groupid))) {
                const com = await exec(
                    `node node_modules/meshcentral/meshctrl runcommand --id "${agentid}" --run "powershell mkdir ${config.host_upload_folder}" --reply --loginuser "${config.user}" --loginpass "${config.pass}" `
                );
                await new Promise((r) => setTimeout(r, 1000));

                com.stdout;
            }
        } catch (err) {
            console.log(err);
        }
    };

    obj.parsePowerShellOutput = function (output) {
        return output
            .split("\n")
            .map((line) => line.trim())
            .filter(
                (line) =>
                    line &&
                    !line.startsWith("Mode") &&
                    !line.startsWith("----") &&
                    !line.startsWith("Directory") &&
                    !line.startsWith("Microsoft Windows") &&
                    !line.startsWith("(c)") &&
                    !line.includes(">") &&
                    !line.includes("exit")
            )
            .map((line) => {
                const parts = line.split(/\s+/);
                const typeChar = parts[0]?.[0] ?? "f";
                return {
                    type: typeChar === "d" ? "directory" : "file",
                    date: parts[1],
                    time: parts[2],
                    size: typeChar === "d" ? null : parseInt(parts[3], 10),
                    name: parts.slice(typeChar === "d" ? 3 : 4).join(" "),
                };
            });
    };

    return obj;
};
