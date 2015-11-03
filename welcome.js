var debug = require("debug")("netatmo:welcome");
var log = require("debug")("netatmo:welcome:log");
var request = require("request");
var fs = require("fs");
var netatmo = require("./netatmo");

var auth = {
  "client_id": process.env.NETATMO_CLIENT_ID,
  "client_secret": process.env.NETATMO_CLIENT_SECRET,
  "username": process.env.NETATMO_USERNAME,
  "password": process.env.NETATMO_PASSWORD,
  "scope": "read_camera access_camera"
};

var api = new netatmo(auth);

api.getHomeData(function(err, json) {
    var home = json.body.homes[0];
    var lastEvent = home.events[0]
    debug('events', lastEvent);

    api.getCameraPicture({image_id: lastEvent.snapshot.id, key: lastEvent.snapshot.key}, function(err, data) {
       
        if (err) throw new Error("could not load image"); 
        debug(Buffer.isBuffer(data));
        
        fs.writeFile('image.jpg', data, "binary", function(err) {
            debug("Errors", err);
        });
    });

    
    var camera = home.cameras[0];
    ping(camera.vpn_url)
    .then(function(resp) {
        var url = getLocalLiveStreamUrl(resp.local_url);
        log("LOCAL URL", url);
    })
    .catch(function(err) {
        debug(err);
    });

});

function ping(vpn_url) {
    return new Promise(function(resolve, reject) {
        request({
            url: vpn_url + "/command/ping",
            method: "GET"
        }, function(err, response, body) {
            if (err || response.statusCode != 200) {
                reject(err);
            }
            body = JSON.parse(body);
            resolve(body);
        });
    });
}

function getLocalLiveStreamUrl(localUrl) {
    return localUrl + '/live/index.m3u8';
}



