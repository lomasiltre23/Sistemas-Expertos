function Node(){
    this.node_identifier = null;
    this.original_id = null;
    this.inherit_id = null;
    this.father = null;
    this.left_child = null;
    this.right_child = null;
    this.original_sign = null;
    this.inherit_sign = null;
    this.node_symbol = null;
    this.node_type = "";
    this.inherit_signs = {left: "", right: ""};

    this.setChild = function () {
        var child = {};
        if(this.left_child == null){
            this.left_child = new Node();
            this.left_child.father = this;
            child = this.left_child;
        }else{
            this.right_child = new Node();
            this.right_child.father = this;
            child = this.right_child;
        }

        return child;
    };
    this.setSign = function (sign) {
        this.original_sign = sign == "¬" ? "-" : "+";
    };
    this.setType = function () {
        /*
        * Alfa: +,^ | -,-> | -,v
        * Beta: -,^ | +,-> | +,v
        */
        var alfa = /(\+\^|-->|-v){1}/;
        if(alfa.test(this.original_sign + this.node_symbol))
            this.node_type = "Alfa";
        else
            this.node_type = "Beta";
    };
    this.getInheritSigns = function (isRoot) {
        var combinations = "";
        if(isRoot)
            combinations = this.original_sign + this.node_symbol;
        else
            combinations = this.inherit_sign + this.node_symbol;
        switch(combinations){
            case "+->":// return +(-,+) => (-,+)
                this.inherit_signs.left = -1;
                this.inherit_signs.right = 1;
                if(isRoot) {
                    this.inherit_id = this.original_id;
                    this.inherit_sign = this.inherit_id > 0 ? "+" : "-";
                }
                break;
            case "-->":// return -(-,+) => (+,-)
                this.inherit_signs.left = 1;
                this.inherit_signs.right = -1;
                if(isRoot) {
                    this.inherit_id = this.original_id * -1;
                    this.inherit_sign = this.inherit_id > 0 ? "+" : "-";
                }
                break;
            case "+^"://  return -(-,-) => (+,+)
                this.inherit_signs.left = 1;
                this.inherit_signs.right = 1;
                if(isRoot) {
                    this.inherit_id = this.original_id * -1;
                    this.inherit_sign = this.inherit_id > 0 ? "+" : "-";
                }
                break;
            case "-^"://  return +(-,-) => (-,-)
                this.inherit_signs.left = -1;
                this.inherit_signs.right = -1;
                if(isRoot) {
                    this.inherit_id = this.original_id;
                    this.inherit_sign = this.inherit_id > 0 ? "+" : "-";
                }
                break;
            case "-v":  // return +(-,-) => (-,-)
                this.inherit_signs.left = -1;
                this.inherit_signs.right = -1;
                if(isRoot) {
                    this.inherit_id = this.original_id;
                    this.inherit_sign = this.inherit_id > 0 ? "+" : "-";
                }
                break;
            case "+v": //return +(+,+) => (+,+)
                this.inherit_signs.left = 1;
                this.inherit_signs.right = 1;
                if(isRoot) {
                    this.inherit_id = this.original_id;
                    this.inherit_sign = this.inherit_id > 0 ? "+" : "-";
                }
                break;
        }
    };
    this.json = function () {
        var left_child = {};
        var right_child = {};
        var newNode = {};
        newNode.name = this.inherit_id + "( " + this.node_type + " )";
            // /*"O :="*/ this.original_id + " ( " + this.original_sign + ", " + this.node_symbol + " ) " +
            // ", " + this.inherit_id + " ( " + this.inherit_sign + ", " + this.node_symbol + " ) "
            // + this.inherit_signs.left + ", " + this.inherit_signs.right;/* +
            // /*"H :=( " + this.inherit_sign + ", " + this.node_symbol + " ) " +
            // "SH := ( " + this.inherit_signs.left + ", " + this.inherit_signs.right + " ) " +
            // "T := ( " + this.node_type + " ) " +
            // "IDs := ( " + this.original_id + ", " + this.inherit_id + " )";*/
        newNode.children = [];
        if(this.right_child != null) {
            right_child = this.right_child.json();
            newNode.children.push(right_child);
        }
        if(this.left_child != null) {
            left_child = this.left_child.json();
            newNode.children.push(left_child);
        }
        return newNode;
    };
}

// check if an element exists in array using a comparer function
// comparer : function(currentElement)
Array.prototype.inArray = function(comparer) {
    for(var i=0; i < this.length; i++) {
        if(comparer(this[i])) return true;
    }
    return false;
};

Array.prototype.getListStringify = function (valueToPrint) {
    var elements = "";
    for(var i = 0; i < this.length; i++){
        elements += i == 0 ? valueToPrint(this[i]) : "," + valueToPrint(this[i]);
    }
    return elements;
};

Array.prototype.countElements = function(comparer){
    var count = 0;
    for(var i = 0; i < this.length; i++){
        if(comparer(this[i])) count++;
    }
    return count;
};

// adds an element to the array if it does not already exist using a comparer
// function
Array.prototype.pushIfNotExist = function(element, comparer) {
    if (!this.inArray(comparer)) {
        this.push(element);
        return true;
    }
    return false;
}; 
