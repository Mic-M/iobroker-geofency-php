/******************************************************************************************
 * ---------------------------
 * GEOFENCY PHP SCRIPT
 * ---------------------------
 *
 * A Geofency log file is maintained through a PHP script on a webspace when entering 
 * or leaving a defined area with your mobile device.
 * The following script checks regularly the log files for updates and updates
 * ioBroker states accordingly.
 *
 * Visit https://github.com/Mic-M/iobroker.geofency-php for details.
 *  
 * Change Log
 *  - 0.1  Mic - Initial release 
 * 
 *******************************************************************************************/


////////////////////////// CONFIGURATION ///////////////////////////////////////

// List of users (devices) we support. States will be created for each user
var m_UserList = ["John", "Lisa"];   // For example:  ["John", "Jenny", "Pete"]

// URL to the Geofency folder on the webspace. Dont add "http://" or ""https://"".
var m_URL       = 'mywebspace.de/geofency/'; // e.g. 'myserver.com/tools/geofency/'; Add a trailing slash!

// http or https
var m_http      = 'http';

// User name and password for Basic Authentification on your webserver
var m_username  = 'john';
var m_password  = 'secret-password';

// Path to the Geofency states in ioBroker
var m_path      = 'javascript.0.geofency';

// How often do you want to fetch the log file content? Use the button "Cron" on the top right corner...
var m_schedule  = "*/2 * * * *"; // every 2 minutes


////////////////////////// Stop editing here ///////////////////////////////////



/**
 * Executed on every script start.
 */
init();
function init() {
    // Create user states needed
    for (var i in m_UserList) {
        m_CreateStatesForUser(m_UserList[i]); 
    }

    // Create states for everyone
    m_CreateStatesForEveryone();

    // Schedule script to fetch data every x seconds, minutes, etc. for each device
    // We use setTimeout() to execute 5s later and avoid error message on initial start if states not yet created.
    setTimeout(function() {
        schedule(m_schedule, function () {
           m_GetGeofencyDataFromPHP(); 
        });
    }, 5000);

}


/**
 * Main function which fetches the log file entries and updates the states in ioBroker
 */
function m_GetGeofencyDataFromPHP() {

    var statusURL = 'http://' + m_username + ":" + m_password + '@' + m_URL + 'geofency.log';

    var thisRequest = require("request");

    var thisOptions = {
      uri: statusURL,
      method: "GET",
      timeout: 1000,
      followRedirect: false,
      maxRedirects: 0
    };

    thisRequest(thisOptions, function(error, response, body) {
        if (!error && response.statusCode == 200) {

            // get log entries into array, these are separated by new line in the file...
            var logArray = body.split(/\r?\n/); 
            
            // We process each log entry
            for (var i in logArray) {

                // we check if we have a correct log entry, we check for term "Longitude"...
                if (logArray[i].includes('"Longitude"')) {
                    
                    // Here we have the log entry as JSON object.
                    jsonObjLoop = JSON.parse(logArray[i]);

                    // Set states if something new happened
                    if(getState(m_path + '.' + m_SanitizeString(jsonObjLoop.Device) + '.dateMostRecent').val !== jsonObjLoop.LogDate) {

                        // 0 - get a few states before we change these
                        var bUserAtHomeBefore = getState(m_path + '.' + m_SanitizeString(jsonObjLoop.Device) + '.atHome').val;
                        var intAtHomeBeforeCount = getState(m_path + '.allAtHomeCount').val;
                        
                       // 1 - States for person
                        setState(m_path + '.' + m_SanitizeString(jsonObjLoop.Device) + '.dateMostRecent', jsonObjLoop.LogDate);
                        if(jsonObjLoop.Entry === '1') setState(m_path + '.' + m_SanitizeString(jsonObjLoop.Device) + '.dateLastEntry', jsonObjLoop.LogDate);
                        if(jsonObjLoop.Entry === '0') setState(m_path + '.' + m_SanitizeString(jsonObjLoop.Device) + '.dateLastLeave', jsonObjLoop.LogDate);
                        if(jsonObjLoop.Entry === '1') {
                            setState(m_path + '.' + m_SanitizeString(jsonObjLoop.Device) + '.atHome', true);
                        } else {
                            setState(m_path + '.' + m_SanitizeString(jsonObjLoop.Device) + '.atHome', false);
                        }                         
                        
                        // 2 - States for everyone: Users
                        var currUsers = getState(m_path + '.allAtHomePersons').val;
                        var newUsers;
                        if (jsonObjLoop.Entry === '1') {
                            newUsers = m_AddOrRemoveUser(currUsers, jsonObjLoop.Device, true);
                        } else {
                            newUsers = m_AddOrRemoveUser(currUsers, jsonObjLoop.Device, false);
                        }                
                        setState(m_path + '.allAtHomePersons', JSON.stringify(newUsers));                        


                        // 3 - States for everyone: Count
                        setState(m_path + '.allAtHomeCount', newUsers.length);


                        // Finally
                        if(jsonObjLoop.Entry === '1') {
                            m_Log('Geofency: ' + jsonObjLoop.Device + ' arrived at home.');
                        } else {
                            m_Log('Geofency: ' + jsonObjLoop.Device + ' left the home.');
                        }                        


                    }
                }
            }
        }
        else
        {
            m_Log('Fehler bei http Request aufgetreten: ' + error, 'error');
        }
    });

}

/**
 * Create states: for everyone
 */
function m_CreateStatesForEveryone() {

    createState(m_path + '.allAtHomeCount', {
            "name": 'How many persons are at home',
            "type": "number",
            "def": 0,
            "read": true,
            "write": true
    });

    createState(m_path + '.allAtHomePersons', {
            "name": 'Who is currently at home',
            "type": "string",
            "def": '',
            "read": true,
            "write": true
    });


}

/**
 * Create states for a certain device
 */
function m_CreateStatesForUser(strDevice) {

    // Datenpunkte erstellen
    createState(m_path + '.' + m_SanitizeString(strDevice) + '.dateMostRecent', {
            "name": 'Date of most recent entry or leave',
            "type": "string",
            "def": '',
            "read": true,
            "write": true
    });
    createState(m_path + '.' + m_SanitizeString(strDevice) + '.dateLastEntry', {
            "name": 'Date of last ENTRY',
            "type": "string",
            "def": '',
            "read": true,
            "write": true
    });
    createState(m_path + '.' + m_SanitizeString(strDevice) + '.dateLastLeave', {
            "name": 'Date of last LEAVE',
            "type": "string",
            "def": '',
            "read": true,
            "write": true
    });
    createState(m_path + '.' + m_SanitizeString(strDevice) + '.atHome', {
            "name": 'Current at home status - true if yes, false if not',
            "type": "boolean",
            "def": '',
            "read": true,
            "write": true
    });

}


/**
 * Add or remove a user from a given array
 * @aUserList: List of users, like ["John", "Jenny", "Pete"]
 * @strUser: User to be added or removed
 * @bAdd Boolean - True if adding a user, False if removing a user
 */
function m_AddOrRemoveUser(aUserList, strUser, bAdd){

    // Prepare Array
    var aUserListM;
    if (aUserList === '') {
      aUserListM = [];  
    } else {
        aUserListM = JSON.parse(aUserList);
    }

    // Add or remove user
    var aNew = aUserListM;    
    if (bAdd === true) {
        // We need to add a user
        
        // At first we check if user is not yet existing
        var iCounter = 0;
        for (var i in aUserListM) {
            if (aUserListM[i] === strUser) {
                iCounter = iCounter + 1;
            }
        }
        if (iCounter === 0) {
            // Add user since it does not yet exist
            aNew.push(strUser);
        }

    } else if (bAdd === false) {
        // We need to remove a user
        for (var j in aUserListM) {
            if (aUserListM[j] === strUser) {
                delete aNew[j];
            }
        }
    }

    // Let's clean the new array, sort and return it
    aNew = aNew.filter(function(x){
      return (x !== (undefined || null || ''));
    });
    return aNew.sort();      

}

/**
 * Sanitizes a string.
 * Just keeps lower case letters, numbers, and replaces the rest with a single "-"
 * @strInput The String
 */
function m_SanitizeString(strInput) {
 
    var strT = strInput.toLowerCase();
    var strResult = strT.replace(/([^a-z0-9]+)/gi, '-');

    return strResult;

}

/**
 * Logs a message
 * @param string strMessage - die Message
 * @param string strType - don't add if [info], use "warn" for [warn] and "error" for [error]
 */
function m_Log(strMessage, strType) {
    strMsgFinal = '[M] *** ' + strMessage + ' ***';
    if (strType === "error") {
        log(strMsgFinal, "error");
    } else if (strType === "warn") {
        log(strMsgFinal, "warn");
    } else {
        log(strMsgFinal, "info");
    }
}

