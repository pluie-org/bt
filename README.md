# bt
manage communication between browser tabs

### require

  html5 localStorage


### Initialize

    $v(document).ready(function() {
        $bt.init();
    }

### Internal Commands

    // append data on node to other browser tabs
    $bt.append('#test', '<b>it's cool to append</b>');
    // rewrite content on node to other browser tabs
    $bt.html('#test', '<b>it's cool to rewrite</b>');

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


### Demo

on chromium/chrome browser make sure to test on a web server (not directly file://)


enjoy !
