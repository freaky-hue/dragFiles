"use strict";


module.exports.dragFiles = function (parent) {
  const obj = {};
  obj.parent = parent;
  obj.meshServer = parent.parent;
  obj.VIEWS = __dirname + '/views/';

  const path = require("path");
  const fs = require("fs");
  const utils = require("util");
  const cp = require("child_process");
  const fsPromises = require("fs/promises");
  //const os = require("os");
  let loginInfo = fs.existsSync(path.join(__dirname, "config", "config.json")) ? JSON.parse(fs.readFileSync(path.join(__dirname, "/config/config.json")).toString()) : 0;

  const exec = utils.promisify(cp.exec);
  obj.dirFiles = path.join(__dirname, "../../../meshcentral-files", "domain");



  obj.server_startup = async function () {
    obj.meshServer.webserver.app.route('/plugin/dragfiles/config')
      .post((req, res) => {
        let bodyInfo = ""
        req.on("data", async (data) => {
          bodyInfo += data.toString()
        })

        req.on("end", async () => {
          try {
            loginInfo = JSON.parse(bodyInfo);
            const testCred = await exec(`node .\\node_modules\\meshcentral\\meshctrl devicemessage --id --msg --loginuser ${loginInfo.user} --loginpass ${loginInfo.pass} `)

            if (testCred.stdout.includes("Invalid")) {
              res.status(400).send({ status: 'Error', message: "Error, invalid credentials" });

            } else {
              res.status(200).send({ status: 'OK', message: "File inserted with success" })

              if (fs.existsSync(path.join(__dirname, "config"))) {
                console.log("Exist")
                await fsPromises.writeFile(path.join(__dirname, 'config', 'config.json'), JSON.stringify(loginInfo), { flag: 'w', encoding: 'utf8' })
              } else {
                await fsPromises.mkdir(path.join(__dirname, "config"))
                  .then(async () => { await fsPromises.writeFile(path.join(__dirname, 'config', 'config.json'), JSON.stringify(loginInfo), { flag: 'w', encoding: 'utf8' }) })
              }
            }

            console.log(testCred.stdout);

          } catch (err) {
            console.log(err);

          }

        })


      })

    await obj.mainFunc();


  }


  obj.mainFunc = async function () {
    console.log("main func");

  }


  let runTask = Promise.resolve();

  obj.hook_agentCoreIsStable = function (nodeObj) {
    if (loginInfo != 0) {

      if (!nodeObj) { return };

      runTask = runTask.then(async () => {
        await obj.onAgentConnect(nodeObj);

      })
    } else {
      console.log("DragFiles -> Plugin config.json file is not created");

    }
  };

  obj.onAgentConnect = async function (agentObject) {

    const objc = {
      id: agentObject.nodeid,
      groupfolder: agentObject.dbMeshKey.replace("//", "-"),
      name: agentObject.name
    };

    await obj.onAgentConnectCheckMeshFiles(objc.id, objc.groupfolder, objc.name);
  }

  obj.onAgentConnectCheckMeshFiles = async function (agentid, groupfold, agentname) {
    try {
      const checkF = await exec(`node ./node_modules/meshcentral/meshctrl runcommand --id "${agentid}" --run "dir ${loginInfo.host_upload_folder.split("/")[0]}\\ " --loginuser "${loginInfo.user}" --loginpass "${loginInfo.pass}" --reply`);

      const rep = obj.convertToJson(checkF.stdout);
      const foldEx = rep.find((fil) => fil.Name == "meshfiles");

      if (foldEx == undefined) {
        await obj.mkMeshFiles(agentid);
      }

      await obj.checkMfFiles(agentid, groupfold, agentname);
    } catch (err) {
      console.error("dragFiles -> Err folder meshfiles:", err);
    }
  }

  obj.mkMeshFiles = async function (agentid) {
    try {
      await exec(`node ./node_modules/meshcentral/meshctrl runcommand --id "${agentid}" --run "mkdir ${loginInfo.host_upload_folder.split("/")[0]}\\meshfiles " --loginuser "${loginInfo.user}" --loginpass "${loginInfo.pass}" --reply`);
      console.log("DragFiles -> MeshFiles has been created");
    } catch (err) {
      console.error("dragFiles -> Err (creating) folder meshfiles:", err);
    }
  }

  obj.checkMfFiles = async function (agentid, groupfold, agentname) {
    try {
      const checkMF = await exec(`node ./node_modules/meshcentral/meshctrl runcommand --id "${agentid}" --run "dir ${loginInfo.host_upload_folder.split("/")[0]}\\meshfiles\\ " --loginuser "${loginInfo.user}" --loginpass "${loginInfo.pass}" --reply`);

      const rep = obj.convertToJson(checkMF.stdout);
      await obj.connectUploadFile(agentid, groupfold, rep, agentname);
    } catch (err) {
      console.error("dragFiles -> Err files:", err);
    }
  }

  obj.connectUploadFile = async function (agentid, foldername, agentfiles, agentname) {
    try {
      const groupPath = path.join(obj.dirFiles, foldername);

      if (!fs.existsSync(groupPath)) {
        console.log(`dragFiles -> Group fold doesnt exist: ${foldername}`);
        return;
      }

      const files = await fs.promises.readdir(groupPath);

      for (const file of files) {
        const filePath = path.join(groupPath, file);

        const stats = await fs.promises.stat(filePath);


        const ex = agentfiles.some((wtf) => { return wtf['Size_Bytes'] == stats.size && wtf['Name'] == file });



        if (stats.isFile()) {
          if (!ex) {
            await obj.upFiles(filePath, agentid, agentfiles, file);
          }

        } else if (stats.isDirectory() && file == agentname) {
          console.log(agentid);

          await obj.openAgentNameFolder(agentid, foldername, filePath, agentname, agentfiles);

        }
      }

      console.log(`dragFiles -> Upload has ended${agentid}`);
    } catch (err) {
      console.error(`dragFiles -> Err uploads`, err);
    }
  }

  obj.openAgentNameFolder = async function (agentid, foldername, filePath, agentname, af) {

    try {
      const fls = await fs.promises.readdir(path.join(filePath));

      if (fls) {

        for (const file of fls) {
          const stats = await fs.promises.stat(path.join(filePath, file))



          const ex = af.some((wtf) => { return wtf['Size_Bytes'] == stats.size && wtf['Name'] == file });


          // const ex = af.hasOwn()((fl) =>  fl["Size_Bytes"] == stats.size && fl["Name"] == file );


          if (!ex) {
            await obj.upFiles(path.join(filePath, file), agentid, af, file)

          }

          // if (!ex) {

          // }


        }
      }



    } catch (error) {
      console.log(`dragFiles -> Err agent name folder ${error} : ${agentid}`);

    }

  }

  obj.upFiles = async function (fileP, agentid, af, file) {
    try {
      console.log(`dragFiles -> Waiting ${file}...`);

      await exec(`node ./node_modules/meshcentral/meshctrl upload --id "${agentid}" --file "${fileP}" --target "C:\\meshfiles" --loginuser "${loginInfo.user}" --loginpass "${loginInfo.pass}"`);

      console.log(`dragFiles -> Uploaded ${file}`);
    } catch (err) {
      console.error(`dragFiles -> Err upload ${file}:`, err.message);
    }
  }





  obj.handleAdminReq = function (req, res, user) {

    if (!user || user.siteadmin !== 0xFFFFFFFF) {
      res.status(403).send("dragFiles-> Denied");
      return
    }

    res.render(obj.VIEWS + "checkConfig.handlebars", { title: "Drag Files", fileEx: fs.existsSync(path.join(__dirname, "config", "config.json")) })
  }


  obj.hook_webServer = function (req, res, next) {
    if (req.path === "/dragFiles/") {
      obj.handleAdminReq(req, res, req.session.user);
      return;
    }
    next();
  }

  obj.convertToJson = function (info) {
    const itemRegex = /(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+(\d{2}:\d{2}(?:\s*[AP]M)?)\s+((?:<DIR>)|(?:[\d\.,ÿ\s]+))\s+(.+)/i;

    return info.split(/\r?\n/)
      .map(line => {
        const match = line.trim().match(itemRegex);
        if (match) {
          const typeOrSize = match[3].trim();
          const isDirectory = typeOrSize.includes('DIR');

          return {
            Name: match[4].trim(),
            Type: isDirectory ? 'Directory' : 'File',
            Size_Bytes: isDirectory ? null : parseInt(typeOrSize.replace(/[^\d]/g, ''), 10),
            Last_Modified_Date: match[1],
            Last_Modified_Time: match[2]
          };
        }
        return null;
      })
      .filter(item => item !== null);
  }

  return obj;
};