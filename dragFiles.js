
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
            groups: [],
            test: []
        }


        obj.meshServer.db.GetAll((err, info) => {
            if (err) {
                console.log(err);
                vars.err = "Erro";
            }

            vars.agents = info.filter(element => element.type === "node");


            vars.groups = info.filter(element => element.type === "mesh");
            vars.test = obj.agent_Groups(vars.agents, vars.groups)

            res.render(obj.VIEWS + "teste.handlebars", vars);
        });

    }

    obj.agent_Groups = function (agents, groups) {
        var td = [];

        agents.forEach(element => {
            const search = groups.find(element_ => element_._id == element.meshid);
            if (search) {
                element.groupName = search.name;
                td.push(element);
            };

        })

        return td;
    }


    obj.hook_webServer = function (req, res, next) {
        if (req.path === "dragfiles") {
            console.log("a")
            obj.handleAdminReq(req, res, { siteadmin: 0xFFFFFFFF })
        }
    }




    return obj;

}


