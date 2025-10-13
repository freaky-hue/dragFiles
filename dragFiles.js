
"use strict";

module.exports.dragFiles = function (parent) {
    const obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.VIEWS = __dirname + '/views/'



    obj.handleAdminReq = function (req, res, user) {
        if ((user.siteadmin & 0xFFFFFFFF) == 0) {
            res.sendstatus(401);
            return;

        }

        var vars = {
            title: "AAa",
            agents: [],
            groups: []
        }


        obj.meshServer.db.GetAll((err, info) => {
            if (err) {
                console.log(err);
                vars.err = "Erro";
            }

            vars.agents = info.filter(element => element.type === "node");


            vars.groups = info.filter(element => element.type === "mesh");


            res.render(obj.VIEWS + "teste.handlebars", vars);
        });

    }




    obj.hook_webServer = function (req, res, next) {
        if (req.path === "dragfiles") {
            console.log("a")
            obj.handleAdminReq(req, res, { siteadmin: 0xFFFFFFFF })
        }
    }

    return obj;

}


