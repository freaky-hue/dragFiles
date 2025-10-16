"use strict";


module.exports.dragFiles = function (parent) {
    const obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.args = require('minimist')(process.argv.slice(2))


    const path = require('path')
    const fs = require('fs');
    const cp = require('child_process');
    const os = require('os');

    obj.dirFiles = path.join(__dirname, '../../../meshcentral-files/domain/');



    obj.hook_agentCoreIsStable = function (nodeObj) {
        const ws = obj.meshServer.webserver.wsagents[nodeObj.dbNodeKey];


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
                {

                    const nPath = obj.dirFiles + id;

                    try {
                        if (fs.existsSync(nPath)) {

                            const files = fs.readdirSync(nPath);


                            files.forEach((file) => {
                                const nfile = path.join(nPath + "\\" + file);

                                obj.getGDevices(id, nfile)

                                // filesPath.push(path.join(nPath + "\\" + file));
                            });




                        }
                    } catch (error) {
                        console.log(error)
                    }

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
                    console.log("\n" + soloPath + " <- ->" + agent._id);

                    obj.testes(agent._id, soloPath, 'C:/',fs.statSync(soloPath).size)

                }

            })

        })
    }




    obj.testes = function (deviceId, filePath, targetPath, sizee) {
        fs.readFile(path.join(__dirname + '\\key.txt'), "utf8", (err, info) => {
            if (err) {
                console.log(err);

            }



            try {
                // const command = `node node_modules/meshcentral/meshctrl upload --id bEqEJrtv8SPx56h5xbfai8q3D6z227qlz3XHmR72HecL0guw1kOiEF7debgUhrlP --file meshcentral-files\\domain\\mesh-vNgfQV5mUA7o0w3qpPkgIMWOZ269zTTk$nRSF2Oribv4AkYthReaNgYQUCraeMpS\\-.pdf --target C:/ --loginuser ${info.split('\n')[0]} --loginpass ${info.split('\n')[1]}`;
                
                var upload = obj.check_Files(filePath, targetPath, sizee);

                if(upload){
                    console.log("Upload")
                    const command = `node node_modules/meshcentral/meshctrl upload --id ${deviceId.split('//')[1]} --file ${filePath} --target ${targetPath} --loginuser ${info.split('\n')[0]} --loginpass ${info.split('\n')[1]}`;
                    
                    
                    
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
                console.log("N upload")
            }
            } catch (errr) {
                console.log(errr);
                
            }
        });
    }


    obj.check_Files = function (file,tpath, sizee) {
        const getfilename = file.split("\\")[file.split("\\").length - 1];
        var upload = false;
        
        if(fs.existsSync(tpath + getfilename)){

            const files =  fs.statSync(tpath + getfilename)
                console.log(files.size + "->" + sizee)
                if(files.size  == sizee){
                    upload = false;
                } else {
                    upload =  true;                
                }
                
        } else{
            upload = true
        }
        return upload;
            

    }

    obj.server_startup = function (req, res, next) {
        // console.log(obj.args.user);
        readline.emitKeypressEvents(process.stdin);

        
        obj.viewFiles()



    }

    return obj;
}


