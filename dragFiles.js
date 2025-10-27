"use strict";

module.exports.dragFiles = function (parent) {
    const obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;

<<<<<<< HEAD

=======
    obj.args = require('minimist')(process.argv.slice(2));
>>>>>>> 5a148bad10f4ce0536bc446c8ac1f357a717a596
    const path = require('path');
    const fs = require('fs');
    const utils = require('util')
    const cp = require('child_process');
<<<<<<< HEAD
    const os = require('os')


    const exec = utils.promisify(cp.exec);
    obj.dirFiles = path.join(__dirname, "../../../meshcentral-files", "domain");
=======
    const os = require('os');


    if (os.platform == "win32") {

        obj.dirFiles = path.join(__dirname, '../../../meshcentral-files/domain/');



        obj.hook_agentCoreIsStable = function (nodeObj) {
>>>>>>> 5a148bad10f4ce0536bc446c8ac1f357a717a596

            const ws = obj.meshServer.webserver.wsagents[nodeObj.dbNodeKey];

<<<<<<< HEAD
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
=======
            fs.watch(obj.dirFiles, (err, info) => {
                if (info) {
                    obj.viewFiles();

                }
            })



            // console.log(ws);



        }


        obj.viewFiles = function () {
            try {
                const exists = fs.existsSync(obj.dirFiles);

                if (exists) {
                    console.log('Pasta (domain) dos ficheiros? encontrada');

                } else {
                    console.log('N enc');

                }
            } catch (error) {
                console.log(error);
            }

            const idsGroup = [];
            var filesPath = [];

            obj.meshServer.db.GetAll((err, allInfo) => {
                if (err) {
                    console.log(err);

                }


                allInfo.forEach(element => {
                    if (element.type == "mesh") {
                        const group_id = String(element._id);
                        const group_id_dir = group_id.replace("//", "-");
                        idsGroup.push(group_id_dir);
                    }
                });

                idsGroup.forEach((id) => {


                    const nPath = obj.dirFiles + id;

                    try {
                        if (fs.existsSync(nPath)) {

                            const files = fs.readdirSync(nPath);


                            files.forEach((file) => {
                                const nfile = path.join(nPath + "\\" + file);

                                obj.getGDevices(id, nfile);

                                // filesPath.push(path.join(nPath + "\\" + file));
                            });




                        }
                    } catch (error) {
                        console.log(error)
                    }

                });




            });
        }

        obj.hook_userLoggedIn = function (a) {
            // console.log(a);

        }


        obj.getGDevices = function (groupid, soloPath) {
            const id = String(groupid).replace("-", "//");
            // console.log("->" + id + " -> " + soloPath);

            obj.meshServer.db.GetAll((err, agents) => {
                if (err) {
                    console.log(err);

                }
                agents.forEach((agent) => {
                    if (agent.type == "node" && agent.meshid == id) {
                        // console.log("\n" + soloPath + " <- ->" + agent._id);



                        obj.testes(agent._id, soloPath, path.parse(process.cwd()).root, fs.statSync(soloPath).size);



                    }

                })

            })
        }
>>>>>>> 5a148bad10f4ce0536bc446c8ac1f357a717a596


    obj.checkMeshFilesEx = async function (agent_id, dir) {
        const agentid = agent_id.split("//")[1];
        const com = await exec(`node node_modules/meshcentral/meshctrl runcommand --id ${agentid} --run "powershell ls C:/" --reply`);

        const stdout = com.stdout;

        const stdoutSep = obj.parsePowerShellOutput(stdout);


<<<<<<< HEAD

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

=======
        obj.testes = function (deviceId, filePath, targetPath, sizee) {
            fs.readFile(path.join(__dirname + '\\key.txt'), "utf8", (err, info) => {
                if (err) {
                    console.log(err);

                }



                try {
                    // const command = `node node_modules/meshcentral/meshctrl upload --id bEqEJrtv8SPx56h5xbfai8q3D6z227qlz3XHmR72HecL0guw1kOiEF7debgUhrlP --file meshcentral-files\\domain\\mesh-vNgfQV5mUA7o0w3qpPkgIMWOZ269zTTk$nRSF2Oribv4AkYthReaNgYQUCraeMpS\\-.pdf --target C:/ --loginuser ${info.split('\n')[0]} --loginpass ${info.split('\n')[1]}`;

                    var nTarget = obj.mkdirIfNotExists(targetPath)

                    var upload = obj.check_Files(filePath, nTarget, sizee);

                    if (upload) {
                        console.log("Upload");
                        const command = `node node_modules/meshcentral/meshctrl upload --id ${deviceId.split('//')[1]} --file ${filePath} --target ${nTarget} --loginuser ${info.split('\n')[0]} --loginpass ${info.split('\n')[1]}`;



                        setTimeout(() => {
                            cp.exec(command, (error, stdout, stderr) => {
                                if (error) {
                                    console.error(`exec error: ${error}`);
                                    return;
                                }
                                if (stderr) {
                                    console.error(`stderr: ${stderr}`);
                                    return;
                                }

                                try {
                                    const res = stdout;
                                    console.log('Resultado:', res);
                                } catch (e) {
                                    console.error('Failed :', e);
                                }
                            });
                        }, 4000);



                    } else {
                        console.log("N upload");
                    }
                } catch (errr) {
                    console.log(errr);

                }
            });
        }

        obj.check_Files = function (file, tpath, sizee) {
            const getfilename = file.split("\\")[file.split("\\").length - 1];
            var upload = false;

            if (fs.existsSync(tpath + getfilename)) {
                const files = fs.statSync(tpath + getfilename);

                console.log(files.size + "->" + sizee);
                if (files.size == sizee) {
                    upload = false;
                } else {
                    upload = true;
                }

            } else {
                console.log(getfilename + "->" + sizee);
                upload = true;
            }


            return upload;


        }

        obj.mkdirIfNotExists = function (targetP) {
            if (fs.existsSync(targetP + "meshfiles")) {
                return path.join(targetP + "meshfiles/")

            } else {

                try {
                    fs.mkdirSync(targetP + "meshfiles/");
                    return path.join(targetP + "meshfiles/")
>>>>>>> 5a148bad10f4ce0536bc446c8ac1f357a717a596


                } catch (err) {
                    console.log(err);

                }

            }

        }


        obj.server_startup = function (req, res, next) {
            console.log('Plugin Ligado');

            // console.log(Object.keys(obj.meshServer.db));


        }

        return obj;
    }


<<<<<<< HEAD

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
=======
}
>>>>>>> 5a148bad10f4ce0536bc446c8ac1f357a717a596
