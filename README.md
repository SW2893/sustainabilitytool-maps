# Google Maps Explorer for SupplyChainSchool and SustainabilityTool GIS Data

This is a single-page web application for displaying public GIS data from the `SupplyChainSchool.co.uk` and `SustainabilityTool.com` sites.

## Getting started (admins)

 * Install Git for Windows from here: https://git-scm.com/download/win
   * Most will use the 64-bit version here: https://github.com/git-for-windows/git/releases/download/v2.33.0.windows.2/PortableGit-2.33.0.2-32-bit.7z.exe
 * After installing git then go to the Start Menu and type "Command Prompt" and open the command prompt then copy these two commands (obviously replace the user email and name with your details):
    * git config --global user.name "John Doe"
    * git config --global user.email johndoe@example.com  
 * Download visual studio Code for Windows from here: https://code.visualstudio.com/download
 * Open visual studio and go to the Source Control menu on the left hand menu (it looks like a little branch)
 * Select "Clone Repository" 
 * Select "Clone from GitHub" then enter "procedural-build/sustainabilitytool-maps"
 * you will be asked to enter your credentials for GitHub.  This opens a browser window and then enter your usrename/password
 * Then select a folder you want to put the code into (normally this is a folder called "git" in my home folder)
 * After opening the cloned code - select "master" in the bottom-left and change this to "origin/stage" - then you will have the "stage" copy of the code open

## Requesting access to this repository
 * Request from Mark or Christian to add you to the procedural-build members list - and then accept the invite.  This will allow you to push the changes you make back up.

## Pushing changes and making pull requests
 * Always work on the "stage" branch and push up to GitHub
 * After pushing to GitHub then go in your browser to https://github.com/procedural-build/sustainabilitytool-maps and then you should see a green warning saying that stage has changes and asking if you want to make a Pull Request.  Click on this and enter the fields to create a pull request.

## Quick start - making changes (admins)

 * Update the `mep/data.csv` CSV file with the latest data
 * Commit the changes into GitHub

Jenkins will parse the CSV file into a corresponding JSON data file (called `data.json`) and publish the files to the static file server.


