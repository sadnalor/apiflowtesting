class ApiFlowMainMenu {
    constructor(settings) {
        this.viewMode = settings.viewMode;
        this.context = settings.context;
        this.appId = settings.appId;
        this.encryptionKey = settings.encryptionKey;
        this.saveDataStorageObject = settings.saveDataStorageObject;
        this.saveManager = null;
        this.flowSelected = null;
        this.buttonId = "main-menu-button";
        this.buttonClass = "main-menu-button";
        this.loader = new LoadingIndicator();
        this.actionsMenuId = "actions-menu";
        this.noActionsTextId = "no-actions-text";
        this.settingsToolbarId = "settings-toolbar";
        this.settingsTableId = "settings-table";
        this.buttonsDivId = "buttons-div"; 
        this.buttonDivId = "button-div";
        this.buttonDivClass = "button-div";
        this.resultsPopupId = "results-popup";
        this.verticalButtonsDivId = "vertical-buttons-div"; 
        this.verticalButtonDivId = "vertical-button-div";
        this.verticalButtonDivClass = "vertical-button-div";
        this.verticalButtonId = "vertical-button";
        this.verticalButtonClass = "vertical-button";
        this.settingsMenuId = "settings-menu";
        this.actionsTableDivId = "actions-table-div";
        this.actionsTableId = "actions-table";
        this.actionsTableRowClass = "actions-table-row";
        this.actionsTableThClass = "actions-table-th";
        this.actionsTableTdClass = "actions-table-td";
        this.actionsTableSelectedRowClass = "actions-table-selected-row";
        this.buttons = {
            Create: {
                handler: this.newFlow
            },
            Edit: {
                handler: this.editFlow
            },
            Delete: {
                handler: this.deleteFlow
            },
            Migrate: {
                handler: null
            },
            Run: {
                handler: this.runSelectedFlow
            },
            "Get Code": {
                handler: null
            },
            "Go Back": {
                handler: this.showActionsMenu
            }
        }
    }

    initialize = async () => {
        console.log("init");
        this.loader.show();
        let saveManagerSettings = {
            useApiKey: false,
            apiKey: "",
            useSessionId: true,
            sessionId: null,
            endpointUrlPrefix: this.context.server.endpointUrlPrefix,
            username: "",
            password: "",
            saveFileDataType: "API Flow Save Data",
            saveDataStorageObject: this.saveDataStorageObject,
            appId: this.appId
        };
        console.trace();
        this.saveManager = new SaveManager(saveManagerSettings); 
        await this.saveManager.load();
        this.showActionsMenu();
        this.loader.hide();
    }

    deleteFlow = async e => {
        if (this.flowSelected === null) {
            let popupOptions = {
                title: "No flow selected",
                content: `<div style="padding:5px;">Please select an API flow to delete...</div>`,
                buttons: {
                    OK: {
                        handler: null
                    }        
                },
                expandStepDuration: 400,
                collapseStepDuration: 400,
                keyEvents: { //optional
                    13: {
                        handler: null
                    },
                    27: {
                        handler: null
                    }
                },
                dim: true
            },
            popup = new Popup(popupOptions);
            popup.keyEvents[13].handler = popup.collapse;
            popup.keyEvents[27].handler = popup.collapse;
            $("body").append(`<div id="no-flow-selected-error-popup" style="padding:5px;position:fixed;width:20%;height:10%;top:45%;left:40%;z-index:9000;"></div>`);
            popup.render("no-flow-selected-error-popup");
            popup.expand(e);
        } else {
            this.loader.show();
            await this.saveManager.deleteSection(this.flowSelected.id);
            delete this.saveManager.decryptedData[this.flowSelected.id];
            //$("." + this.actionsTableSelectedRowClass).removeClass(this.actionsTableSelectedRowClass);
            this.flowSelected = null;
            this.showSettingsMenu();
            this.loader.hide();
        }
    }

    showVariables = (variables, id, e) => {
        let list = this.variableList(variables, [], null);
        list = this.sortVariablesByLevel(list);
        this.genericPopup(id, this.variableSearchHtml(list, id, 9100, ""), "Variables", 80, 80, 9100, e);
    }

    variableSearchHtml = (list, id, zIndex) => {
        let filteredList = [],
        searchTerm,
        valueAsString;
        $(document).off("keyup", "#" + "variable-search-" + id).on("keyup", "#" + "variable-search-" + id, e => {
            searchTerm = $("#" + e.target.id).val().toLowerCase();
            filteredList = [];
            for (let i in list) {
                if (list[i].value === null) {
                    valueAsString = "null";
                } else {
                    valueAsString = list[i].value.toString();
                }
                if (list[i].name.toLowerCase().includes(searchTerm) || valueAsString.toLowerCase().includes(searchTerm) || list[i].type.toLowerCase().includes(searchTerm)) {
                    filteredList.push(list[i]);
                }
            }
            $("#" + "variable-list-" + id).html(this.variableListHtml(filteredList));
        });
        $(document).off("click", ".variable-name").on("click", ".variable-name", e => {
            searchTerm = $("#" + e.target.id).attr("data-id");
            $("#variable-search-" + id).val(searchTerm);
            $("#variable-search-" + id).attr("value", searchTerm);
            $("#variable-search-" + id).keyup();
/*             for (let i in list) {
                if (list[i].name.toLowerCase().includes(searchTerm)) {
                    filteredList.push(list[i]);
                }
            }
            $("#" + "variable-list-" + id).html(this.variableListHtml(filteredList)); */
        });
        return `<input class="variable-search" id="${"variable-search-" + id}" type="text" placeholder="Search variables by name, value or type..." style="text-align: center; padding: 5px;">
                <div id="${"variable-list-" + id}">${this.variableListHtml(list)}</div>`;
    }

    variableListHtml = list => {
        let html = ``,
        value,
        nameForId;
        for (let i in list) {
            nameForId = list[i].name.replace(/\./g, "-").replace(/\[/g, "").replace(/\]/g, "").replace(/\(/g, "").replace(/\)/g, "");
            value = list[i].type === "array" ? "[...]" : list[i].type === "object" ? "{...}" : list[i].value;
            html += `<br><div style="font-weight: 900;"><span class="variable-name" style="cursor: pointer;" id="${nameForId}" data-id="${list[i].name}">${list[i].name}</span> = <span style="color: #FA5F5F;">${list[i].type}</span> <span style="color: #49aad3;">${value}</span></div>`;
        } 
        return html;
    }

    variableList = (variables, list, parent) => {
        if (parent === null) {
            parent = {
                name: "",
                level: 0,
                value: null,
                type: null
            };
        }
        let type, name, variable;
        for (let i in variables) {
            type = this.variableType(variables[i]);
            name = parent.type === "object" ? parent.name + "." + i : parent.type === "array" ? parent.name + "[" + i + "]" : "" + i;
            variable = {
                name: name,
                level: parent.level + 1,
                value: variables[i],
                type: type
            }
            list.push(variable);
            if (type === "object" || type === "array") {
                list = this.variableList(variables[i], list, variable);
            }
        }
        return list;
    }

    sortVariablesByLevel = list => {
        return list.sort((a, b) => a.level - b.level);
    }

    variableType = variable => {
        switch(typeof variable) {
            case "number":
                return "number";
            case "string":
                return "string";
            case "boolean":
                return "boolean";
            case "bigint":
                return "bigint";
            case "function":
                return "function";
            case "symbol":
                return "symbol";
            case "undefined":
                return "undefined";
            case "object":
                if (variable === null) {
                    return "null";
                } else if (Array.isArray(variable)) {
                    return "array";
                } else {
                    return "object";
                }
            default: 
                return "failed to determine variable type";
        }
    }

    variableListHtmlOld = (variables, html, address) => {
        let id;
        for (let i in variables) {
            if (typeof variables[i] === "object" || Array.isArray(variables[i])) {
                id = (address + i).replace(/\./g, "-");
                html += `<br><div id="${id}" class="vertical-button" data-id="${address + i}">${i}</div><br>`;
                $(document).off("click", "#" + id).on("click", "#" + id, e => {
                    this.showVariables(variables[i], id + "-variables", e);
                });
                html = this.variableListHtml(variables[i], html, i + ".");
            } else {
                html += `<br><div class="variable-name" data-id="${address + i}">${address + i + " = " + variables[i]}</div><br>`;
            }
        }
        return html;
    }

    genericPopup = (id, content, title, width, height, zIndex, e, buttons, keyEvents, dim, expandStepDuration, collapseStepDuration) => {
        id = typeof id === "undefined" || id === null ? "generic-popup-id" : id;
        content = typeof content === "undefined" || content === null ? "" : content;
        title = typeof title === "undefined" || title === null ? "" : title;
        width = typeof width === "undefined" || width === null ? 50 : width;
        height = typeof height === "undefined" || height === null ? 50 : height;
        zIndex = typeof zIndex === "undefined" || zIndex === null ? 9000 : zIndex;
        buttons = typeof buttons === "undefined" || buttons === null ? {OK: {handler: null}} : handler;
        keyEvents = typeof keyEvents === "undefined" || keyEvents === null ? {13: {handler: null}, 27: {handler: null}} : keyEvents;
        dim = typeof dim === "undefined" || dim === null ? true : dim;
        expandStepDuration = typeof expandStepDuration === "undefined" || expandStepDuration === null ? 300 : expandStepDuration;
        collapseStepDuration = typeof collapseStepDuration === "undefined" || collapseStepDuration === null ? 300 : collapseStepDuration;
        let popupOptions = {
            title: title,
            content: `<div style="padding:5px;">${content}</div>`,
            buttons: buttons,
            expandStepDuration: expandStepDuration,
            collapseStepDuration: collapseStepDuration,
            keyEvents: keyEvents,
            dim: dim
        },
        popup = new Popup(popupOptions);
        popup.keyEvents[13].handler = popup.collapse;
        popup.keyEvents[27].handler = popup.collapse;
        $("body").append(`<div id="${id}" style="padding:5px;position:fixed;width:${width}%;height:${height}%;top:${(100 - height) / 2}%;left:${(100 - width) / 2}%;z-index:${zIndex};"></div>`);
        popup.render(id);
        popup.expand(e);
    }

    newFlow = e => {
        let popupOptions = {
            title: "Flow Builder",
            content: "",
            buttons: {
                Cancel: {
                    handler: null
                },
                "Save As": {
                    handler: null
                },
                Apply: {
                    handler: null
                },
                Save: {
                    handler: null
                },
                Test: {
                    handler: null
                },
                Variables: {
                    handler: null
                }      
            },
            expandStepDuration: 400,
            collapseStepDuration: 400,
            keyEvents: { //optional
                13: {
                    handler: null
                },
                27: {
                    handler: null
                }
            },
            dim: true
        },
        popup = new Popup(popupOptions);
        let flowBuilder = new FlowBuilderUI(this.context);
        popup.keyEvents[27].handler = popup.collapse;
        popup.buttons.Test.handler = this.partial(flowBuilder.testRunStep, flowBuilder.settings);
        popup.buttons.Save.handler = this.partial(this.saveFlow, flowBuilder.settings, popup);
        popup.buttons["Save As"].handler = this.partial(this.saveFlowAs, flowBuilder.settings, popup, flowBuilder);
        popup.buttons.Apply.handler = this.partial(this.applyChanges, flowBuilder.settings);
        popup.buttons.Cancel.handler = this.partial(this.cancelChanges, popup);
        popup.buttons.Variables.handler = this.partial(this.showVariables, flowBuilder.userVariables, "variable-review-popup-main");
        this.saveManager.decryptedData[flowBuilder.settings.id] = flowBuilder.settings;
        $("body").append(`<div id="api-flow-builder" style="position:fixed;width:99%;height:99%;top:0.5%;left:0.5%;z-index:9000;"></div>`);
        popup.render("api-flow-builder");
        flowBuilder.containingPopup = popup;
        flowBuilder.render(popup.contentDivId);
        popup.expand(e);
    }

    editFlow = e => {
        if (this.flowSelected != null) {
            let popupOptions = {
                title: "Flow Builder",
                content: "",
                buttons: {
                    Cancel: {
                        handler: null
                    },
                    "Save As": {
                        handler: null
                    },
                    Apply: {
                        handler: null
                    },
                    Save: {
                        handler: null
                    },
                    Test: {
                        handler: null
                    },
                    Variables: {
                        handler: null
                    }      
                },
                expandStepDuration: 400,
                collapseStepDuration: 400,
                keyEvents: { //optional
                    13: {
                        handler: null
                    },
                    27: {
                        handler: null
                    }
                },
                dim: true
            },
            popup = new Popup(popupOptions);
            let flowBuilder = new FlowBuilderUI(this.context);
            flowBuilder.settings = this.flowSelected;
            //popup.keyEvents[27].handler = popup.collapse;
            popup.buttons.Test.handler = this.partial(flowBuilder.testRunStep, flowBuilder.settings);
            popup.buttons.Save.handler = this.partial(this.saveFlow, flowBuilder.settings, popup);
            popup.buttons["Save As"].handler = this.partial(this.saveFlowAs, flowBuilder.settings, popup, flowBuilder);
            popup.buttons.Apply.handler = this.partial(this.applyChanges, flowBuilder.settings);
            popup.buttons.Cancel.handler = this.partial(this.cancelChanges, popup);
            popup.buttons.Variables.handler = this.partial(this.showVariables, flowBuilder.userVariables, "variable-review-popup-main");
            $("body").append(`<div id="api-flow-builder" style="position:fixed;width:99%;height:99%;top:0.5%;left:0.5%;z-index:9000;"></div>`);
            popup.render("api-flow-builder");
            flowBuilder.containingPopup = popup;
            flowBuilder.render(popup.contentDivId);
            popup.expand(e);
        } else {
            let popupOptions = {
                title: "No flow selected",
                content: `<div style="padding:5px;">Please select an API flow to edit...</div>`,
                buttons: {
                    OK: {
                        handler: null
                    }        
                },
                expandStepDuration: 400,
                collapseStepDuration: 400,
                keyEvents: { //optional
                    13: {
                        handler: null
                    },
                    27: {
                        handler: null
                    }
                },
                dim: true
            },
            popup = new Popup(popupOptions);
            popup.keyEvents[13].handler = popup.collapse;
            popup.keyEvents[27].handler = popup.collapse;
            $("body").append(`<div id="no-flow-selected-error-popup" style="position:fixed;width:20%;height:10%;top:45%;left:40%;z-index:9000;"></div>`);
            popup.render("no-flow-selected-error-popup");
            popup.expand(e);
        }
    }

    applyChanges = async flowJson => {
        this.loader.show();
        this.clearValues(flowJson);
        await this.saveManager.save(flowJson, flowJson.id);
        //await this.saveManager.load();
        //popup.collapse();
        //this.showSettingsMenu();
        this.loader.hide();
    }

    cancelChanges = async (popup) => {
        this.loader.show();
        await this.saveManager.load();
        popup.collapse();
        this.showSettingsMenu();
        this.loader.hide();
    }

    saveFlowAs = (flowJson, popup, flowBuilder) => {
        flowJson.id = this.generateUUID();
        flowJson.form["API Flow Name"].stringValue = "Copy of " + flowJson.form["API Flow Name"].stringValue;
        flowBuilder.render(popup.contentDivId);
    } 

    saveFlow = async (flowJson, popup) => {
        this.loader.show();
        this.clearValues(flowJson);
        await this.saveManager.save(flowJson, flowJson.id);
        await this.saveManager.load();
        popup.collapse();
        this.showSettingsMenu();
        this.loader.hide();
    }

    clearValues = flow => { //this will reduce the number of data objects needed to store flows
        for (let i in flow) {
            if (typeof flow[i] === "object" && i != "value") {
                this.clearValues(flow[i]);
            } else if (i === "value") {
                flow[i] = null;
            }
        }
    }

    showActionsMenu = () => {
        $("#" + this.settingsMenuId).remove();
        $("body").append(this.actionsMenu());
    }

    actionsMenu = () => {
        return `<div id="${this.actionsMenuId}">
                    ${this.viewMode === "Expanded" && this.context.currentUser.Admin ? this.settingsButton() : ""}
                    ${Object.keys(this.saveManager.decryptedData).length === 0 ? this.noActionsText() : this.actionButtonsDiv()}
                </div>`;
    }

    actionButtonsDiv = () => {
        let buttons = {}, flowJson;
        for (let i in this.saveManager.decryptedData) {
            flowJson = this.saveManager.decryptedData[i];
            buttons[flowJson.form["API Flow Name"].stringValue] = {
                handler: this.partial(this.runFlow, flowJson)
            }
        }
        return `<div id="">
                    ${this.verticalButtonsDiv(buttons)}
                </div>`; /////incomplete
    }

    runFlow = async (flow, e) => {
        this.loader.show();
        let flowExecutor = new FlowBuilderExecutor({context: this.context}, this.loader),
        results = await flowExecutor.run(flow, {}, {}, e);
        flowExecutor.textValidationError(flow.successOutput.form["Success Message"]);
        flowExecutor.textValidationError(flow.failureOutput.form["Failure Message"]);
        this.flowResultsPopup(
            "Results", 
            results.success ? 
            flow.successOutput.form["Success Message"].value : 
            flow.failureOutput.form["Failure Message"].value,
            results, 
            e
        );
        this.loader.hide();
    }

    runSelectedFlow = async e => {
        if (this.flowSelected != null) {
            this.loader.show();
            let flowExecutor = new FlowBuilderExecutor({context: this.context}, this.loader),
            results = await flowExecutor.run(this.flowSelected, {}, {}, e);
            flowExecutor.textValidationError(this.flowSelected.successOutput.form["Success Message"]);
            flowExecutor.textValidationError(this.flowSelected.failureOutput.form["Failure Message"]);
            this.flowResultsPopup(
                "Results", 
                results.success ? 
                this.flowSelected.successOutput.form["Success Message"].value : 
                this.flowSelected.failureOutput.form["Failure Message"].value, 
                results, 
                e
            );
            this.loader.hide();
        } else {
            let popupOptions = {
                title: "No flow selected",
                content: `<div style="padding:5px;">Please select an API flow to run...</div>`,
                buttons: {
                    OK: {
                        handler: null
                    }        
                },
                expandStepDuration: 400,
                collapseStepDuration: 400,
                keyEvents: { //optional
                    13: {
                        handler: null
                    },
                    27: {
                        handler: null
                    }
                },
                dim: true
            },
            popup = new Popup(popupOptions);
            popup.keyEvents[13].handler = popup.collapse;
            popup.keyEvents[27].handler = popup.collapse;
            $("body").append(`<div id="no-flow-selected-error-popup" style="position:fixed;width:20%;height:10%;top:45%;left:40%;z-index:9000;"></div>`);
            popup.render("no-flow-selected-error-popup");
            popup.expand(e);
        }
    }

    flowResultsPopup = (title, content, results, e) => {
        let popupOptions = {
            title: title,
            content: `<div style="padding:5px;">${content}</div>`,
            buttons: {
                OK: {
                    handler: null
                }        
            },
            expandStepDuration: 400,
            collapseStepDuration: 400,
            keyEvents: { //optional
                13: {
                    handler: null
                },
                27: {
                    handler: null
                }
            },
            dim: true
        },
        popup;
        if (this.context.currentUser.Admin) {
            popupOptions.buttons["Review"] = {handler: this.partial(this.reviewResults, results)};
        }
        popup = new Popup(popupOptions);
        popup.keyEvents[13].handler = popup.collapse;
        popup.keyEvents[27].handler = popup.collapse;
        $("body").append(`<div id="flow-results" style="padding:5px;position:fixed;width:60%;height:30%;top:30%;left:20%;z-index:9000;"></div>`);
        popup.render("flow-results");
        popup.expand(e);
    }



    testPopup = (e, title, response) => {
        let popupOptions = {
            title: title, 
            content: `<div style="padding:10px;box-sizing:border-box;height:100%;">${response}</div>`,
            buttons: {
                OK: {
                    handler: null
                }            
            },
            expandStepDuration: 300,
            collapseStepDuration: 300,
            keyEvents: {
                13: {
                    handler: null
                },
                27: {
                    handler: null
                }
            },
            dim: true
        },
        popup = new Popup(popupOptions);
        popup.keyEvents[13].handler = popup.collapse
        popup.keyEvents[27].handler = popup.collapse;
        $("body").append(`<div id="${this.resultsPopupId}" style="position:fixed;width:80%;height:80%;top:10%;left:10%;z-index: 9990;"></div>`);
        popup.render(this.resultsPopupId);
        popup.expand(e);
    }
    
    reviewResults = (results, e) => {
        if (results.success) {
            this.testPopup(e, "API flow succeeded. Results below.", `<textarea style="width:100%;height:100%;resize:none;">` + JSON.stringify(results.responses, null, 2) + `</textarea>`);
        } else {
            this.testPopup(e, "API flow failed. Results below.", `<textarea style="width:100%;height:100%;resize:none;">` + JSON.stringify({successfulSteps: results.responses, failedStep: results.errors}, null, 2) + `</textarea>`);
        }
    }

    settingsButton = () => {
        return this.button("Settings", this.showSettingsMenu);
    }

    button = (index, handler) => {        
        $(document).off("click", "#" + index.replace(/ /g, "") + "-" + this.buttonId).on("click", "#" + index.replace(/ /g, "") + "-" + this.buttonId, e => {
            handler(e);
        });
        return `<div id="${index.replace(/ /g, "") + "-" + this.buttonId}" class="${this.buttonClass}">${index}</div>`;
    }

    noActionsText = () => {
        return `<div id="${this.noActionsTextId}">No actions found. Please contact your administrator for assistance.</div>`;
    }

    showSettingsMenu = () => {
        $("#" + this.actionsMenuId).remove();
        $("#" + this.settingsMenuId).remove();
        $("body").append(this.settingsMenu());
    }

    settingsMenu = () => {
        return `<div id="${this.settingsMenuId}">
                    ${this.settingsTable()}
                    ${this.settingsToolbar()}
                </div>`;
    }

    settingsToolbar = () => {
        return `<div id="${this.settingsToolbarId}">${this.buttonsDiv()}</div>`;
    }

    settingsTable = () => {
        $(document).off("click", ".actions-table-row").on("click", ".actions-table-row", e => {
            this.rowClickHandler(e);
        });
        return `<div id="${this.settingsTableId}">
                    ${Object.keys(this.saveManager.decryptedData).length === 0 ? this.noActionsText() : this.table()}
                </div>`;
    }

    rowClickHandler = e => {
        let htmlElement = $("#" + e.target.id),
        flowId = htmlElement.attr("data-id");
        this.flowSelected = this.saveManager.decryptedData[flowId];
        $("." + this.actionsTableSelectedRowClass).removeClass(this.actionsTableSelectedRowClass);
        htmlElement.parent().addClass(this.actionsTableSelectedRowClass);
    }

    table = () => {
        return `<div id="${this.actionsTableDivId}">
                    <table id="${this.actionsTableId}">
                        ${this.tableRows()}
                    </table>
                </div>`; //to implement
    }

    tableRows = () => {
        let html = `<tr>
                        <th class="${this.actionsTableThClass}">Name</th>
                        <th class="${this.actionsTableThClass} last-column">Created On</th>
                    </tr>`;
        for (let i in this.saveManager.decryptedData) {
            html += this.tableRow(i, this.saveManager.decryptedData[i]);
        }
        return html;
    }

    tableRow = (index, rowData) => {
        return `<tr id="${this.actionsTableRowClass + index}" class="${this.actionsTableRowClass}" data-id="${index}">
                    <td id="${"name" + index}" class="${this.actionsTableTdClass}" data-id="${index}">${rowData.form["API Flow Name"].stringValue}</td>
                    <td id="${"createdon" + index}" class="${this.actionsTableTdClass}  last-column" data-id="${index}">${rowData.createdOn}</td>
                </tr>`;
    }



    verticalButton = (index, handler) => {        
        let idCompatibleIndex = index.replace(/ /g, "").replace(/\'/g, "").replace(/\(/g, "").replace(/\)/g, "");
        $(document).off("click", "#" + idCompatibleIndex + "-" + this.verticalButtonId).on("click", "#" + idCompatibleIndex + "-" + this.verticalButtonId, e => {
            handler(e);
        });
        return `<div id="${idCompatibleIndex + "-" + this.verticalButtonId}" class="${this.verticalButtonClass}" data-id="${index}">${index}</div>`;
    }

    verticalButtonDiv = (index, button) => {
        return `<div id="${this.verticalButtonDivId + index}" class="${this.verticalButtonDivClass}">${this.verticalButton(index, button.handler)}</div>`;
    }

    verticalButtonsDiv = (buttons) => {
        if (typeof buttons === "undefined") {
            return "";
        } else {
            let html = `<div id="${this.verticalButtonsDivId}">`;
            for (let i in buttons) {
                html += this.verticalButtonDiv(i, buttons[i]);
            }
            html += `</div>`;
            return html;
        }
    }

    buttonDiv = (index, button) => {
        return `<div id="${this.buttonDivId + index}" class="${this.buttonDivClass}">${this.button(index, button.handler)}</div>`;
    }

    buttonsDiv = () => {
        if (typeof this.buttons === "undefined") {
            return "";
        } else {
            let html = `<div id="${this.buttonsDivId}">`;
            for (let i in this.buttons) {
                html += this.buttonDiv(i, this.buttons[i]);
            }
            html += `</div>`;
            return html;
        }
    }

        generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    partial(func /*, 0..n args */) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function() {
            var allArguments = args.concat(Array.prototype.slice.call(arguments));
            return func.apply(this, allArguments);
        };
    }

}


const main = async () => {
    let clarizenSettings = {
        viewMode: "Expanded",
        context: {
            currentObject: GLOBAL_VARS.context.currentObject,
            currentUser: GLOBAL_VARS.context.currentUser,
            server: GLOBAL_VARS.context.server,
            organization: GLOBAL_VARS.context.server
        },
        appId: GLOBAL_VARS.context.appId,
        encryptionKey: GLOBAL_VARS.context.encryptionKey,
        saveDataStorageObject: GLOBAL_VARS.context.saveDataStorageObject
    },
    mainMenu = new ApiFlowMainMenu(clarizenSettings);
    await mainMenu.initialize();
}

function partial(func /*, 0..n args */) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function() {
        var allArguments = args.concat(Array.prototype.slice.call(arguments));
        return func.apply(this, allArguments);
    };
}

const GLOBAL_VARS = {};
GLOBAL_VARS.context = {
  "currentObject": API.Context.getData().currentObject,
  "currentUser": API.Context.getData().currentUser,
  "server": {
    "endpointUrlPrefix": API.Context.getData().serverUrl,
    "sessionId": API.Context.getData().sessionId
  },
  "organization": {
    "Name": API.Context.getData().organizationName,
    "ExternalId": API.Context.getData().organizationId
  },
  "appId": API.Context.getData().appUniqueId,
  "encryptionKey": API.Context.getData().encryptionKey,
  "saveDataStorageObject": API.Context.getData().dataObjectStorageLocation
}

console.log("vars passed:", GLOBAL_VARS.context);


main();