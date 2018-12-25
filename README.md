# iobroker.geofency-php
ioBroker script to receive Geofency entries/leaves via PHP

## About
With this set of scripts, you receive Geofency events into ioBroker states when entering or leaving a defined area with your mobile device. It works through your own Webspace (PHP required).
Multiple users are supported.

**Geofency App --> Your Webspace --> ioBroker**

## What's needed?
* A smart phone / mobile device with the [Geofency Time Tracking App](https://itunes.apple.com/app/id615538630).
* A webspace with PHP support
* [ioBroker](http://iobroker.net/) installation

## Why not using the ioBroker Geofency Adapter?
The [Geofency Adapter](https://github.com/ioBroker/ioBroker.geofency) is great, and I have used it before. However, it requires that your ioBroker is being accessed through the internet. For security reasons, I was looking for a different solution via my own webspace, from which the ioBroker  fetches the data.
If this is no issue for you, then I definitely recommend the Geofency Adapter, it is easy to use and way easier to set up.

## Installation Instructions

#### 1. Setup Folder on your Webspace

Create a new folder on your webspace (e.g. via FTP).
Setup this folder for basic authentification, typically by adding a .htaccess and .htpasswd file.

Example for the .htaccess file:
```
AuthUserFile /customers/4567813/websites/various/_geofency/.htpasswd
AuthType Basic
AuthName "Privat"
Require valid-user
```

Example for the .htpasswd file:
```
john:$apr1$I0kcu3WN$Rn8czFK8aobaEcnbvYxob1
```

You could use an online tool like [Htpasswd Generator](http://www.htaccesstools.com/htpasswd-generator/).

Try to access to your new folder via a Webbrowser, then a login window should appear. Log in with your user name and password from above to make sure it works.

There are plenty of instruction and support websites regarding the authentification, check out these resources if you have any issues.

### 2. index.php

1. Download file „index.php“ to your local computer. 
2. Open the file in a text editor and change the settings accordingly.
3. Upload the index.php to your geofency folder on your webspace.

### 3. Geofency App

1. Install the [Geofency App](https://itunes.apple.com/app/id615538630) on your mobile device.
2. Setup everything within the App accordingly, and make sure you define a location, named e.g. "Home", for your home.
3. Navigate to the Webhook setting of your location:
   - URLs for entry and exit: use the following syntax: ``http://mywebspace.de/geofency/index.php?device=John``. "John" should be your name or device name.
   - Post Format: Default (JSON-encoded: disabled)
   - Authentification: your user name and password from above.
4. Go back, save, and enter the Webhook again. Try to click on "Betreten". This should now generate the log file "geofency.log" on your webspace with several information inside. Click on "Verlassen", this should update the log file accordingly.
5. Once this is working, continue with the next step


### 4. iobroker_geofency-script.js

1. Download file „iobroker_geofency-script.js“ to your local computer, open the file and copy its contents into the clipboard.
2. Open your ioBroker adminstration page, navigate to the "Scripts" section, add a new JavaScript and paste the contents.
3. Change the name of the script e.g. to "Geofency-PHP" and save it. Make sure the script is **not** under the Global folder, that's simply not required and not a good idea at all.
4. Modify the settings in the script accordingly and don't miss to add your user name and password from above.
5. Save and activate the script.

### 5. Done

Wasn't that difficult, right? Now try with your mobile device to enter and leave as described before, and the states should change accordingly.

## Credits and other Geofency projects
* [ioBroker Geofency Adapter](https://github.com/ioBroker/ioBroker.geofency): 
* [Stele99](https://www.symcon.de/forum/threads/23348-Geofency-mit-Webhook?p=212154#post212154) for the PHP script idea

## Changelog
See script.

## Licence

MIT License

Copyright (c) 2018 Mic-M

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
