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
 * Support: https://forum.iobroker.net/viewtopic.php?f=21&t=15187
 *  
 * Change Log
 *  0.2  Mic - Bug fix
 *  0.1  Mic - Initial release 
 *******************************************************************************************/


////////////////////////// CONFIGURATION ///////////////////////////////////////

// List of users (devices) we support. States will be created for each user
const USER_LIST = ["John", "Lisa"];   // For example:  ["John", "Jenny", "Pete"]

// URL to the Geofency folder on the webserver. Dont add "http://" or ""https://"".
const URL_WEBSERVER = 'mywebspace.de/geofency/'; // e.g. 'myserver.com/tools/geofency/'; Add a trailing slash!

// User name and password for Basic Authentification on your webserver
const USER_NAME_WEBSERVER  = 'john';
const PASSWORD_WEBSERVER  = 'secret-password';

// Path to the Geofency states in ioBroker
const STATE_PATH      = 'javascript.' + instance + '.' + 'geofency.';

// How often do you want to fetch the log file content? Use the button "Cron" on the top right corner...
const LOG_SCHEDULE  = "*/2 * * * *"; // alle 2 Minuten.

// Extended logging for debugging
const LOGGING = false;


////////////////////////// Stop editing here ///////////////////////////////////



/**
 * Executed on every script start.
 */
init();
function init() {
    // Create user states needed
    for (var i in USER_LIST) {
        createStatesUser(USER_LIST[i]); 
    }

    // Create states for everyone
    createStatesEveryone();

    // Schedule script to fetch data every x seconds, minutes, etc. for each device
    setTimeout(function() {
        schedule(LOG_SCHEDULE, function () {
           main(); 
        });
    }, 5000);

}


/**
 * Main function which fetches the log file entries and updates the states in ioBroker
 */
function main() {

    var statusURL = 'http://' + USER_NAME_WEBSERVER + ":" + PASSWORD_WEBSERVER + '@' + URL_WEBSERVER + 'geofency.log';

    var thisRequest = require("request");

    var thisOptions = {
      uri: statusURL,
      method: "GET",
      timeout: 5000,
      followRedirect: false,
      maxRedirects: 0
    };

    thisRequest(thisOptions, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            if (LOGGING) log('Geofency-Script: http request ausgeführt, kein Fehler dabei.')
            // get log entries into array, these are separated by new line in the file...
            var logArray = body.split(/\r?\n/); 
            
            // We process each log entry
            for (var i in logArray) {
                if (LOGGING) log('Logdatei von Server wird abgearbeitet.')
                // we check if we have a correct log entry, we check for term "Longitude"...
                if (logArray[i].includes('"Longitude"')) {
                    if (LOGGING) log('Validen Logeintrag gefunden:' + logArray[i])
                    // Here we have the log entry as JSON object.
                    var jsonObjLoop = JSON.parse(logArray[i]);

                    // Set states if something new happened
                    if(getState(STATE_PATH + m_SanitizeString(jsonObjLoop.Device) + '.dateMostRecent').val !== jsonObjLoop.LogDate) {
                        if (LOGGING) log('Der gefundene Log-Eintrag ist neu.')
                        // 0 - get a few states before we change these
                        var bUserAtHomeBefore    = getState(STATE_PATH + m_SanitizeString(jsonObjLoop.Device) + '.atHome').val;
                        var intAtHomeBeforeCount = getState(STATE_PATH + 'allAtHomeCount').val;
                        var currUsers            = getState(STATE_PATH + 'allAtHomePersons').val;                        

                       setTimeout(function() { // Delay of 1 second to make sure we have all states from above in the variables

                           // 1 - States for person
                            setState(STATE_PATH + m_SanitizeString(jsonObjLoop.Device) + '.dateMostRecent', jsonObjLoop.LogDate);
                            if (LOGGING) log('Akuelles Datum setzen für ' + m_SanitizeString(jsonObjLoop.Device) + ': ' + jsonObjLoop.LogDate);
                            if(jsonObjLoop.Entry === '1') setState(STATE_PATH + m_SanitizeString(jsonObjLoop.Device) + '.dateLastEntry', jsonObjLoop.LogDate);
                            if(jsonObjLoop.Entry === '0') setState(STATE_PATH + m_SanitizeString(jsonObjLoop.Device) + '.dateLastLeave', jsonObjLoop.LogDate);
                            if(jsonObjLoop.Entry === '1') {
                                setState(STATE_PATH + m_SanitizeString(jsonObjLoop.Device) + '.atHome', true);
                                if (LOGGING) log('At-Home-Status für ' + m_SanitizeString(jsonObjLoop.Device) + ' auf "true" gesetzt.');
                            } else {
                                setState(STATE_PATH + m_SanitizeString(jsonObjLoop.Device) + '.atHome', false);
                                if (LOGGING) log('At-Home-Status für ' + m_SanitizeString(jsonObjLoop.Device) + ' auf "false" gesetzt.');
                            }                         
                            
                            // 2 - States for everyone: Users
                            var newUsers;
                            if (jsonObjLoop.Entry === '1') {
                                newUsers = m_AddOrRemoveUser(currUsers, jsonObjLoop.Device, true);
                            } else {
                                newUsers = m_AddOrRemoveUser(currUsers, jsonObjLoop.Device, false);
                            }                
                            setState(STATE_PATH + 'allAtHomePersons', JSON.stringify(newUsers));                        
                            if (LOGGING) log('State "allAtHomePersons" gesetzt mit: ' + JSON.stringify(newUsers));
    
                            // 3 - States for everyone: Count
                            setState(STATE_PATH + 'allAtHomeCount', newUsers.length);
    
                            // Finally
                            if(jsonObjLoop.Entry === '1') {
                                log('Geofency: ' + jsonObjLoop.Device + ' arrived at home.');
                            } else {
                                log('Geofency: ' + jsonObjLoop.Device + ' left the home.');
                            }                        

                       }, 1000);

                    }
                }
            }
        }
        else
        {
            m_Log('Fehler bei http Request aufgetreten: ' + error, 'warn');
        }
    });

}

/**
 * Create states: for everyone
 */
function createStatesEveryone() {

    createState(STATE_PATH + 'allAtHomeCount', {
            "name": 'How many persons are at home',
            "type": "number",
            "def": 0,
            "read": true,
            "write": true
    });

    createState(STATE_PATH + 'allAtHomePersons', {
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
function createStatesUser(strDevice) {

    createState(STATE_PATH + m_SanitizeString(strDevice) + '.dateMostRecent', {
            "name": 'Date of most recent entry or leave',
            "type": "string",
            "def": '',
            "read": true,
            "write": true
    });
    createState(STATE_PATH + m_SanitizeString(strDevice) + '.dateLastEntry', {
            "name": 'Date of last ENTRY',
            "type": "string",
            "def": '',
            "read": true,
            "write": true
    });
    createState(STATE_PATH + m_SanitizeString(strDevice) + '.dateLastLeave', {
            "name": 'Date of last LEAVE',
            "type": "string",
            "def": '',
            "read": true,
            "write": true
    });
    createState(STATE_PATH + m_SanitizeString(strDevice) + '.atHome', {
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

    if (LOGGING) log('Funktion "m_AddOrRemoveUser", übergebener Wert "aUserList": ' + JSON.stringify(aUserList));
    if (LOGGING) log('Funktion "m_AddOrRemoveUser", übergebener Wert "strUser": ' + strUser);
    if (LOGGING) log('Funktion "m_AddOrRemoveUser", übergebener Wert "bAdd": ' + bAdd);

    // Prepare Array
    var aUserListM;
    if (m_myIsValueEmptyNullUndefined(aUserList)) {
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
 * @param {string} strMessage - die Message
 * @param {string} strType - don't add if [info], use "warn" for [warn] and "error" for [error]
 */
function m_Log(strMessage, strType) {
    var strMsgFinal = '[M] *** ' + strMessage + ' ***';
    if (strType === "error") {
        log(strMsgFinal, "error");
    } else if (strType === "warn") {
        log(strMsgFinal, "warn");
    } else {
        log(strMsgFinal, "info");
    }
}

/**
 * Checks if Array or String is not undefined, null or empty.
 * @param inputVar - Input Array or String, Number, etc.
 * @return true if it is undefined/null/empty, false if it contains value(s)
 * Array or String containing just whitespaces or >'< or >"< is considered empty
 */
function m_myIsValueEmptyNullUndefined(inputVar) {
    if (typeof inputVar !== 'undefined' && inputVar !== null) {
        var strTemp = JSON.stringify(inputVar);
        strTemp = strTemp.replace(/\s+/g, ''); // remove all whitespaces
        strTemp = strTemp.replace(/\"+/g, "");  // remove all >"<
        strTemp = strTemp.replace(/\'+/g, "");  // remove all >'<  
        if (strTemp !== '') {
            return false;            
        } else {
            return true;
        }
    } else {
        return true;
    }
}
