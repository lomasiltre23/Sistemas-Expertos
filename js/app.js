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

    // Variable Globales
    s.txtExpression = "";
    s.atoms_table = [];
    s.node_table = [];
    var current_node_id;
    var re = /[A-Z][A-Za-z]*/;
    var current_node;
    var root_node;
    var possible_node_id = null;
    s.calculartaut = true;

    // Variables Recorrido de Alfas
    var abiertos = [];
    var izquierdos = [];
    var derechos = [];
    var pendientes = [];
    var cerrados = [];
    var leftList = [];
    var rightList = [];
    var tmpValue = null;
    var tmpTxtExpression = "";
    var nodosAbiertos = [];
    var opcion1 = true;
    // END Variables Recorrido de Alfas
    function initVars() {
        nodosAbiertos = [];
        current_node = null;
        root_node = null;
        current_node_id = 0;
        s.atoms_table = [];
        s.node_table = [];
        possible_node_id = null;
        abiertos = [];
        izquierdos = [];
        derechos = [];
        pendientes = [];
        cerrados = [];
        leftList = [];
        rightList = [];
    }
    // END Variables globales

    // Validacion FRONT-END expresion
    s.validateExpression = function(){return openBrakets() == closedBrakets() && s.txtExpression != "";};
    s.calcularTaut = function () {
        s.calculartaut = !s.calculartaut;
    };
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
    // END Validacion FRONT-END

    // Lectura de expresion
    s.readExpression = function () {
        initVars();
        for(var i = 0; i < s.txtExpression.length; i++){
            var prevchar = i == 0 ? null : s.txtExpression.substr(i-1, 1);
            var char = s.txtExpression.substr(i, 1);
            if(char == "-"){ i++; char += s.txtExpression.substr(i, 1);}
            if(char != "¬") validateChar(char, prevchar);
        }
        inheritSigns(root_node, true);
        saveTree(root_node.json());
        getFirstList(root_node);
        var mensaje = "Lista Inicial:\nAbiertos: { "
            + abiertos.getListStringify(function (element) {
            var marc = element.marcado ? "*":"";
            return element.node.inherit_id + marc;
        })
            + " }";

        console.log(mensaje);
        var valor = null;
        while(valor == null) {
            valor = recorrido();
        }
        if(s.calculartaut) {
            if (tmpValue == null) {
                tmpValue = valor;
                tmpTxtExpression = s.txtExpression;
                s.txtExpression = s.txtExpression.charAt(0) == "¬" ? s.txtExpression.substr(1) : "¬" + s.txtExpression;
                s.readExpression();
            }
            else {
                // Opcion chris
                // if (tmpValue != valor)
                //     alert("TAUT");
                // else
                //     alert(tmpValue);
                // Opcion Ivan
                if(tmpValue == "SAT" && valor == "INSAT")
                    alert("TAUT");
                else
                    alert(tmpValue);
                tmpValue = null;
                s.txtExpression = tmpTxtExpression;
            }
        }else{
            alert(valor);
        }

    };

    // Creacion  de Arbol
    function validateChar(char, prevchar) {
        var str = re.test(char) ? "Atom" : char;
        switch (str) {
            case "(":
                openBraket(prevchar);
                break;
            case ")":
                closeBraket();
                break;
            case "->":
            case "^":
            case "v":
                operator(str);
                break;
            case "Atom":
                variable(prevchar, char);
                break;
        }
    }

    // Creacion de ID primera corrida y tabla!!
    function getNodeId(isAtom, mayor, menor) {
        if(isAtom) {
            for (var i = 0; i < s.node_table.length; i++) {
                var obj = s.node_table[i];
                if (obj.value.node_symbol == current_node.node_symbol)
                    return obj.id;
            }
        }else{
            for (var i = 0; i < s.node_table.length; i++) {
                var obj = s.node_table[i];
                if (obj.mayor == mayor && obj.menor == menor)
                    return obj.id;
            }
        }

        return null;
    }
    function getOrSigns(getMayor, node_id) {
        var signs_conbination = current_node.original_sign + current_node.node_symbol;
        var signo = current_node.original_sign == "-" ? -1 : 1;
        var id = node_id * signo;
        var left_id = current_node.left_child.original_id;
        var right_id = current_node.right_child.original_id;
        switch(signs_conbination){
            case "+->":// return +(-,+)
                left_id *= -1;
                break;
            case "-->":// return -(-,+)
                id *= -1;
                left_id *= -1;
                break;
            case "+^"://  return -(-,-)
                id *= -1;
                left_id *= -1;
                right_id *= -1;
                break;
            case "-^"://  return +(-,-)
                left_id *= -1;
                right_id *= -1;
                break;
            default:  //  (-,v) y (+,v)
                break;
        }
        var mayor = left_id > right_id ? left_id : right_id;
        var menor = left_id < right_id ? left_id : right_id;

        if(getMayor == null) return id;
        if(getMayor) return mayor;
        return menor;

    }
    function addCurrentToAtoms() {
        var newAtom = {};
        newAtom.value = current_node;
        newAtom.id = s.atoms_table.length == 0 ? 1 : s.atoms_table[s.atoms_table.length - 1].id + 1;
        s.atoms_table.pushIfNotExist(newAtom, function (e) {
            return newAtom.value.node_symbol == e.value.node_symbol;
        });
        addCurrentToNodes(true);
    }
    function addCurrentToNodes(isAtom) {
        var newAtom = {};
        var signo = current_node.original_sign == "-" ? -1 : 1;
        newAtom.value = current_node;
        newAtom.id = s.node_table.length == 0 ? 1 : s.node_table[s.node_table.length - 1].id + 1;
        newAtom.mayor = isAtom ? newAtom.id : getOrSigns(true, newAtom.id);
        newAtom.menor = isAtom ? 0 : getOrSigns(false, newAtom.id);
        var agregado = s.node_table.pushIfNotExist(newAtom, function (e) {
            if(!isAtom)
                return newAtom.mayor == e.mayor && newAtom.menor == e.menor;
            else
                return newAtom.value.node_symbol == e.value.node_symbol;
        });

        if(agregado){
            current_node.original_id = isAtom ? newAtom.id * signo : getOrSigns(null, newAtom.id);
        }else{
            if(isAtom)
                current_node.original_id = getNodeId(true, newAtom.mayor, newAtom.menor) * signo;
            else
                current_node.original_id = getNodeId(false, newAtom.mayor, newAtom.menor) * signo;
        }
    }
    // END Creacion de ID

    // Lector de Expreciones
    function openBraket(prevChar) {
        // Si no existe nodo raiz
        if(root_node == null) {
            // Crear nodo raiz
            root_node = new Node();
            root_node.node_identifier = ++current_node_id;
            // Cambiar nodo actual a nodo raiz
            current_node = root_node;
        }
        else {
            /*
            * Asignar hijo izquierdo o derecho #Ver declaracion#
            * Retorna el hijo asignado al nodo actual
            */
            current_node = current_node.setChild();
            current_node.node_identifier = ++current_node_id;
        }
        current_node.setSign(prevChar);
    }
    function closeBraket() {
        addCurrentToNodes(false);
        current_node = current_node.father;
    }
    function operator(symbol) {
        current_node.node_symbol = symbol;
        current_node.setType();
    }
    function variable(prevchar, atom) {
        current_node = current_node.setChild();
        current_node.node_identifier = ++current_node_id;
        current_node.setSign(prevchar);
        current_node.node_symbol = atom;
        addCurrentToAtoms();
        current_node = current_node.father;
    }
    // END Lector expreciones

    // Heredar Signos
    function inheritSigns(nodo, isRoot){
        nodo.getInheritSigns(isRoot);
        var originalSign = 0;
        var inheritSign = 0;
        var originalAbsId = 0;
        if(nodo.left_child != null){
            originalSign = nodo.left_child.original_sign == "+" ? 1 : -1;
            inheritSign = nodo.inherit_signs.left * originalSign;
            originalAbsId = Math.abs(parseInt(nodo.left_child.original_id));
            nodo.left_child.inherit_sign = inheritSign > 0 ? "+" : "-";
            nodo.left_child.inherit_id = nodo.left_child.inherit_sign == "+" ? originalAbsId : originalAbsId * -1;
            inheritSigns(nodo.left_child, false);
        }

        if(nodo.right_child != null){
            originalSign = nodo.right_child.original_sign == "+" ? 1 : -1;
            inheritSign = nodo.inherit_signs.right * originalSign;
            originalAbsId = Math.abs(parseInt(nodo.right_child.original_id));
            nodo.right_child.inherit_sign = inheritSign > 0 ? "+" : "-";
            nodo.right_child.inherit_id = nodo.right_child.inherit_sign == "+" ? originalAbsId : originalAbsId * -1;
            inheritSigns(nodo.right_child, false);
        }
    }
    //END Heredar Signos

    // Recorrido de Alfas
    function getFirstList(nodo) {
        var newNodo = {};
        var element = {};
        angular.copy(nodo, newNodo);
        if(newNodo.node_type == "Alfa" || re.test(newNodo.node_symbol))
            element.marcado = false;
        if(newNodo.node_type == "Beta")
            element.marcado = true;
        element.node = newNodo;
        abiertos.pushIfNotExist(element, function (e) {
            return element.node.inherit_id == e.node.inherit_id;
        });

        if(newNodo.left_child != null && !element.marcado)
            getFirstList(newNodo.left_child);
        if(newNodo.right_child != null && !element.marcado)
            getFirstList(newNodo.right_child);
    }

    var obj = {};
    function recorrido(){
        // Obtener beta para abrirla
        var beta = {};
        for(var i = 0; i < abiertos.length; i++){
            if(opcion1) {
                if (abiertos[i].marcado) {
                    obj = abiertos[i].node;
                    var isOpen = nodosAbiertos.pushIfNotExist(obj, function (e) {
                        return e.inherit_id == obj.inherit_id;
                    });
                    abiertos[i].marcado = false;
                    if (isOpen) {
                        angular.copy(abiertos[i], beta);
                        break;
                    }
                }
            }else{
                if (abiertos[i].marcado) {
                    abiertos[i].marcado = false;
                    angular.copy(abiertos[i], beta);
                    break;
                }
            }
        }
        angular.copy(abiertos, izquierdos);
        angular.copy(abiertos, derechos);
        // Abrir beta izquierda
        getLeftBeta(beta.node);
        // Abrir beta derecha
        getRightBeta(beta.node);

        var mensaje1 = "I:" + beta.node.inherit_id + "-> { "
            + izquierdos.getListStringify(function (element) {
                var marca = element.marcado ? "*":"";
                return element.node.inherit_id + marca;
            }) + " } -> "
            + leftList.getListStringify(function (element) {
                var marc = element.marcado ? "*":"";
                return element.node.inherit_id + marc;
            });

        var mensaje2 = "D:" + beta.node.inherit_id + "-> { "
            + derechos.getListStringify(function (element) {
                var marca = element.marcado ? "*":"";
                return element.node.inherit_id + marca;
            }) + " } -> "
            + rightList.getListStringify(function (element) {
                var marca = element.marcado ? "*":"";
                return element.node.inherit_id + marca;
            });

        // Verificar si no existe contrario en lista izquierda
        angular.forEach(leftList, function (value, key) {
            if(izquierdos.inArray(function (element) {
                    return value.node.inherit_id * -1 == element.node.inherit_id;
                })){
               izquierdos = [];
            }
        });
        // Verificar si no existe contrario en lista derecha
        angular.forEach(rightList, function (value, key) {
            if(derechos.inArray(function (element) {
                    return value.node.inherit_id * -1 == element.node.inherit_id;
                })){
                derechos = [];
            }
        });
        // Verificar si no existe en lista izquierda
        if(izquierdos.length > 0){
            angular.forEach(leftList, function (value, key) {
                izquierdos.pushIfNotExist(value,function (element) {
                    return value.node.inherit_id == element.node.inherit_id;
                });
            });
        }
        // Verificar si no existe en lista derecha
        if(derechos.length > 0){
            angular.forEach(rightList, function (value, key) {
                derechos.pushIfNotExist(value,function (element) {
                    return value.node.inherit_id == element.node.inherit_id;
                });
            });
        }

        console.log(mensaje1);
        console.log(mensaje2);
        leftList = [];
        rightList = [];
        if(isInsat()) return "INSAT";
        if(isSAT()) return "SAT";

        if(derechos.length > 0 && izquierdos.length > 0){
            /**
             * Usar heuristica para seleccionar izquierdo o derecho y agregar a abiertos
             * El otro se va a pendientes
             */
            var betasIzquierdas = izquierdos.countElements(function (e) {
                return e.marcado;
            });
            var betasDerechas = derechos.countElements(function (e) {
                return e.marcado;
            });

            var hLeft = izquierdos.length + betasIzquierdas;
            var hDer = derechos.length + betasDerechas;

            if(hLeft > hDer) {
                angular.copy(izquierdos, abiertos);
                pendientes.push(derechos);
            }
            else if(hLeft < hDer){
                angular.copy(derechos, abiertos);
                pendientes.push(izquierdos);
            }
            else {
                angular.copy(izquierdos, abiertos);
                pendientes.push(derechos);
            }

        }
        else if(derechos.length > 0){
            angular.copy(derechos, abiertos);
        }
        else if(izquierdos.length > 0){
            angular.copy(izquierdos, abiertos);
        }

        return null;
    }
    function getLeftBeta(nodo) {
        var newNodo = {};
        var element = {};
        angular.copy(nodo.left_child, newNodo);
        if(newNodo.node_type == "Alfa" || re.test(newNodo.node_symbol))
            element.marcado = false;
        if(newNodo.node_type == "Beta")
            element.marcado = true;
        element.node = newNodo;
        leftList.pushIfNotExist(element, function (e) {
            return element.node.inherit_id == e.node.inherit_id;
        });

        if(newNodo.left_child != null && !element.marcado)
            getLeftBeta(newNodo);
        if(newNodo.right_child != null && !element.marcado)
            getLeftBeta(newNodo);
    }
    function getRightBeta(nodo){
        var newNodo = {};
        var element = {};
        angular.copy(nodo.right_child, newNodo);
        if(newNodo.node_type == "Alfa" || re.test(newNodo.node_symbol))
            element.marcado = false;
        if(newNodo.node_type == "Beta")
            element.marcado = true;
        element.node = newNodo;
        rightList.pushIfNotExist(element, function (e) {
            return element.node.inherit_id == e.node.inherit_id;
        });

        if(newNodo.left_child != null && !element.marcado)
            getRightBeta(newNodo);
        if(newNodo.right_child != null && !element.marcado)
            getRightBeta(newNodo);
    }   
    function isSAT(){
        return (abiertoSinBetas(izquierdos) || abiertoSinBetas(derechos));
    }
    function isInsat(){
        return (izquierdos.length == 0 && derechos.length == 0);
    }
    function abiertoSinBetas(list) {
        if(list.length > 0) {
            var count = list.countElements(function (e) {
                return e.marcado
            });
            return count == 0;
        }

        return false;
    }
    // END Recorrido de Alfas

    //END Creacion Arbol
    function saveTree(tree){
        var jsonData = JSON.stringify(tree);
        // console.log(jsonData);
        var r = new XMLHttpRequest();
        r.open("POST", "/saveTree", true);
        r.getAllResponseHeaders();
        r.setRequestHeader("Content-type","application/json;charset=UTF-8");
        r.send(jsonData);
        setTimeout(loadTree, 500);
    }

}]);