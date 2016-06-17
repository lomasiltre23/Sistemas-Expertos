var app = angular.module("app",["ngRoute", "ngAnimate"]);

app.config(["$routeProvider", function (rp) {
    rp
        .when("/dictionary", {templateUrl: "templates/dictionary.html", controller: "DictionaryCtrl"})
        .when("/rules", {templateUrl: "templates/rules.html", controller: "RulesCtrl"})
        .when("/findFo", {templateUrl: "templates/findForward.html", controller: "FindForward"})
        .when("/findBack", {templateUrl: "templates/findBack.html", controller: "FindBack"})
        .when("/arbol", {templateUrl: "templates/arbol.html", controller: "AlfaBeta"})
        .otherwise({redirectTo: "/dictionary"});
}]);

app.controller("NavCtrl",["$scope","$location", function (s, l) {
    s.headerTitle = "Sistemas Expertos";
    s.navContent = [
        {
            label: "Diccionario",
            myclass: "collection-item active",
            link: "#/dictionary"
        },
        {
            label: "Reglas",
            myclass: "collection-item",
            link: "#/rules"
        },
        {
            label: "Busqueda Adelante",
            myclass: "collection-item",
            link: "#/findFo"
        },
        {
            label: "Busqueda Atras",
            myclass: "collection-item",
            link: "#/findBack"
        },
        {
            label: "Arbol",
            myclass: "collection-item",
            link: "#/arbol"
        }
    ];

    s.isActive = function(path) {return ( "#"+l.path() == path );}
}]);

app.controller("DictionaryCtrl",["$scope","$http", function (s,http) {
    s.dictionaryContent = {
        pageTitle: "Diccionario",
        leftTitle: "Agregar Preposicion",
        rightTitle: "Preposiciones",
        identifierLabel: "Identificador",
        valueLabel: "Valor",
        submitButton: "Agregar"
    };
    s.id = 0;
    s.identifier = "";
    s.value = "";
    s.dictionary = [];
    s.preposition = {};

    function exist(prep){
        for(var i = 0; i < s.dictionary.length; i++)
            if(prep.identifier == s.dictionary[i].identifier || prep.value == s.dictionary[i].value)
                return true;
        return false;
    }

    function saveData(data) {
        var json = JSON.stringify(data);
        var r = new XMLHttpRequest();
        r.open("POST", "/saveDictionary", true);
        r.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        r.send("dictionary=" + json);
    }

    s.initialize = function() {
        http.get("/getDictionary").then(function (response) {
            if(response.data != "") s.dictionary = response.data;
        }, function (response) {
            console.log("Error: " , response);
        });
    };

    s.addPreposition = function () {
        if(!exist({identifier: s.identifier, value: s.value})) {
            s.id = s.dictionary.length > 0 ? s.dictionary[s.dictionary.length - 1].id + 1 : 1;
            s.preposition.id = s.id;
            s.preposition.identifier = s.identifier;
            s.preposition.value = s.value;
            s.dictionary.push(s.preposition);

            saveData(s.dictionary);

            setTimeout(function () {
                s.id = 0;
                s.identifier = "";
                s.value = "";
                s.preposition = {};
                s.$apply();
                $('#leftColumn form label').removeClass('active');
            }, 100);
        }
        else
        {
            alert("Ya existe una preposicion igual o parecida.");
        }

    };
    
    s.removeElement = function (index) {
        s.dictionary.splice(index, 1);
        saveData(s.dictionary);
    };

}]);

app.controller("RulesCtrl",["$scope","$http", "$location", function (s, http, loc) {
    s.pageContent = {
        pageTitle: 'Reglas',
        leftColTitle: 'Agregar regla',
        rightColTitle: 'Conjunto de reglas',
        rightColTitle2: 'Conjunto de reglas Normalizadas',
        labelRule: 'Regla',
        submitButton: "Agregar"
    };

    s.id = 0;
    s.atoms = [];
    s.rules = [];
    s.rule = {};
    s.nRules = [];
    s.nRAtoms = "";
    s.pPrepositions = "";
    s.pConsecuent = "";
    s.prepositions = [];
    s.consecuent = {};

    function saveData(data)
    {
        var json = JSON.stringify(data);
        var r = new XMLHttpRequest();
        r.open("POST", "/saveRules", true);
        r.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        r.send("rules=" + json);
    }

    function deletePreposition(identifier)
    {
        for(var i = 0; i < s.prepositions.length; i++)
        {
            if(s.prepositions[i].identifier == identifier) {
                s.prepositions.splice(i, 1);
                break;
            }
        }
    }

    function stringifyPrepositions()
    {
        s.pPrepositions = "";
        for( var i = 0; i < s.prepositions.length; i++ )
        {
            if(i > 0) s.pPrepositions += " ^ ";
            s.pPrepositions += s.prepositions[i].id > 0 ? s.prepositions[i].identifier : "¬" + s.prepositions[i].identifier;
        }
    }

    s.initialize = function () {
        http.get("/getDictionary").then(function (response) {
            if(response.data != "") s.atoms = response.data;
        }, function (response) {
            console.log("Error: " , response);
        });
        http.get("/getRules").then(function (response) {
            if(response.data != "")
            {
                s.rules = response.data;
                var newRules = [];
                angular.copy(s.rules, newRules);
                for (var i = 0; i < newRules.length; i++) {
                    normalizeRule(newRules[i]);
                }
            }
        }, function (response) {
            console.log("Error: " , response);
        });
    };

    function normalizeRule(rule)
    {
        var atoms = [];
        for(var i = 0; i < rule.prepositions.length; i++)
        {
            rule.prepositions[i].id *= -1;
            atoms.push(rule.prepositions[i]);
        }
        atoms.push(rule.consecuent);
        s.nRules.push(atoms);
    }

    s.stringifyNRule = function(rule)
    {
        var sRule ="";
        for(var i = 0; i < rule.length; i++)
        {
            if(i != 0) sRule += " v ";
            if(rule[i].id > 0)
                sRule += rule[i].identifier;
            else
                sRule += "¬" + rule[i].identifier;
        }
        $('.collapsible').collapsible();
        return sRule;
    };

    s.addPrepToPreview = function (at, index) {
        var a = {};
        angular.copy(at, a);
        var input = document.getElementById(a.identifier);
        var negInput = document.getElementById("neg"+ a.identifier);
        var isChecked = input.checked;
        var negIsChecked = negInput.checked;
        if(isChecked)
        {
            if(negIsChecked)
            {
                deletePreposition(a.identifier);
                a.id *= -1;
                s.prepositions.push(a);
            }
            else
            {
                deletePreposition(a.identifier);
                s.prepositions.push(a);
            }
        }
        else
        {
            deletePreposition(a.identifier);
        }
        stringifyPrepositions();
    };
    s.addConsToPreview = function (identifier, obj){
        var input = document.getElementById("negCons");
        var a = {};
        angular.copy(obj, a);
        if(input.checked)
        {
            s.consecuent = a;
            s.consecuent.id *= -1;
            s.pConsecuent = " → ¬" + a.identifier;
        }
        else
        {
            s.consecuent = a;
            s.pConsecuent = " → " + a.identifier;
        }
    };
    s.makeConsNegative = function(){
        var input = document.getElementById("negCons");
        if(input.checked)
        {
            s.consecuent.id *= -1;
            s.pConsecuent = " → ¬" + s.consecuent.identifier;
        }
        else
        {
            s.consecuent.id *= -1;
            s.pConsecuent = " → " + s.consecuent.identifier;
        }

    };
    s.addRule = function() {
        s.rule.id = s.rules.length > 0 ? s.rules[s.rules.length - 1].id + 1 : 1;
        s.rule.prepositions = s.prepositions;
        s.rule.consecuent = s.consecuent;
        s.rules.push(s.rule);
        saveData(s.rules);
        s.rule = {};
        s.prepositions = [];
        s.consecuent = {};
    };

    s.stringifyRule = function(rule, type) {
        var sRule = type == 0 ? "" : "Si ";
        for(var i = 0; i < rule.prepositions.length; i++)
        {
            if(i != 0) sRule += type == 0 ? " ^ " : " y ";
            if(rule.prepositions[i].id > 0)
                sRule += type == 0 ? rule.prepositions[i].identifier : rule.prepositions[i].value;
            else
                sRule += type == 0 ? "¬" + rule.prepositions[i].identifier : "No " + rule.prepositions[i].value;
        }

        if(rule.consecuent.id > 0)
            sRule += type == 0 ? " → " + rule.consecuent.identifier : " entonces " + rule.consecuent.value;
        else
            sRule += type == 0 ? " → ¬" + rule.consecuent.identifier : " entonces No " + rule.consecuent.value;
        $('.collapsible').collapsible();
        return sRule;
    };

    s.removeElement = function (index)
    {
        s.rules.splice(index, 1);
        saveData(s.rules);
    }
}]);

app.controller("FindForward",["$scope","$http","$q", function (s, http, q) {
    s.pageContent = {
        pageTitle: "Busqueda hacia adelante."
    };

    var Atoms = [];
    var Rules = [];
    s.valuesTable = [];
    var cRules= [];
    var A = [];
    var CI = [];
    var C = [];
    var Exp = "";
    var Exps = [];

    s.questions = [];

    s.initialize = function () {
        s.atomsReq = http.get("/getDictionary").then(function (response) {
            if(response.data != "") Atoms = response.data;
        }, function (response) {
            console.log("Error: " , response);
        });
        s.rulesReq = http.get("/getRules").then(function (response) {
            if(response.data != "") {
                Rules = response.data;
                angular.copy(Rules, cRules);
            }
        }, function (response) {
            console.log("Error: " , response);
        });
        q.all([s.atomsReq, s.rulesReq]).then(function () {
            A = getAntecedents();
            s.questions = getAntecedents();
            CI = getIConsequents();
            C = getConsequents();
            createTable();
        });
    };

    function createTable() {
        var newObj = {};
        for(var i = 0; i < A.length; i++) {
            newObj = {};
            newObj.atom = A[i];
            newObj.value = 'No Se';
            newObj.src = null;
            newObj.type = 1;
            s.valuesTable.push(newObj);
        }
        for(var i = 0; i < CI.length; i++) {
            newObj = {};
            newObj.atom = CI[i];
            newObj.value = 'No Se';
            newObj.src = null;
            newObj.type = 2;
            s.valuesTable.push(newObj);
        }
        for(var i = 0; i < C.length; i++) {
            newObj = {};
            newObj.atom = C[i];
            newObj.value = 'No Se';
            newObj.src = null;
            newObj.type = 3;
            s.valuesTable.push(newObj);
        }
    }

    s.getValues = function (index, value) {
        var obj = setTableValue(s.questions[index], value, 'U');
        propagate(obj);
        destroyFromQuestions(obj.atom);
        if(s.questions == 0)
            s.questions = CI;
    };

    s.getClassAtoms = function(num){
        switch (num)
        {
            case 1:
                return 'A';
            case 2:
                return 'CI';
            case 3:
                return 'C';
        }
    };

    function setTableValue(atom, value, src) {
        for(var i = 0; i < s.valuesTable.length; i++)
        {
            if(s.valuesTable[i].atom.identifier == atom.identifier)
            {
                s.valuesTable[i].value = value;
                s.valuesTable[i].src = src;
                return s.valuesTable[i];
            }
        }

        return null;
    }
    
    function propagate(obj) {
        for(var i = 0; i < cRules.length; i++)
        {
            // for
            for(var j = 0; j < cRules[i].prepositions.length; j++) {
                // Validar si se encuentra el atomo en las preposiciones
                if(cRules[i].prepositions[j].identifier == obj.atom.identifier) {
                    var myValue = 0;
                    // Si se encuentra calcular el valor
                    // Si el valor del atomo en la regla es menor a 0 se invierte el valor
                    if(cRules[i].prepositions[j].id < 0)
                        myValue = obj.value == 0 ? 1 : 0;
                    else// Si el valor del atomo en la regla en mayor a 0 el valor es igual
                        myValue = obj.value;
                    // Si el valor es true ( 1 ) eliminar el atomo de la regla.
                    if(myValue == 1){
                        cRules[i].prepositions.splice(j, 1);
                        j--;
                    }
                    else {// Si el valor es false ( 0 ) eliminar toda la regla
                        cRules.splice(i, 1);
                        i--;
                        break;
                    }
                }
                // Validar si se acabaron las preposiciones
                // Si se acabaron el consecuente es true ( 1 )
                if(cRules[i].prepositions.length == 0) {
                    var consValue = 0;
                    if(cRules[i].consecuent.id < 0)
                        consValue = 0;
                    else
                        consValue = 1;
                    // Guardar el valor en la tabla de valores y el src sera el numero de regla que lo resolvio
                    asignValue(cRules[i].consecuent, consValue, cRules[i].id);
                }
                // Si no se acabaron continuar validando las demas reglas
            }
            // endfor
        }
    }

    function asignValue(atom, value, nRule) {
        var obj = setTableValue(atom, value, 'R' + nRule);
        propagate(obj);
        seekAndDestroy(obj.atom);
    }

    function seekAndDestroy(obj) {
        for(var i = 0; i < CI.length; i++)
        {
            if(CI[i].identifier == obj.identifier) {
                CI.splice(i, 1);
                break;
            }
        }
        for(var j = 0; j < C.length; j++)
        {
            if(C[j].identifier == obj.identifier) {
                C.splice(j, 1);
                alert("Se encontro una conclusion");
                break;
            }
        }

    }

    function destroyFromQuestions(obj) {
        for(var i = 0; i < s.questions.length; i++)
        {
            if(s.questions[i].identifier == obj.identifier) {
                s.questions.splice(i, 1);
                break;
            }
        }
        for(var k = 0; k < A.length; k++)
        {
            if(A[k].identifier == obj.identifier) {
                A.splice(k, 1);
                break;
            }
        }
    }

    function getAntecedents() {
        var tmpC = getTmpAandTmpC()[1];
        var a = [];

        for(var i = 0; i  < Atoms.length; i++)
        {
            if(!existIn(Atoms[i], tmpC))
                a.push(Atoms[i]);
        }

        return a;
    }

    function getConsequents() {
        var tmpA = getTmpAandTmpC()[0];
        var c = [];

        for(var i = 0; i < Atoms.length; i++)
        {
            if(!existIn(Atoms[i], tmpA))
                c.push(Atoms[i]);
        }

        return c;
    }

    function getIConsequents() {
        var tmpA = getTmpAandTmpC()[0];
        var tmpC = getTmpAandTmpC()[1];
        var ci = [];
        for(var i = 0; i < Atoms.length; i++)
        {
            if(existIn(Atoms[i], tmpA) && existIn(Atoms[i], tmpC))
                ci.push(Atoms[i]);
        }

        return ci;
    }

    function getTmpAandTmpC() {
        var tmpA = [];
        var tmpC = [];
        for(var i = 0; i < Rules.length; i++)
        {
            for(var j = 0; j < Rules[i].prepositions.length; j++)
            {
                var preposition = Rules[i].prepositions[j];
                if(!existIn(preposition, tmpA))
                    tmpA.push(preposition);
            }
            if(!existIn(Rules[i].consecuent, tmpC))
                tmpC.push(Rules[i].consecuent);
        }

        return [tmpA,tmpC];
    }

    function existIn(obj, objArray) {
        for(var i = 0; i < objArray.length; i++)
            if(obj.identifier == objArray[i].identifier) return true;
        return false;
    }

    function validateSEAnswer(index)
    {
        var numRule = parseInt(s.valuesTable[index].src.charAt(1));
        Exp += numRule + " ";
        var rule = Rules[numRule-1];

        for(var i = 0; i < rule.prepositions.length; i++)
        {
            if(i > 0) Exp += " ^ ";
            Exp += rule.prepositions[i].id > 0 ? rule.prepositions[i].value : "¬" + rule.prepositions[i].value;
        }
        Exp += rule.consecuent.id > 0 ? " → " + rule.consecuent.value : " → ¬" + rule.consecuent.value;
        var ite = getAtomInTable(rule.consecuent);
        Exp += " " + rule.consecuent.value + " = ";
        Exp += s.valuesTable[ite].value == 1 ? 'Si' : 'No';

        for(var i = 0; i < rule.prepositions.length; i++)
        {

            var it = getAtomInTable(rule.prepositions[i]);
            if(s.valuesTable[it].src == 'U')
            {
                validateUAnswer(it);
            }
            else
            {
                Exp += " Segun la regla ";
                validateSEAnswer(it);
            }
        }
    }
    function getAtomInTable(atom)
    {
        for(var i = 0; i < s.valuesTable.length; i++){
            if(s.valuesTable[i].atom.value == atom.value)
                return i;
        }

        return -1;
    }

    function validateUAnswer(index)
    {
        var valor = s.valuesTable[index].value == 1 ? 'Si' : 'No';
        Exp += " Tu me dijiste " + s.valuesTable[index].atom.value + " = " + valor;
    }

    s.createExp = function(index){
        if(s.valuesTable[index].src == 'U')
        {
            validateUAnswer(index);
        }
        else
        {
            Exp = "Segun la regla ";
            validateSEAnswer(index);
            //Exp += " Por lo tanto " + s.valuesTable[index].atom.value + " = ";
            //Exp += s.valuesTable[index].value == 1 ? 'Si' : 'No';
        }

        alert(Exp);
    }
}]);

app.controller("FindBack",["$scope","$http", function (s, http) {
    s.pageContent = {
        mainTitle: 'Busqueda hacia atras.',
        questTitle: '¿Que desea saber?'
    };

    s.atoms = [];
    var target = {};
    var rules = [];
    var nRules = [];
    var cRules = [];
    var close = [];
    var open = [];
    var fRules = [];
    var cFRules = [];
    s.askAtoms = [];
    s.resultTable = [];
    
    s.initialize = function () {
        http.get("/getDictionary").then(function (response) {
            if(response.data != "") s.atoms = response.data;
        }, function (response) {
            console.log("Error: " , response);
        });
        http.get("/getRules").then(function (response) {
            if(response.data != "") {
                rules = response.data;
                for(var i = 0; i < rules.length; i++)
                {
                    normalizeRule(rules[i]);
                }
                angular.copy(nRules, cRules);
            }
        }, function (response) {
            console.log("Error: " , response);
        });
    };

    function normalizeRule(rule)
    {
        var atoms = [];
        for(var i = 0; i < rule.prepositions.length; i++)
        {
            rule.prepositions[i].id *= -1;
            atoms.push(rule.prepositions[i]);
        }
        atoms.push(rule.consecuent);
        nRules.push(atoms);
    }

    s.initSearch = function()
    {
        var atomName = $('input[type="radio"][name=atoms]:checked', '#selection').val();
        target = getAtom(atomName);
        if(atomName != null)
        {
            open = [];
            close = [];
            fRules = [];
            var atom = getAtom(atomName);
            var negAtom = getAtom(atomName);
            negAtom.id *= -1;
            // Agregar atomo con signo positivo y negativo a abiertos
            open.push(atom);
            open.push(negAtom);
            // Filtrar reglas
            filtrateRules();
            showQuestions();
            angular.copy(fRules, cFRules);
            createTable();
            s.askAtoms.splice(0,1);

        }
        else
        {
            alert("No se ha seleccionado un atomo para buscar...");
        }
    };

    function createTable()
    {
        var myAtoms = [];
        angular.copy(s.askAtoms, myAtoms);
        for(var i = 0; i < myAtoms.length; i++)
        {
            var atom = {};
            atom.atom = myAtoms[i];
            atom.value = "No Se";
            atom.src = null;
            s.resultTable.push(atom);
        }
    }

    function showQuestions()
    {
        for(var i = 0; i < close.length; i++)
        {
            if(s.askAtoms.length > 0)
            {
                if(!existInQuestions(close[i]))
                {
                    s.askAtoms.push(close[i]);
                }
            }
            else
            {
                s.askAtoms.push(close[i]);
            }
        }
    }

    function existInQuestions(elem)
    {
        for(var i = 0; i < s.askAtoms.length; i++)
        {
            if(elem.identifier == s.askAtoms[i].identifier)
                return true;
        }
        return false;
    }

    function getAtom(name)
    {
        var newAtoms = [];
        angular.copy(s.atoms, newAtoms);
        for(var i = 0; i < newAtoms.length; i++)
        {
            if(newAtoms[i].value == name)
                return newAtoms[i];
        }

        return null;
    }

    function filtrateRules()
    {
        for(var x = 0; x < open.length; x++) {
            for (var i = 0; i < nRules.length; i++) {
                for (var j = 0; j < nRules[i].length; j++) {
                    if ((nRules[i][j].identifier == open[x].identifier) && (nRules[i][j].id == open[x].id)) {
                        saveAtoms(nRules[i]);
                        fRules.push(nRules[i]);
                        nRules.splice(i, 1);
                        i--;
                        break;
                    }
                }
            }
            close.push(open[0]);
            open.splice(0, 1);
            x--;
        }
    }

    function saveAtoms(rule)
    {
        for(var i = 0; i < rule.length; i++) {
            if (!isOpen(rule[i]) && !isClosed(rule[i])) {
                var newAtom = {};
                angular.copy(rule[i],newAtom);
                newAtom.id *= -1;
                open.push(newAtom);
            }
        }
    }

    function isOpen(atom)
    {
        for(var i = 0; i < open.length; i++)
        {
            if(atom.identifier == open[i].identifier && atom.id == open[i].id)
            return true;
        }
        return false;
    }

    function isClosed(atom)
    {
        for(var i = 0; i < close.length; i++)
        {
            if(atom.identifier == close[i].identifier && atom.id == close[i].id)
                return true;
        }
        return false;
    }
    function destroy(atom){
        for(var i = 0; i < s.askAtoms.length; i++)
        {
            if(s.askAtoms[i].identifier == atom.identifier)
            {
                if(target.identifier == s.askAtoms[i].identifier)
                    alert("Se encontro el resultado");
                s.askAtoms.splice(i, 1);
                if(s.askAtoms.length == 0 && s.valuesTable[0].value != "No Se")
                    alert("No se el resultado :(");
                break;
            }
        }
    }

    s.getValues = function (index, value) {
        //propagar valor
        var obj = setTableValue(s.askAtoms[index],value, "U");
        propagate(obj.value, obj.atom);
        destroy(obj.atom);
    };

    function setTableValue(atom, value, src) {
        for(var i = 0; i < s.resultTable.length; i++)
        {
            if(s.resultTable[i].atom.identifier == atom.identifier)
            {
                s.resultTable[i].value = value;
                s.resultTable[i].src = src;
                return s.resultTable[i];
            }
        }

        return null;
    }

    function propagate(value, atom)
    {
        for(var i = 0; i < cFRules.length; i++)
        {
            for(var j = 0; j < cFRules[i].length; j++)
            {
                if(cFRules[i][j].identifier == atom.identifier)
                {
                    var myValue = 0;
                    // Si se encuentra calcular el valor
                    // Si el valor del atomo en la regla es menor a 0 se invierte el valor
                    if(cFRules[i][j].id < 0)
                        myValue = value == 0 ? 1 : 0;
                    else// Si el valor del atomo en la regla en mayor a 0 el valor es igual
                        myValue = value;
                    // Si el valor es false ( 0 ) eliminar el atomo de la regla.
                    if(myValue == 0){
                        cFRules[i].splice(j, 1);
                        j--;
                    }
                    else {// Si el valor es true ( 1 ) eliminar toda la regla
                        cFRules.splice(i, 1);
                        i--;
                        break;
                    }
                }
                // Validar si se acabaron las preposiciones
                // Si se acabaron el consecuente es true ( 1 )
                if(cFRules[i].length == 1) {
                    var consValue = 0;
                    if(cFRules[i][0].id < 0)
                        consValue = 0;
                    else
                        consValue = 1;
                    // Guardar el valor en la tabla de valores y el src sera el numero de regla que lo resolvio
                    asignValue(cFRules[i][0], consValue, i+1);
                }
            }
        }
    }

    function asignValue(atom, value, nRule)
    {
        var obj = setTableValue(atom, value, 'R' + nRule);
        if(obj.atom.identifier == target.identifier) {
            alert("Se encontro un resultado...");
            s.askAtoms = [];
        }
        else
            propagate(obj.value, obj.atom);
        destroy(obj.atom);
    }

    function propagate1(value, atom) {
        for(var i = 0; i < cRules.length; i++)
        {
            // for
            for(var j = 0; j < cRules[i].prepositions.length; j++) {
                // Validar si se encuentra el atomo en las preposiciones
                if(cRules[i].prepositions[j].identifier == obj.atom.identifier) {
                    var myValue = 0;
                    // Si se encuentra calcular el valor
                    // Si el valor del atomo en la regla es menor a 0 se invierte el valor
                    if(cRules[i].prepositions[j].id < 0)
                        myValue = obj.value == 0 ? 1 : 0;
                    else// Si el valor del atomo en la regla en mayor a 0 el valor es igual
                        myValue = obj.value;
                    // Si el valor es true ( 1 ) eliminar el atomo de la regla.
                    if(myValue == 1){
                        cRules[i].prepositions.splice(j, 1);
                        j--;
                    }
                    else {// Si el valor es false ( 0 ) eliminar toda la regla
                        cRules.splice(i, 1);
                        i--;
                        break;
                    }
                }
                // Validar si se acabaron las preposiciones
                // Si se acabaron el consecuente es true ( 1 )
                if(cRules[i].prepositions.length == 0) {
                    var consValue = 0;
                    if(cRules[i].consecuent.id < 0)
                        consValue = 0;
                    else
                        consValue = 1;
                    // Guardar el valor en la tabla de valores y el src sera el numero de regla que lo resolvio
                    asignValue(cRules[i].consecuent, consValue, cRules[i].id);
                }
                // Si no se acabaron continuar validando las demas reglas
            }
            // endfor
        }
    }


}]);

app.controller("AlfaBeta",["$scope","$http", function (s, http) {
    var chars = ["¬","(", ")", "->", "v", "^"];
    var re = /[A-Z][A-Za-z]*/;
    var atomoActual = "";
    function Nodo(padre, hIzquierdo, hDerecho, signo, simbolo, id, tipo) {
        this.padre = padre;
        this.hDerecho = hDerecho;
        this.hIzquierdo = hIzquierdo;
        // Originales
        this.id = id;
        this.signo = signo;
        this.simbolo = simbolo;
        // Heredados
        this.hId = id;
        this.hSigno = signo;
        this.hSimbolo = simbolo;
        this.tipo = tipo;
        this.tablaNodos = [];
    }
    s.txtExpression = "";
    var signos = [];
    var raiz = null;
    var nodoActual = null;
    s.tablaAtomos = [];
    s.tablaNodos = [];
    s.validateExpression = function(){
        if(openBrakets() == closedBrakets() && s.txtExpression != "")
            return true;
        return false;
    };
    s.readExpression = function (){
        //loadTree();
        for(var i = 0; i < s.txtExpression.length; i++)
        {
            var str = s.txtExpression.substr(i,1);

            if (str == "-") {
                i++;
                str += s.txtExpression.substr(i, 1);
            }
            var charNum = getCharNum(str);
            if(charNum > chars.length)
                atomoActual = str;
            validateChar(charNum, i, null);
        }

        crearArbol();
    };
    function asignarAlfasBetas(nodo) {
        var hI = {};
        var hD = {};
        var newNodo = nodo;
        newNodo.tipo = obtenerTipo(newNodo);
        if(nodo.hIzquierdo != null){
            hI = asignarAlfasBetas(nodo.hIzquierdo);
            newNodo.hIzquierdo = hI;
        }

        if(nodo.hDerecho != null){
            hD = asignarAlfasBetas(nodo.hDerecho);
            newNodo.hDerecho = hD;
        }

        return newNodo;
    }
    function obtenerTipo(nodo) {
        var simbolos = nodo.hSigno + nodo.hSimbolo;
        if(simbolos == "+^" || simbolos == "-->" || simbolos == "-v")
            return "Alfa";
        else if(simbolos == "+v" || simbolos == "-^" || simbolos == "+->")
            return "Beta";
        return "";
    }
    function obtenerSignos(nodo) {
        var simbolos = {};
        var signos = nodo.hSigno + nodo.hSimbolo;
        simbolos.Izquierdo = "";
        simbolos.Derecho = "";
        switch (signos)
        {
            case "+->":
                simbolos.Izquierdo = "-";
                simbolos.Derecho = "+";
                break;
            case "-->":
                simbolos.Izquierdo = "+";
                simbolos.Derecho = "-";
                break;
            case "+v":
                simbolos.Izquierdo = "+";
                simbolos.Derecho = "+";
                break;
            case "-v":
                simbolos.Izquierdo = "-";
                simbolos.Derecho = "-";
                break;
            case "+^":
                simbolos.Izquierdo = "+";
                simbolos.Derecho = "+";
                break;
            case "-^":
                simbolos.Izquierdo = "-";
                simbolos.Derecho = "-";
                break;
        }
        return simbolos;
    }
    function crearArbol(){
        var hTree = heredarSignos(raiz,obtenerSignos(raiz));
        var abTree = asignarAlfasBetas(hTree);
        busquedaAlfaBeta();
        var objJson = saveNodo(abTree);
        saveTree(objJson);
    }
    function heredarSignos(nodo, signoHeredado){
        var hI = {};
        var hD = {};
        var newNodo = nodo;
        if(nodo.hIzquierdo != null){
            if(signoHeredado.Izquierdo == "+")
                nodo.hIzquierdo.hSigno = nodo.hIzquierdo.hSigno == "+" ? "+" : "-";
            else
                nodo.hIzquierdo.hSigno = nodo.hIzquierdo.hSigno == "+" ? "-" : "+";
            hI = heredarSignos(nodo.hIzquierdo, obtenerSignos(nodo.hIzquierdo));
            newNodo.hIzquierdo = hI;
        }

        if(nodo.hDerecho != null){
            if(signoHeredado.Derecho == "+")
                nodo.hDerecho.hSigno = nodo.hDerecho.hSigno == "+" ? "+" : "-";
            else
                nodo.hDerecho.hSigno = nodo.hDerecho.hSigno == "+" ? "-" : "+";
            hD = heredarSignos(nodo.hDerecho, obtenerSignos(nodo.hDerecho));
            newNodo.hDerecho = hD;
        }

        return newNodo;
    }
    function saveNodo(nodo) {
        var hI = {};
        var hD = {};
        var newNodo = {};
        if(!re.test(nodo.simbolo)) {
            newNodo.name = "O(" + nodo.signo + ", " + nodo.simbolo + ")" + " H(" + nodo.hSigno + ", " + nodo.hSimbolo + ") SH("
                + obtenerSignos(nodo).Izquierdo + ", " + obtenerSignos(nodo).Derecho + ") Tipo(" + nodo.tipo + ")" + nodo.id;
        }
        else{
            newNodo.name = "O(" + nodo.signo + ", " + nodo.simbolo + ")" + " H(" + nodo.hSigno + ", " + nodo.hSimbolo + ")" + nodo.id;
        }
        newNodo.children = [];
        if(nodo.hDerecho != null) {
            hD = saveNodo(nodo.hDerecho);
            newNodo.children.push(hD);
        }
        if(nodo.hIzquierdo != null) {
            hI = saveNodo(nodo.hIzquierdo);
            newNodo.children.push(hI);
        }

        return newNodo;
    }
    function saveTree(data) {
        var json = JSON.stringify(data);
        console.log(json);
        var r = new XMLHttpRequest();
        r.open("POST", "/saveTree", true);
        r.setRequestHeader("Content-type","application/json;charset=UTF-8");
        r.send(json);
        loadTree();
    }
    var newNode = {};
    var valHijos = [];
    function validateChar(charNum, iterator, nAct) {
        switch (charNum)
        {
            case 0: // ¬
                break;
            case 1: // (
                // TODO: Crear nuevo nodo a la derecha o izquierda segun sea el caso
                if(raiz == null)
                {
                    raiz = new Nodo(null,null,null,null,null,null,null,null);
                    nodoActual = raiz;
                }
                else {
                    if (nodoActual.hIzquierdo == null) {
                        nodoActual.hIzquierdo = new Nodo(nodoActual, null, null, null, null, null,null);
                        nodoActual = nodoActual.hIzquierdo;
                    }
                    else {
                        nodoActual.hDerecho = new Nodo(nodoActual, null, null, null, null, null,null);
                        nodoActual = nodoActual.hDerecho;
                    }
                }
                // TODO: Verificar el simbolo anterior
                var antSimb = s.txtExpression.substr(iterator - 1, 1);
                if(antSimb == "¬")// TODO: Si es ¬ se agrega - a la pila de signos
                    signos.push("-");
                else// TODO: Si es diferente de ¬ se agrega + a la pila de signos
                    signos.push("+");
                break;
            case 2: // )
                // TODO: Regresar al padre
                nodoActual = nodoActual.padre;
                break;
            case 3: // ->
                if(nAct == null){
                nodoActual = nodoActual.padre;
                if(nodoActual.signo != null && nodoActual.simbolo != null)
                    nodoActual = nodoActual.padre;
                nodoActual.signo = signos.pop();
                nodoActual.simbolo = "->";
                nodoActual.hSigno = nodoActual.signo;
                nodoActual.hSimbolo = "->";
                }
                else{
                    // Si el nodo no existe en la tabla de nodos
                    valHijos = convertToOr(nAct, nAct.hIzquierdo.id, nAct.hDerecho.id);
                    if(!existInTableNodos(valHijos)){
                        newNode = {}; // Nuevo obj Nodo
                        newNode.id = s.tablaNodos.length + 1; // Se asigna su nuevo id
                        nAct.id = valHijos[2] == -1 ? newNode.id * -1 : newNode.id; // Se agrega id al nodo con respectivo signo
                        newNode.M = mayorYMenor(valHijos)[0]; // Se asigna el hijo mayor
                        newNode.m = mayorYMenor(valHijos)[1]; // Se asigna el hijo menor
                        newNode.value = nAct.simbolo; // Se asigna el simbolo del nodo
                        s.tablaNodos.push(newNode); // Agregar a la tabla de nodos
                    }
                    else {
                        for (var i = 0; i < s.tablaNodos.length; i++) {
                            if (mayorYMenor(valHijos)[0] == s.tablaNodos[i].M && mayorYMenor(valHijos)[1] == s.tablaNodos[i].m) {
                                nAct.id = nAct.signo == "-" ? s.tablaNodos[i].id * -1 : s.tablaNodos[i].id;
                                break;
                            }
                        }
                    }
                    if(nAct.padre != null)
                        if (nAct.padre.hIzquierdo != null && nAct.padre.hDerecho != null)
                            validateChar(getCharNum(nAct.padre.simbolo), iterator, nAct.padre);
                }
                break;
            case 4: // v
                if(nAct == null) {
                    nodoActual = nodoActual.padre;
                    if (nodoActual.signo != null && nodoActual.simbolo != null)
                        nodoActual = nodoActual.padre;
                    nodoActual.signo = signos.pop();
                    nodoActual.simbolo = "v";
                    nodoActual.hSigno = nodoActual.signo;
                    nodoActual.hSimbolo = "v";
                }
                else {
                    // Si el nodo no existe en la tabla de nodos
                    valHijos = convertToOr(nAct, nAct.hIzquierdo.id, nAct.hDerecho.id);
                    if(!existInTableNodos(valHijos)){
                        newNode = {}; // Nuevo obj Nodo
                        newNode.id = s.tablaNodos.length + 1; // Se asigna su nuevo id
                        nAct.id = valHijos[2] == -1 ? newNode.id * -1 : newNode.id; // Se agrega id al nodo con respectivo signo
                        newNode.M = mayorYMenor(valHijos)[0]; // Se asigna el hijo mayor
                        newNode.m = mayorYMenor(valHijos)[1]; // Se asigna el hijo menor
                        newNode.value = nAct.simbolo; // Se asigna el simbolo del nodo
                        s.tablaNodos.push(newNode); // Agregar a la tabla de nodos
                    }
                    else {
                        for (var i = 0; i < s.tablaNodos.length; i++) {
                            if (mayorYMenor(valHijos)[0] == s.tablaNodos[i].M && mayorYMenor(valHijos)[1] == s.tablaNodos[i].m) {
                                nAct.id = nAct.signo == "-" ? s.tablaNodos[i].id * -1 : s.tablaNodos[i].id;
                                break;
                            }
                        }
                    }
                    if(nAct.padre != null)
                        if (nAct.padre.hIzquierdo != null && nAct.padre.hDerecho != null)
                            validateChar(getCharNum(nAct.padre.simbolo), iterator, nAct.padre);
                }
                break;
            case 5: // ^
                if(nAct == null) {
                    nodoActual = nodoActual.padre;
                    if (nodoActual.signo != null && nodoActual.simbolo != null)
                        nodoActual = nodoActual.padre;
                    nodoActual.signo = signos.pop();
                    nodoActual.simbolo = "^";
                    nodoActual.hSigno = nodoActual.signo;
                    nodoActual.hSimbolo = "^";
                }
                else{
                    // Si el nodo no existe en la tabla de nodos
                    valHijos = convertToOr(nAct, nAct.hIzquierdo.id, nAct.hDerecho.id);
                    if(!existInTableNodos(valHijos)){
                        newNode = {}; // Nuevo obj Nodo
                        newNode.id = s.tablaNodos.length + 1; // Se asigna su nuevo id
                        nAct.id = valHijos[2] == -1 ? newNode.id * -1 : newNode.id; // Se agrega id al nodo con respectivo signo
                        newNode.M = mayorYMenor(valHijos)[0]; // Se asigna el hijo mayor
                        newNode.m = mayorYMenor(valHijos)[1]; // Se asigna el hijo menor
                        newNode.value = nAct.simbolo; // Se asigna el simbolo del nodo
                        s.tablaNodos.push(newNode); // Agregar a la tabla de nodos
                    }
                    else {
                        for (var i = 0; i < s.tablaNodos.length; i++) {
                            if (mayorYMenor(valHijos)[0] == s.tablaNodos[i].M && mayorYMenor(valHijos)[1] == s.tablaNodos[i].m) {
                                nAct.id = nAct.signo == "-" ? s.tablaNodos[i].id * -1 : s.tablaNodos[i].id;
                                break;
                            }
                        }
                    }
                    if(nAct.padre != null)
                        if (nAct.padre.hIzquierdo != null && nAct.padre.hDerecho != null)
                            validateChar(getCharNum(nAct.padre.simbolo), iterator, nAct.padre);
                }
                break;
            case -1: // ERROR
                alert("ERROR: validate char");
                break;
            default: // Atomo
                // TODO: Verificar el signo del atomo y agregarlo al nodo
                if (nodoActual.hIzquierdo == null) {
                    nodoActual.hIzquierdo = new Nodo(nodoActual, null, null, null, null, null, null);
                    nodoActual = nodoActual.hIzquierdo;
                }
                else {
                    nodoActual.hDerecho = new Nodo(nodoActual, null, null, null, null, null, null);
                    nodoActual = nodoActual.hDerecho;
                }
                nodoActual.signo = s.txtExpression.substr(iterator - 1, 1) != "¬" ? "+" : "-";
                nodoActual.simbolo = atomoActual;
                nodoActual.hSigno = s.txtExpression.substr(iterator - 1, 1) != "¬" ? "+" : "-";
                nodoActual.hSimbolo = atomoActual;
                if(!isInTableAtomos(nodoActual.simbolo)) {
                    // Si el atomo no existe en la tabla de atomos
                    // Agregar a tabla de atomos
                    var id = s.tablaAtomos.length == 0 ? 1 : s.tablaNodos.length + 1; // Crear id de tablaAtomos
                    nodoActual.id = nodoActual.signo == "-" ? id * -1 : id; // Asignar id a nodo con signo correspondiente
                    var value = nodoActual.simbolo; // Agregar el valor del atomo a la tabla de atomos
                    var newAtom = {}; // Se crea un obj Atomo para la tabla atomos
                    newAtom.id = id; // Se asigna id al obj Atomo
                    newAtom.value = value;// Se asigna valor al obj Atomo
                    s.tablaAtomos.push(newAtom); // Se agrega a la tabla el obj Atomo
                    // Agregar a tabla de nodos
                    newNode = {}; // Se crea obj Nodo
                    newNode.id = id; // Se le asigna su respectivo id igual al de la tabla atomos
                    newNode.m = 0; // Como es atomo el menor es 0
                    newNode.M = id; // Como es atomo el mayor es el id del atomo
                    newNode.value = value; // Se asigna valor al obj Nodo
                    s.tablaNodos.push(newNode); // Se agrega a la tabla de Nodos
                }
                else // Si el atomo ya existe en la tabla de atomos
                {
                    for(var i = 0; i < s.tablaAtomos.length; i++){ // Recorrer tabla de atomos
                        if(nodoActual.simbolo == s.tablaAtomos[i].value){ // Si el simbolo del atomo concuerda con el de la tabla
                            nodoActual.id = nodoActual.signo == "-" ? s.tablaAtomos[i].id * -1 : s.tablaAtomos[i].id; // Se le asigna el id al nodo segun el signo
                            break;
                        }
                    }
                }
                if(nodoActual.padre.hIzquierdo != null && nodoActual.padre.hDerecho != null){
                    validateChar(getCharNum(nodoActual.padre.simbolo),iterator, nodoActual.padre);
                }
                break;
        }
    }
    function isInTableAtomos(nodo){
        for(var i = 0; i < s.tablaAtomos.length; i++){
            if(s.tablaAtomos[i].value == nodo)
                return true;
        }
        return false;
    }
    function convertToOr(nodo, vIz, vDe){
        var signo = null;
        if(nodo.signo == "+") {
            if(nodo.simbolo == "->") {// +(P->Q)
                // = +(-PvQ)
                vIz *= -1;
                signo = 1;
            }else if(nodo.simbolo == "^") {// +(P^Q)
                // = -(-Pv-Q)
                vIz *= -1;
                vDe *= -1;
                signo = -1;
            }
            else{ // +(PvQ)
                //= +(PvQ)
                signo = 1;
            }
        }else {
            if(nodo.simbolo == "->") { // -(P->Q)
                //= -(-PvQ)
                vIz *= -1;
                signo = -1;
            }else if(nodo.simbolo == "^") { // -(P^Q)
                //= +(-Pv-Q)
                vIz *= -1;
                vDe *= -1;
                signo = 1;
            }
            else{ // -(PvQ)
                // = -(PvQ)
                signo = -1;
            }


        }
        return [vIz, vDe, signo];
    }
    function existInTableNodos(values){
        for(var i = 0; i < s.tablaNodos.length; i++){
            if(s.tablaNodos[i].m == values[0] && s.tablaNodos[i].M == values[1])
                return true;
            if(s.tablaNodos[i].m == values[1] && s.tablaNodos[i].M == values[0])
                return true;
        }
        return false;
    }
    function mayorYMenor(values){
        if(values[0] > values[1])
            return values;
        return [values[1], values[0]]
    }
    function getCharNum(str) {
        for(var i = 0; i < chars.length; i++)
            if(str == chars[i])
                return i;
        if(re.test(str))
            return chars.length + 1;
        return -1;
    }
    function openBrakets(){
        var counter = 0;
        for(var i = 0; i < s.txtExpression.length; i++)
            if(s.txtExpression.substr(i,1) == "(")
                counter++;
        return counter;
    }
    function closedBrakets(){
        var counter = 0;
        for(var i = 0; i < s.txtExpression.length; i++)
            if(s.txtExpression.substr(i,1) == ")")
                counter++;
        return counter;
    }
    // Alfa Beta
    var alfasIzquierda = [];
    var alfasDerechas = [];
    function busquedaAlfaBeta() {
        getAlfas(raiz.hIzquierdo, 0);
        getAlfas(raiz.hDerecho, 1);

        var strIzquierdas = "";
        var strDerechas = "";
        angular.forEach(alfasIzquierda, function (value, key) {
            strIzquierdas += value.nodo.id;
            if(key < alfasIzquierda.length)
                strIzquierdas += ","
        });

        angular.forEach(alfasDerechas, function (value, key) {
            strDerechas += value.nodo.id;
            if(key < alfasDerechas.length)
                strDerechas += ","
        });

        console.log(strIzquierdas + " ### " + strDerechas);
    }

    function getAlfas(nodoInicio, lado){
        var nElement = {};
        var newNodo = {};
        angular.copy(nodoInicio, newNodo);
        if(newNodo.tipo == "Alfa" || re.test(newNodo.simbolo)){
            nElement.marca = false;
            nElement.nodo = newNodo;
            if(lado == 0) {
                if(!exist(alfasIzquierda, nElement))
                    alfasIzquierda.push(nElement);
            }
            else{
                if(!exist(alfasDerechas, nElement))
                    alfasDerechas.push(nElement);
            }
            if(newNodo.hIzquierdo != null)
                getAlfas(newNodo.hIzquierdo, lado);

            if(newNodo.hDerecho != null)
                getAlfas(newNodo.hDerecho, lado);

        }else if(newNodo.tipo == "Beta"){
            nElement.marca = true;
            nElement.nodo = newNodo;
            if(lado == 0) {
                if(!exist(alfasIzquierda, nElement))
                    alfasIzquierda.push(nElement);
            }
            else{
                if(!exist(alfasDerechas, nElement))
                    alfasDerechas.push(nElement);
            }
        }
    }

    function exist(array, element){
        for(var i = 0; i < array.length; i++){
            if(array[i].nodo.id == element.nodo.id)
                return true;
        }
        return false;
    }
}]);
