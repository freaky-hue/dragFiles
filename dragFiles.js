
"use strict";

module.exports.dragFiles = function (parent) {
    const obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.VIEWS = __dirname + '/views/'





    obj.handleAdminReq = function (req, res, user) {
        if ((user.siteadmin & 0xFFFFFFFF) == 0) {
            res.sendStatus(401);
            return;

        }

        var vars = {
            title: "AAa",
            agents: [],
            groups: [],
            groupInfo: []
        }


        obj.meshServer.db.GetAll((err, info) => {
            if (err) {
                console.log(err);
                vars.err = "Erro";
            }

            vars.agents = info.filter(element => element.type === "node");

            vars.groups = info.filter(element => element.type === "mesh");

            vars.groupInfo = obj.group_agents(vars.agents, vars.groups);

            res.render(obj.VIEWS + "teste.handlebars", vars);
        });

    }

    obj.group_agents = function (agents, groups) {
        var infoAG = [];
        groups.forEach(group => {
            var agentOGroup = agents.filter(agent => agent.meshid === group._id)


            if (agentOGroup.length > 0) {
                infoAG.push({
                    groupId: group._id,
                    groupName: group.name,
                    agents: agentOGroup
                })
            }
        });

        return infoAG;
    }






    obj.hook_webServer = function (req, res, next) {
        if (req.path === "dragfiles") {
            console.log("a")
            obj.handleAdminReq(req, res, { siteadmin: 0xFFFFFFFF })
        } else {
            next
        }
    }


    return obj;

}


