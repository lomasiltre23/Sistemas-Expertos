var express = require('express');
var bodyParser = require('body-parser');
var jsonfile = require('jsonfile');
var app = express();

app.use(express.static(__dirname + '/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/saveDictionary', function (req, res) {
    var jsonData = JSON.parse(req.body.dictionary);
    var file = __dirname + '/json/dictionary.json';
    jsonfile.writeFile(file,jsonData, function (err) {
        console.log(err);
    });
});

app.post('/saveRules', function (req, res) {
    var jsonData = JSON.parse(req.body.rules);
    var file = __dirname + '/json/rules.json';
    jsonfile.writeFile(file, jsonData, function (err) {
        console.log(err);
    })
});

app.post('/saveTree', function (req, res) {
    var jsonStr = JSON.stringify(req.body);
    var jsonData = JSON.parse(jsonStr);
    //console.log(jsonData);
    var file = __dirname + '/json/flare.json';
    jsonfile.writeFile(file, jsonData, function (err) {
        console.log(err);
    })
});

app.get('/', function (req, res) {
   res.sendFile('/index.html',{root: __dirname});
});

app.get('/getDictionary', function (req, res) {
    res.sendFile('/dictionary.json',{root: __dirname + '/json'});
});

app.get('/getRules', function (req, res) {
    res.sendFile('/rules.json', {root: __dirname + '/json'});
});

app.listen(8080, function () {
   console.log('Server Initialized');
});
