<?php 

  /**
   * Geofency PHP Script as part of https://github.com/Mic-M/iobroker.geofency-php
   *
   * Check https://github.com/Mic-M/iobroker.geofency-php for the latest version.
   *
   * Many thanks to Stele99  @ https://www.symcon.de/forum/threads/23348-Geofency-mit-Webhook?p=212154#post212154 for the ídea for this script 
   * 
   * In case of any issues, check out https://github.com/Mic-M/iobroker.geofency-php
   * 
   * ---------------------------------------------------------------------------
   * Change Log
   *  - 0.1 - Mic-M - Initial version
   *
   */


  // ================== CONFIGURATION ==========================================
  
  // The path to the logfile on your webspace. If it is in the same folder as this php script, add a leading "./" to the file name.     
  $CONF["logfile"] = "./geofency.log";     
  
  // The list of allowed devices/users. Any other devices will be rejected by this script.
  // Note that this is an array, so for a single user, enter
  //      $CONF["AllowedDevices"] = Array("John");
  // Enter multiple users like this:
  //      $CONF["AllowedDevices"] = Array("John", "Lisa", "Bob");
  $CONF["AllowedDevices"]     = Array("John", "Lisa");

  // That's all to set up here.    

  // ================== STOP EDITING HERE=======================================
   
  // A few checks  
  
  // Check for the Geofency user agent
  if((!stristr($_SERVER["HTTP_USER_AGENT"],"Geofency"))){ 
      header("Status: 403");  
      die("Unallowed Client Used"); 
  } 
  // Check if device (user) is sent and correct 
  if (isset($_GET["device"])) { 
    $t_device = $_GET["device"]; 
  } else { 
      header("Status: 403"); 
      die("No Device Given"); 
  } 
 
  // Check if device is allowed per above list.
  if(!in_array($t_device, $CONF["AllowedDevices"])){ 
      header("Status: 403");  
      die("Device Not Allowed"); 
  } 

  // Get data
  $t_date       = @$_POST["date"]; 
  $t_entry      = ("1" == @$_POST["entry"]) ? "1" : "0"; 
  $t_location   = @$_POST["name"]; 
  $t_locationID = @$_POST["id"]; 
  $t_long       = @$_POST["longitude"]; 
  $t_lat        = @$_POST["latitude"]; 


  // Log String
  $log_single = '{ ' . '"LogDate":"' . date('Y-m-d H:i:s') . '", "ActionDate":"'.$t_date.'", "Device":"'.$t_device.'", "Location":"'. $t_location . '", "LocationID":"'.$t_locationID.'", "Entry":"'.$t_entry.'", "Longitude":"'.$t_long.'", "Latitude":"'.$t_lat . '" }';
 
 
  if (file_exists($CONF["logfile"])){

    // Put the current log file content into an array. Then we check if the current device is within the array; if yes, we remove the line. We want to have only the latest log entry per device in the log file (always just one per device).
    $fileArray = file($CONF["logfile"], FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $fileArrayNew = $fileArray;
    $count = 0;
    foreach ($fileArray as $value) {
      if(strpos($value, '"Device":"' . $t_device . '"')!==false) unset($fileArrayNew[$count]);  // Deletes the entry for the current user since we will later add a new log entry for the same user.
      $count = $count + 1;
    }
   
    // build a new log file string from $fileArrayNew and append the new log entry
    $log_new = '';
    foreach ($fileArrayNew as $value) {
      $log_new = $log_new . $value . "\n";
    }
    $log_new = $log_new . $log_single . "\n";


  } else {
  
    // There is no log file, so we create a new log with the new log entry
    $log_new = $log_single . "\n";
  
  }

  // Create/replace log file on server, we will not append. 
  file_put_contents($CONF["logfile"], $log_new); 


  // We were successfull, so we return a success message
  echo "Successfully added device '" . $t_device . "' to log."; 


?>