# bt

    Manage commnunication between browser tabs.
    this js lib can perform several actions on browser tabs like :
        - append/rewrite/synchro node on all (other) tabs or a specific tab (and possibly on specific frame context) eventually with callback.
        - reload all tabs or a specific tab with specified url or tab 's current url
        - perform your custom actions on all tabs or specific tab

### require

    html5 localStorage svan (pluie.org small vanilla jquery-like lib)


### Initialize

    $(document).ready(function() {
        $bt.init();
    }


### Internal Commands

    // append data on node to other browser tabs
    $bt.append('#test', "<b>it's cool to append</b>");

    // rewrite content on node to other browser tabs
    $bt.html('#test', "<b>it's cool to rewrite</b>");

    // append content to specific browser tab
    $bt.append('#test', "<b>it's cool to rewrite</b>", null, null, '1449974562012');

    // rewrite content to specified browser tab with callback
    $bt.html('#test', "<b>it's cool to rewrite</b>", null, function() { alert('callback'); }, '1449974562012');

    // append content to specified browser tab on specific frame
    $bt.append('#test', "<b>it's cool to rewrite</b>", 'frameName', null, '1449974562012');

    // perform a node synchro to other browser tabs
    $bt.sync('#test');

    // perform a node synchro to specified browser tab on specific frame with callback
    $bt.sync('#test', 'frameName', callback, '1449974562012');

    // reload other browser tabs
    $bt.reload();

    // reload specific browser tab to specific url
    $bt.reload(window.location.path+"?reloaded=1", '1449974562012');

    // get browser tab list
    $bt.list;

    // current browser tab id
    $bt.id;


### Custom Commands

    // define a new custom cmd
    $bt.CMD_CUSTOM = "customCmd";
    // treat custom command to other browser tabs
    $bt.on = function(cmd) {
        switch (cmd.name) {
            case $bt.CMD_CUSTOM :
                // do stuff
                $bt.log("custom command `'+cmd.name+'` with `'+cmd.customKey+'`');
            break;
        }
    }

    // send a custom command to other browser tabs
    $bt.send({ name : $bt.CMD_CUSTOM, customKey : 'customValue' });


### Bonus

    // alias localStorage : clear|rem|get|set
    $l
    // alias json : str|obj
    $j


### Demo

on chromium/chrome browser make sure to test on a web server (not directly file://)


enjoy !
